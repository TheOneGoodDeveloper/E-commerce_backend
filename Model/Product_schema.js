import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    product_id: {
      type: String,
      required: true, // Ensure product_id is unique
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0, // Price must be a non-negative number
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Categories",
      required: true,
    },
    // vendor: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "User",
    //   required: true,
    // },
    stock_quantity: {
      type: Number,
      required: true,
      min: 0, // Stock quantity must be a non-negative number
    },
    gender: {
      type: String,
      required: true,// Example enums for gender
    },
    size: {
      type: String,
      required: true, // Example enums for size
    },
    color: {
      type: String,
      required: true,
    },
    images: [String],
    rating: {
      type: Number,
      default: 0,
      min: 0, // Rating must be a non-negative number
      max: 5, // Rating should not exceed 5
    },
  },
  { timestamps: true }
);

export const productModel = mongoose.model("Product", productSchema);
