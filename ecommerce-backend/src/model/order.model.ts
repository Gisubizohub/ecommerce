import mongoose, { Document, Schema, Types } from "mongoose";

export const ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface IOrderItem {
  productId: Types.ObjectId;
  quantity: number;
  price: number; // unit price at the time of purchase
}

export interface IOrder extends Document {
  userId: Types.ObjectId;
  items: IOrderItem[];
  totalPrice: number;
  status: OrderStatus;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: [1, "Quantity must be at least 1"] },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [orderItemSchema], validate: [(v: unknown[]) => v.length > 0, "Order must have at least one item"] },
    totalPrice: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ORDER_STATUSES, default: "pending" },
  },
  { timestamps: true },
);

const Order = mongoose.model<IOrder>("Order", orderSchema);
export default Order;
