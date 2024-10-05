import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { userModel } from "../Model/user_schema.js";

// Middleware to authenticate JWT
export const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"];
  // const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ status: false, message: "Token not provided" });
  }

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

// Function to handle user login
export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists
    const user = await userModel.findOne({ email });

    // console.log(user);
    if (!user) {
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
        expiresIn: "1h", // Token expiration time
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

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone_number } = req?.body;
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        status: false,
        message: "Name, email, and password are required",
      });
    }

    // Check if email is already in use
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ status: false, message: "Email is already in use" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      phone_number,
      role: "customer",
      // address,
    });

    // Save the user to the database
    await newUser.save();

    return res.status(201).json({
      status: true,
      message: "User created successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone_number: newUser.phone_number,
        role: "customer",
        // address: newUser.address,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res
      .status(500)
      .json({ status: false, message: "Internal server error" });
  }
};

export const getAllUsers = async (req, res) => {
  if (req.user.role == "admin") {
    try {
      const alluser = await userModel.find({});
      // console.log(alluser);
      if (alluser) {
        return res.status(200).json({ message: "Users Data", alluser });
      } else {
        return res.status(400).json({ message: "No User Found" });
      }
    } catch (err) {
      return res.status(500).json({ message: "internal Server Error" });
    }
  } else {
    return res.status(401).json({ message: "Unauthorized Access" });
  }
};

export const getUserById = async (req, res) => {
  console.log(req.body);

  if (req.user.role === "customer") {
    try {
      const { UserId } = req.body;

      // Check if userId is provided
      if (!UserId) {
        return res
          .status(400)
          .json({ status: false, message: "User ID is required" });
      }

      const user = await userModel.findOne({ _id: UserId }).select('-password');

      if (!user) {
        return res
          .status(404)
          .json({ status: false, message: "No User Found" });
      } else {
        return res
          .status(200)
          .json({ status: true, message: "User Found", user });
      }
    } catch (err) {
      console.error(err); // Log the error for debugging purposes
      return res.status(500).json({ message: "Internal Server Error" });
    }
  } else {
    return res
      .status(403)
      .json({ status: false, message: "Unauthorized access" });
  }
};

export const deleteUser = async (params) => {};
