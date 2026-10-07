import { UploadApiResponse } from "cloudinary";
import cloudinary from "../config/cloudinary";

export const uploadToCloudinary = (
  buffer: Buffer,
  folder = "products",
): Promise<UploadApiResponse> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Cloudinary upload failed"));
        resolve(result);
      },
    );
    stream.end(buffer);
  });

export const deleteFromCloudinary = async (publicId?: string): Promise<void> => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Failed to delete image from Cloudinary:", error);
  }
};
