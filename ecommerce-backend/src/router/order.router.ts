import { Router } from "express";
import {
  cancelOrder,
  createOrder,
  getOrderById,
  getOrders,
  updateOrderStatus,
} from "../controller/order.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validateObjectId } from "../middleware/validateObjectId.middleware";

const router = Router();

/**
 * @openapi
 * /orders:
 *   post:
 *     summary: Place an order (price is calculated by the server, stock is reduced)
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 items: { $ref: '#/components/schemas/OrderItemInput' }
 *     responses:
 *       201: { description: Order placed }
 *       400: { description: Invalid input or insufficient stock }
 *       404: { description: Product not found }
 */
router.post("/", authenticate, createOrder);

/**
 * @openapi
 * /orders:
 *   get:
 *     summary: List orders (admins see all, users see their own)
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, paid, shipped, delivered, cancelled] }
 *     responses:
 *       200:
 *         description: A list of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Order' }
 */
router.get("/", authenticate, getOrders);

/**
 * @openapi
 * /orders/{id}:
 *   get:
 *     summary: Get an order by id (owner or admin)
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: The order }
 *       404: { description: Order not found }
 */
router.get("/:id", authenticate, validateObjectId, getOrderById);

/**
 * @openapi
 * /orders/{id}/status:
 *   patch:
 *     summary: Update order status (admin only). Allowed - pending→paid|cancelled, paid→shipped|cancelled, shipped→delivered
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [pending, paid, shipped, delivered, cancelled], example: paid }
 *     responses:
 *       200: { description: Status updated }
 *       400: { description: Invalid status transition }
 *       403: { description: Admin only }
 *       404: { description: Order not found }
 */
router.patch("/:id/status", authenticate, authorize("admin"), validateObjectId, updateOrderStatus);

/**
 * @openapi
 * /orders/{id}/cancel:
 *   patch:
 *     summary: Cancel your own pending order (stock is returned)
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Order cancelled }
 *       400: { description: Only pending orders can be cancelled }
 *       404: { description: Order not found }
 */
router.patch("/:id/cancel", authenticate, validateObjectId, cancelOrder);

export default router;
