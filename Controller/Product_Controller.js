import multer from "multer";
import fs from "fs";
import path from "path";
import { promisify } from "util";

import { productModel } from "../Model/Product_schema.js";
import { categoryModel } from "../Model/Categories_schema.js";

// Configure multer for handling multiple file uploads and renaming files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Assets/Products/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Default filename
  },
});

const upload = multer({ storage: storage }).array("images", 5);
const uploadFiles = promisify(upload);

// Function to handle file uploads
const handleFileUploads = (req, res, next) => {
  uploadFiles(req, res, (err) => {
    if (err) {
      return res
        .status(500)
        .json({ status: false, message: "File upload error" });
    }
    next();
  });
};

// Function to check if the product exists
const checkProductExists = async (name, gender, size, color) => {
  return await productModel.findOne({
    name,
    gender,
    size,
    color,
  });
};

const generateProductId = async (categoryId, productName) => {
  // Step 1: Sanitize product name (trim and convert to uppercase/lowercase if needed)
  const sanitizedProductName = productName.trim(0, 3);

  // Step 2: Get the first letter of the product name
  const firstThree = sanitizedProductName.toUpperCase();

  // Step 3: Count the number of products in the same category
  const countInCategory = await productModel.countDocuments({
    category: categoryId,
  });

  // Step 4: Fetch the category number (cat_no) from the category schema
  const category = await categoryModel.findById(categoryId);
  const categoryNumber = category.cat_no;

  // Step 5: Generate the new product ID
  const newProductId = `PAT0${countInCategory + 1}CAT0${categoryNumber}`;

  return newProductId;
};

export const createProduct = async (req, res) => {
  try {
    // Authorization check
    if (req.user.role !== "admin") {
      console.log(req.body);
      res.status(401).json({ error: "Unauthorized access" });
      return;
    }

    // Handle file uploads with a promise
    await new Promise((resolve, reject) => {
      handleFileUploads(req, res, (err) => {
        if (err) reject(err);
        resolve();
      });
    });

    // Extract and validate required fields from request body
    const {
      name,
      description,
      price,
      category,
      stock_quantity,
      gender,
      size,
      color,
    } = req.body;
    if (!name || !description || !price || !category) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Check if the product already exists based on name, gender, size, and color
    const existingProduct = await checkProductExists(name, gender, size, color);
    if (existingProduct) {
      return res
        .status(400)
        .json({ error: "Product with these specifications already exists" });
    }

    // Process uploaded files and prepare for saving
    const images = req.files.map((file) => {
      const extension = path.extname(file.originalname);
      const uniqueName = `product-${Date.now()}${extension}`;
      const newPath = path.join("Assets/Products", uniqueName);
      fs.renameSync(file.path, newPath);
      return newPath;
    });

    // Generate a product ID and create a new product entry
    const productId = await generateProductId(category, name);
    const newProductData = {
      product_id: productId,
      name,
      description,
      price,
      category,
      stock_quantity,
      gender,
      size,
      color,
      images,
    };

    const newProduct = new productModel(newProductData);
    await newProduct.save();

    // Indicate successful product creation
    res.status(201).json({
      data: {
        message: "Product created successfully",
        newProduct,
      },
    });
  } catch (error) {
    // Handle any errors that occur
    console.error("Error in product creation:", error);
    res
      .status(500)
      .json({ error: "Server error occurred while creating the product" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    // Check user authorization
    if (req.user.role !== "admin") {
      return res
        .status(401)
        .json({ status: false, message: "No Authorization" });
    }

    // Handle file uploads
    await new Promise((resolve, reject) => {
      handleFileUploads(req, res, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });

    // Extract fields from req.body
    const {
      id,
      name,
      description,
      price,
      categoryId,
      stock_quantity,
      gender,
      size,
      color,
    } = req.body;
    console.log(req.body);
    // Check if product ID is provided
    if (!id) {
      return res
        .status(400)
        .json({ status: false, message: "Product ID is required" });
    }

    // Check required fields
    if (
      !name ||
      !description ||
      !price ||
      !categoryId ||
      !stock_quantity ||
      !gender ||
      !size ||
      !color
    ) {
      return res
        .status(400)
        .json({ status: false, message: "Please enter the required fields" });
    }

    // Find existing product by ID
    const existingProduct = await productModel.findById(id);
    if (!existingProduct) {
      return res
        .status(404)
        .json({ status: false, message: "Product not found" });
    }

    // Prepare update data
    const updateData = {
      name: name || existingProduct.name,
      description: description || existingProduct.description,
      price: price || existingProduct.price,
      category: categoryId || existingProduct.category,
      stock_quantity: stock_quantity || existingProduct.stock_quantity,
      size: size || existingProduct.size,
      color: color || existingProduct.color,
      gender: gender || existingProduct.gender,
      isProfileUpdated: true,
    };

    // Process and rename files if new ones are uploaded
    if (req.files && req.files.length > 0) {
      // Remove old images
      existingProduct.images.forEach((imagePath) => {
        fs.unlink(imagePath, (err) => {
          if (err) console.error("Failed to remove old image:", err);
        });
      });

      // Save new images
      const images = req.files.map((file) => {
        const ext = path.extname(file.originalname);
        const date = Date.now();
        const newFilename = `product-${date}${ext}`;
        const newFilePath = path.join("Assets/Products", newFilename);
        fs.renameSync(file.path, newFilePath);
        return newFilePath;
      });

      // Assign new images to product
      updateData.images = images;
    }

    // Update product
    const updatedProduct = await productModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res
        .status(404)
        .json({ status: false, message: "Product update failed" });
    }

    console.log("Product updated successfully");
    return res.status(200).json({
      status: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: false, message: "Internal Server Error" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    // Check user authorization
    if (req.user.role !== "admin") {
      return res
        .status(401)
        .json({ status: false, message: "No Authorization" });
    }

    // Get the product ID from the request body
    const { productId } = req.body;

    // Check if product ID is provided
    if (!productId) {
      return res
        .status(400)
        .json({ status: false, message: "Product ID is required" });
    }

    // Find the product by its ID
    const product = await productModel.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ status: false, message: "Product not found" });
    }

    // Remove associated images from the file system
    if (product.images && product.images.length > 0) {
      product.images.forEach((imagePath) => {
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error("Failed to delete image:", err);
          }
        });
      });
    }

    // Delete the product from the database
    await productModel.findByIdAndDelete(productId);

    console.log("Product deleted successfully");
    return res
      .status(200)
      .json({ status: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: false, message: "Internal Server Error" });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await productModel.find().populate("category").exec();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error });
  }
};

export const filterProducts = async (req, res) => {
  try {
    const {
      size,
      color,
      minPrice,
      maxPrice,
      sortBy = "price",
      order = "asc",
    } = req.query;

    const filterConditions = {};

    if (size) filterConditions.size = size;
    if (color) filterConditions.color = color;

    if (minPrice || maxPrice) {
      filterConditions.price = {};
      if (minPrice) filterConditions.price.$gte = parseFloat(minPrice);
      if (maxPrice) filterConditions.price.$lte = parseFloat(maxPrice);
    }
    console.log(filterConditions);

    const sortOrder = order === "desc" ? -1 : 1;

    const filteredProducts = await productModel
      .find(filterConditions)
      .sort({ [sortBy]: sortOrder });

    // Handle no products found
    if (filteredProducts.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    return res.status(200).json({ products: filteredProducts });
  } catch (error) {
    console.error("Error filtering products:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const filterByCategory = (query, category) => {
  if (category) {
    query.category = category;
  }
};

const filterByGender = (query, gender) => {
  if (gender) {
    query.gender = gender;
  }
};

const filterByPrice = (query, minPrice, maxPrice) => {
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
};

export const productByCategory = async (req, res) => {
  try {
    const { category, gender, minPrice, maxPrice } = req.query;

    // Initialize an empty query object
    const query = {};

    // Apply category filter by finding the category by name
    if (category) {
      const categoryData = await categoryModel.findOne({ name: category });
      if (categoryData) {
        query.category = categoryData._id; // Use the ObjectId of the found category
      } else {
        // If no category found, return no products
        return res.status(404).json({
          success: false,
          message: "Category not found.",
        });
      }
    }

    // Apply other filters
    gender ? (query.gender = gender) : "";
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = minPrice;
      if (maxPrice) query.price.$lte = maxPrice;
    }

    // Fetch products based on the combined filters
    const products = await productModel.find(query).populate("category");

    // Return the filtered products
    return res.status(200).json({
      success: true,
      message: "Fetching product by Category",
      data: products,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error. Unable to fetch products.",
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { productId } = req.query;
    if (!productId) {
      return res
        .status(400)
        .json({ status: false, message: "Product ID is required" });
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ status: false, message: "Product not found" });
    }

    return res.status(200).json({
      status: true,
      message: "Product fetched successfully",
      product,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({
        status: false,
        message: "Server error. Unable to fetch product.",
      });
  }
};
