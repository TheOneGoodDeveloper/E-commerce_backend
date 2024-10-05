import jwt from "jsonwebtoken";
import { cartModel } from "../Model/Cart_schema.js";
import { productModel } from "../Model/Product_schema.js";

export const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) next();

  jwt.verify(
    token,
    process.env.JWT_SECRET || "Evvi_Solutions_Private_Limited",
    (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res
            .status(401)
            .json({ status: false, statusCode: 700, message: "Token expired" });
        } else {
          return res
            .status(401)
            .json({ status: false, message: "Invalid token" });
        }
      }

      req.user = decoded;
      next();
    }
  );
};

export const createCart = async (req, res) => {
  const { itemId, quantity } = req.body;

  // Check if user is logged in
  if (req.session.userId) {
    // User is logged in, save to database
    try {
      const cart = await Cart.findOne({ userId: req.session.userId });
      if (cart) {
        // Update existing cart
        const itemIndex = cart.items.findIndex(
          (item) => item.itemId === itemId
        );
        if (itemIndex > -1) {
          // Update quantity if item already exists
          cart.items[itemIndex].quantity += quantity;
        } else {
          // Add new item
          cart.items.push({ itemId, quantity });
        }
      } else {
        // Create new cart for user
        const newCart = new Cart({
          userId: req.session.userId,
          items: [{ itemId, quantity }],
        });
        await newCart.save();
      }
      res.status(200).send("Item added to cart");
    } catch (error) {
      res.status(500).send("Error saving to cart");
    }
  } else {
    // User is not logged in, save to session
    if (!req.session.cart) {
      req.session.cart = [];
    }
    const itemIndex = req.session.cart.findIndex(
      (item) => item.itemId === itemId
    );
    if (itemIndex > -1) {
      // Update quantity if item already exists
      req.session.cart[itemIndex].quantity += quantity;
    } else {
      // Add new item
      req.session.cart.push({ itemId, quantity });
    }
    res
      .status(200)
      .json({ message: "Item added to session cart", data: req.session });
  }
};


export const updateCartItem = async (req, res) => {
  const { itemId, quantity } = req.body;

  if (req.session.userId) {
    // User is logged in, update in database
    try {
      const cart = await Cart.findOne({ userId: req.session.userId });
      if (!cart) return res.status(404).send("No cart found");

      const itemIndex = cart.items.findIndex((item) => item.itemId === itemId);
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity = quantity;
        await cart.save();
        res.status(200).send("Cart item updated");
      } else {
        res.status(404).send("Item not found in cart");
      }
    } catch (error) {
      res.status(500).send("Error updating cart item");
    }
  } else {
    // User is not logged in, update in session
    const itemIndex = req.session.cart.findIndex((item) => item.itemId === itemId);
    if (itemIndex > -1) {
      req.session.cart[itemIndex].quantity = quantity;
      res.status(200).send("Cart item updated in session");
    } else {
      res.status(404).send("Item not found in session cart");
    }
  }
};