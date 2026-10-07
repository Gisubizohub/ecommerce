import { Router } from "express";
import {
  addProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} from "../controller/product.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";
import { validateObjectId } from "../middleware/validateObjectId.middleware";

const router = Router();

/**
 * @openapi
 * /products:
 *   get:
 *     summary: List products (paginated, optional category filter)
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 10, maximum: 100 } }
 *       - { in: query, name: categoryId, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Paginated list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Product' }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 *                 total: { type: integer }
 *                 totalPages: { type: integer }
 */
router.get("/", authenticate, getProducts);

/**
 * @openapi
 * /products/{id}:
 *   get:
 *     summary: Get a product by id
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: The product }
 *       404: { description: Product not found }
 */
router.get("/:id", authenticate, validateObjectId, getProductById);

/**
 * @openapi
 * /products:
 *   post:
 *     summary: Create a product with an image (admin only)
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, price, categoryId, image]
 *             properties:
 *               name: { type: string, example: "Wireless Mouse" }
 *               price: { type: number, example: 25.5 }
 *               stock: { type: integer, example: 100 }
 *               categoryId: { type: string, example: "60c72b2f9b1d8b2884bf9600" }
 *               image: { type: string, format: binary }
 *     responses:
 *       201: { description: Product created }
 *       400: { description: Invalid input or missing image }
 *       403: { description: Admin only }
 *       404: { description: Category not found }
 */
router.post("/", authenticate, authorize("admin"), upload.single("image"), addProduct);

/**
 * @openapi
 * /products/{id}:
 *   put:
 *     summary: Update a product, optionally replacing its image (admin only)
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               price: { type: number }
 *               stock: { type: integer }
 *               categoryId: { type: string }
 *               image: { type: string, format: binary }
 *     responses:
 *       200: { description: Product updated }
 *       404: { description: Product not found }
 */
router.put("/:id", authenticate, authorize("admin"), validateObjectId, upload.single("image"), updateProduct);

/**
 * @openapi
 * /products/{id}:
 *   delete:
 *     summary: Delete a product and its image (admin only)
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Product deleted }
 *       404: { description: Product not found }
 */
router.delete("/:id", authenticate, authorize("admin"), validateObjectId, deleteProduct);

export default router;
