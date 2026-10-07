import mongoose from "mongoose";
import Category from "../model/category.model";
import Product from "../model/product.model";
import { asyncHandler } from "../utils/asyncHandler";
import { deleteFromCloudinary, uploadToCloudinary } from "../utils/cloudinaryUpload";
import { HttpError } from "../utils/httpError";

const parseNonNegative = (value: unknown, field: string): number => {
  const n = Number(value);
  if (value === "" || !Number.isFinite(n) || n < 0) {
    throw new HttpError(400, `${field} must be a number greater than or equal to 0`);
  }
  return n;
};

const assertCategoryExists = async (categoryId: unknown) => {
  if (!mongoose.isValidObjectId(categoryId)) {
    throw new HttpError(400, "categoryId is not a valid id");
  }
  if (!(await Category.exists({ _id: categoryId }))) {
    throw new HttpError(404, "Category not found");
  }
};

export const getProducts = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(String(req.query.page ?? "1"), 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "10"), 10) || 10, 1), 100);

  const filter: Record<string, unknown> = {};
  if (req.query.categoryId) {
    if (!mongoose.isValidObjectId(req.query.categoryId)) {
      throw new HttpError(400, "categoryId is not a valid id");
    }
    filter.categoryId = req.query.categoryId;
  }

  const [data, total] = await Promise.all([
    Product.find(filter)
      .populate("categoryId", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({ data, page, limit, total, totalPages: Math.ceil(total / limit) });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate("categoryId", "name");
  if (!product) throw new HttpError(404, "Product not found");
  res.status(200).json(product);
});

export const addProduct = asyncHandler(async (req, res) => {
  const { name, price, stock, categoryId } = req.body;

  if (!name || price === undefined || !categoryId) {
    throw new HttpError(400, "name, price and categoryId are required");
  }
  if (!req.file) throw new HttpError(400, "Product image is required (form-data field: image)");

  const parsedPrice = parseNonNegative(price, "price");
  const parsedStock = stock === undefined ? 0 : parseNonNegative(stock, "stock");
  await assertCategoryExists(categoryId);

  const upload = await uploadToCloudinary(req.file.buffer);

  try {
    const product = await Product.create({
      name,
      price: parsedPrice,
      stock: parsedStock,
      categoryId,
      imageUrl: upload.secure_url,
      imagePublicId: upload.public_id,
    });
    res.status(201).json({ message: "Product added", product });
  } catch (error) {
    await deleteFromCloudinary(upload.public_id); // don't leave orphaned images
    throw error;
  }
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, "Product not found");

  const { name, price, stock, categoryId } = req.body;

  // only whitelisted fields can be changed
  if (name !== undefined) product.name = name;
  if (price !== undefined) product.price = parseNonNegative(price, "price");
  if (stock !== undefined) product.stock = parseNonNegative(stock, "stock");
  if (categoryId !== undefined) {
    await assertCategoryExists(categoryId);
    product.categoryId = categoryId;
  }

  let oldPublicId: string | undefined;
  let newPublicId: string | undefined;
  if (req.file) {
    const upload = await uploadToCloudinary(req.file.buffer);
    oldPublicId = product.imagePublicId;
    newPublicId = upload.public_id;
    product.imageUrl = upload.secure_url;
    product.imagePublicId = upload.public_id;
  }

  try {
    await product.save();
  } catch (error) {
    await deleteFromCloudinary(newPublicId);
    throw error;
  }
  await deleteFromCloudinary(oldPublicId);

  res.status(200).json({ message: "Product updated successfully", product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new HttpError(404, "Product not found");

  await deleteFromCloudinary(product.imagePublicId);
  res.status(200).json({ message: "Product deleted successfully", product });
});
