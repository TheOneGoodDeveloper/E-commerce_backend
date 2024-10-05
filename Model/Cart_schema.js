import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Assuming you have a User model
      required: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1, // Ensure the quantity is at least 1
        },
        price: {
          type: Number,
          required: true, // Store the price at the time of adding to cart
        },
        size: {
          type: String,
          required: true,
          enum: ["s", "m", "l", "xl", "xxl"], // Same size enums as in Product schema
        },
        color: {
          type: String,
          required: true, // Store the selected color for the product
        },
      },
    ],
    total_price: {
      type: Number,
      required: true,
      min: 0, // Ensure total price is non-negative
    },
  },
  { timestamps: true }
);
cartSchema.pre('save', function (next) {
  this.total_price = this.products.reduce((total, product) => {
    return total + product.price * product.quantity;
  }, 0);
  next();
});


export const cartModel = mongoose.model("Cart", cartSchema);
