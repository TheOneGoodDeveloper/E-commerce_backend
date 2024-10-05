import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  cat_no: {
    type: Number,
    unique: true,
  },
  // description: {
  //   type: String,
  //   trim: true,
  // },
  image: { 
    type: String, 
    required: true 
  },
  is_deleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

categorySchema.pre("save", async function (next) {
  if (this.isNew) {
    // Find the highest cat_no in the collection
    const lastCategory = await mongoose
      .model("Categories")
      .findOne()
      .sort({ cat_no: -1 });

    // Set cat_no based on the highest cat_no found
    this.cat_no = lastCategory ? lastCategory.cat_no + 1 : 1; // Start from 1 if no categories exist
  }

  // Only update updatedAt, leave createdAt unchanged
  this.updatedAt = Date.now();
  next();
});

export const categoryModel = mongoose.model("Categories", categorySchema);
