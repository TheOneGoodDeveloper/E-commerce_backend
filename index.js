import express from "express";
import connectDatabase from "./Model/db.js";
import AdminRoute from "./Routes/Admin_Route.js";
import UserRoute from "./Routes/User_Route.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
  })
);
const port = 4000;
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);
app.use(
  "/Assets/categories/",
  express.static(path.join(__dirname, "Assets/categories"))
);
app.use(
  "/Assets/Products/",
  express.static(path.join(__dirname, "Assets/Products"))
);

app.use("/admin", AdminRoute);
app.use("/", UserRoute);

connectDatabase();
app.listen(port, () => {
  console.log(`Backend Server is Running ${port}`);
});
