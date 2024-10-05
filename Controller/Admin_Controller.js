import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { userModel } from "../Model/user_schema.js";

export const authMiddleware = (req, res, next) => {
  const token = req?.headers["authorization"]
    ? req?.headers["authorization"]
    : "";
  if (!token) {
    return res
      .status(200)
      .json({ status: false, message: "Token not provided" });
  }
  // token = token.split(" ")[1];

  jwt.verify(token, "Evvi_Solutions_Private_Limited", (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res
          .status(200)
          .json({ status: false, statusCode: 700, message: "Token expired" });
      } else {
        return res
          .status(200)
          .json({ status: false, message: "Invalid token" });
      }
    }

    req.user = decoded;
    next();
  });
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists
    const user = await userModel?.findOne({ email });
    // console.log(user);
    if (!user && user.role != " admin") {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // Compare the password with the hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res
        .status(401)
        .json({ status: false, message: "Invalid password" });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "Evvi_Solutions_Private_Limited",
      {
        expiresIn: "5h", // Token expiration time
      }
    );
    // console.log(token);

    // Respond with the token and user info
    return res
      .status(200)
      .header("auth-token", token)
      .json({
        status: true,
        message: "Login successful",
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
  } catch (error) {
    return res
      .status(500)
      .json({ status: false, message: "Internal server error", error });
  }
};
