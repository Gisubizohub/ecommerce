import { Router } from "express";
import {
  addCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  updateCategory,
} from "../controller/category.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validateObjectId } from "../middleware/validateObjectId.middleware";

const router = Router();

/**
 * @openapi
 * /categories:
 *   get:
 *     summary: List all categories
 *     tags: [Categories]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: A list of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Category' }
 */
router.get("/", authenticate, getCategories);

/**
 * @openapi
 * /categories/{id}:
 *   get:
 *     summary: Get a category by id
 *     tags: [Categories]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: The category }
 *       404: { description: Category not found }
 */
router.get("/:id", authenticate, validateObjectId, getCategoryById);

/**
 * @openapi
 * /categories:
 *   post:
 *     summary: Create a category (admin only)
 *     tags: [Categories]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CategoryInput' }
 *     responses:
 *       201: { description: Category created }
 *       400: { description: Invalid input }
 *       403: { description: Admin only }
 *       409: { description: Category name already exists }
 */
router.post("/", authenticate, authorize("admin"), addCategory);

/**
 * @openapi
 * /categories/{id}:
 *   put:
 *     summary: Update a category (admin only)
 *     tags: [Categories]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CategoryInput' }
 *     responses:
 *       200: { description: Category updated }
 *       404: { description: Category not found }
 */
router.put("/:id", authenticate, authorize("admin"), validateObjectId, updateCategory);

/**
 * @openapi
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category (admin only, must have no products)
 *     tags: [Categories]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Category deleted }
 *       400: { description: Category still has products }
 *       404: { description: Category not found }
 */
router.delete("/:id", authenticate, authorize("admin"), validateObjectId, deleteCategory);

export default router;
