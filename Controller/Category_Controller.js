import multer from "multer";
import fs from "fs";
import path from "path";

import { categoryModel } from "../Model/Categories_schema.js";

export const createCategory = async (req, res) => {
  if (req.user.role == "admin") {
    const { name } = req.body;
    const image = req.file ? req.file.path : null;

    if (!name || !image) {
      return res
        .status(400)
        .json({ message: "Please Enter the Required Fields including image" });
    }

    const existingCategory = await categoryModel.findOne({
      name: name,
      is_deleted: false,
    });
    if (existingCategory) {
      return res.status(200).json({
        status: false,
        message: "Category with this name already exists.",
      });
    }

    const categoryData = { name, image };
    const newCategory = new categoryModel(categoryData);
    await newCategory.save();

    return res
      .status(200)
      .json({ status: true, message: "Category created successfully" });
  } else {
    return res.status(401).json({ status: false, message: "No Authorization" });
  }
};

export const updateCategory = async (req, res) => {
  console.log(req.body);
  console.log(req.file);

  if (req.user.role === "admin") {
    const { categoryId, name } = req.body;
    const newImage = req.file ? req.file.path : null;

    if (!categoryId || !name) {
      return res
        .status(400)
        .json({ status: false, message: "Please enter Required Fields" });
    }

    try {
      // Find the category to check for the existing image
      const category = await categoryModel.findById(categoryId);
      if (!category) {
        return res
          .status(404)
          .json({ success: false, message: "Category not found" });
      }

      // Delete the old image if a new one is uploaded
      if (newImage && category.image) {
        const oldImagePath = path.join(process.cwd(), category.image);
        try {
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath); // Delete the old image
          }
        } catch (unlinkError) {
          return res.status(500).json({
            success: false,
            message: "Error deleting old image",
            error: unlinkError.message,
          });
        }
      }

      // Update the category with the new data and image (if provided)
      const updateData = { name };
      if (newImage) {
        updateData.image = newImage;
      } else {
        updateData.image = category.image; // Keep the old image if no new one is uploaded
      }

      const updatedCategory = await categoryModel.findByIdAndUpdate(
        categoryId,
        updateData,
        { new: true, runValidators: true }
      );

      return res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: updatedCategory,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error", error: error.message });
    }
  } else {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized Access" });
  }
};


export const deleteCategory = async (req, res) => {
  try {
    if (req.user.role === "admin") {
      const { id } = req.body;
      console.log(req.body);
      // Check if category ID is provided
      if (!id) {
        return res.status(400).json({
          status: false,
          message: "Category ID is required",
        });
      }

      // Find the category by its ID
      const category = await categoryModel.findById(id);
      if (!category) {
        return res.status(404).json({
          status: false,
          message: "Category not found",
        });
      }

      // Delete the associated image if it exists
      if (category.image) {
        const imagePath = path.join(process.cwd(), category.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath); // Delete the image file
        }
      }

      // Delete the category from the database (hard delete)
      await categoryModel.findByIdAndUpdate(
        id,
        { is_deleted: true },
        { new: true }
      );
      console.log("Category and image deleted successfully");
      return res.status(200).json({
        status: true,
        message: "Category and image deleted successfully",
      });
    } else {
      return res
        .status(401)
        .json({ status: false, message: "No Authorization" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ status: false, message: "Internal Server Error" });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await categoryModel.find({ is_deleted: false });
    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: categories,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: " Internel Server Error: " });
  }
};
