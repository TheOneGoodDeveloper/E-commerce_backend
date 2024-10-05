import express from "express";
import * as User from "../Controller/User_Controller.js";
import * as Product from "../Controller/Product_Controller.js";
import * as Cart from "../Controller/Cart_Controller.js";
import * as Category from "../Controller/Category_Controller.js";

const UserRoute = express.Router();

UserRoute.post("/login", User.userLogin);
UserRoute.post("/register", User.registerUser);
UserRoute.post("/productList", Product.getAllProducts);
UserRoute.get("/getAllProducts", Product.getAllProducts);
UserRoute.get("/filterProducts", Product.filterProducts);
UserRoute.post("/createCart", Cart.authMiddleware, Cart.createCart);
UserRoute.get("/getAllCategory", Category.getAllCategories);
UserRoute.get("/productByCategory", Product.productByCategory);
UserRoute.get("/getProductById", Product.getProductById);
UserRoute.post("/getUserById",User.authMiddleware,User.getUserById);
export default UserRoute;
