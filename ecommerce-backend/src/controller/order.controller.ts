import mongoose from "mongoose";
import Order, { IOrder, IOrderItem, ORDER_STATUSES, OrderStatus } from "../model/order.model";
import Product from "../model/product.model";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../utils/httpError";

// Allowed status changes
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

const round2 = (n: number) => Math.round(n * 100) / 100;

const restoreStock = async (items: { productId: unknown; quantity: number }[]) => {
  await Promise.all(
    items.map((i) => Product.updateOne({ _id: i.productId }, { $inc: { stock: i.quantity } })),
  );
};

// Moves an order to a new status only if it is still in the status we read
// (guards against two requests changing the same order at once).
const changeStatus = async (order: IOrder, next: OrderStatus): Promise<IOrder> => {
  if (!TRANSITIONS[order.status].includes(next)) {
    throw new HttpError(400, `Cannot change order status from "${order.status}" to "${next}"`);
  }
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: order.status },
    { status: next },
    { new: true },
  );
  if (!updated) throw new HttpError(409, "Order was modified by another request, please retry");

  if (next === "cancelled") await restoreStock(updated.items);
  return updated;
};

export const createOrder = asyncHandler(async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, "items must be a non-empty array of { productId, quantity }");
  }

  // validate + merge duplicate products
  const wanted = new Map<string, number>();
  for (const item of items) {
    if (!mongoose.isValidObjectId(item?.productId)) {
      throw new HttpError(400, "Every item needs a valid productId");
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new HttpError(400, "Every item needs an integer quantity of at least 1");
    }
    const id = String(item.productId);
    wanted.set(id, (wanted.get(id) ?? 0) + item.quantity);
  }

  const reserved: { productId: string; quantity: number }[] = [];
  const orderItems: IOrderItem[] = [];
  let total = 0;

  try {
    for (const [productId, quantity] of wanted) {
      // atomic: only decrements when enough stock is left
      const product = await Product.findOneAndUpdate(
        { _id: productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true },
      );

      if (!product) {
        const exists = await Product.exists({ _id: productId });
        throw new HttpError(
          exists ? 400 : 404,
          exists ? `Insufficient stock for product ${productId}` : `Product ${productId} not found`,
        );
      }

      reserved.push({ productId, quantity });
      orderItems.push({
        productId: product._id as mongoose.Types.ObjectId,
        quantity,
        price: product.price,
      });
      total += product.price * quantity;
    }

    const order = await Order.create({
      userId: req.user!.userId,
      items: orderItems,
      totalPrice: round2(total),
    });

    res.status(201).json({ message: "Order placed", order });
  } catch (error) {
    await restoreStock(reserved); // roll back any stock we already took
    throw error;
  }
});

export const getOrders = asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (req.user!.role !== "admin") filter.userId = req.user!.userId;

  if (req.query.status) {
    if (!ORDER_STATUSES.includes(req.query.status as OrderStatus)) {
      throw new HttpError(400, `status must be one of: ${ORDER_STATUSES.join(", ")}`);
    }
    filter.status = req.query.status;
  }

  const orders = await Order.find(filter)
    .populate("items.productId", "name imageUrl")
    .sort({ createdAt: -1 });
  res.status(200).json(orders);
});

const findVisibleOrder = async (id: string, user: { userId: string; role: string }) => {
  const filter: Record<string, unknown> = { _id: id };
  if (user.role !== "admin") filter.userId = user.userId;
  const order = await Order.findOne(filter);
  if (!order) throw new HttpError(404, "Order not found");
  return order;
};

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await findVisibleOrder(req.params.id, req.user!);
  await order.populate("items.productId", "name imageUrl");
  res.status(200).json(order);
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!ORDER_STATUSES.includes(status)) {
    throw new HttpError(400, `status must be one of: ${ORDER_STATUSES.join(", ")}`);
  }
  const order = await Order.findById(req.params.id);
  if (!order) throw new HttpError(404, "Order not found");

  const updated = await changeStatus(order, status);
  res.status(200).json({ message: "Order status updated", order: updated });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await findVisibleOrder(req.params.id, req.user!);
  if (order.status !== "pending") {
    throw new HttpError(400, "Only pending orders can be cancelled");
  }
  const updated = await changeStatus(order, "cancelled");
  res.status(200).json({ message: "Order cancelled", order: updated });
});
