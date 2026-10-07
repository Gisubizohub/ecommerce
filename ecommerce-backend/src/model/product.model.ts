import mongoose, { Document, Schema, Types } from "mongoose";

export interface IProduct extends Document {
  name: string;
  price: number;
  stock: number;
  categoryId: Types.ObjectId;
  imageUrl: string;
  imagePublicId: string;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    price: { type: Number, required: [true, "Price is required"], min: [0, "Price cannot be negative"] },
    stock: { type: Number, required: true, min: [0, "Stock cannot be negative"], default: 0 },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: [true, "categoryId is required"], index: true },
    imageUrl: { type: String, required: true },
    imagePublicId: { type: String, required: true },
  },
  { timestamps: true },
);

const Product = mongoose.model<IProduct>("Product", productSchema);
export default Product;
