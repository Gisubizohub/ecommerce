import Category from "../model/category.model";
import Product from "../model/product.model";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../utils/httpError";

export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.status(200).json(categories);
});

export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new HttpError(404, "Category not found");
  res.status(200).json(category);
});

export const addCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name) throw new HttpError(400, "name is required");

  const category = await Category.create({ name, description });
  res.status(201).json({ message: "Category created", category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name;
  if (description !== undefined) update.description = description;

  const category = await Category.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  });
  if (!category) throw new HttpError(404, "Category not found");
  res.status(200).json({ message: "Category updated", category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  if (await Product.exists({ categoryId: req.params.id })) {
    throw new HttpError(400, "Cannot delete a category that still has products");
  }
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new HttpError(404, "Category not found");
  res.status(200).json({ message: "Category deleted", category });
});
