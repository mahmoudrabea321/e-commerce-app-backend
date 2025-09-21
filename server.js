import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import seedRoute from "./seedRoute.js";
import ProductRoute from "./productRoute.js";
import userRouter from "./userRoute.js";
import orderRouter from "./orderRoute.js";
import paypalRoutes from "./paypalRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import adminRouter from "./adminRoutes.js";

dotenv.config();
const app = express();

// ---- MongoDB connection ----
mongoose
  .connect(process.env.DATABASE_URL || "mongodb://localhost:27017/ecommerce")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ---- Middleware ----
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
// request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request body:', req.body);
  }
  next();
});
// ---- Uploads folder setup ----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "/uploads")));
app.use('/images', express.static(path.join(__dirname, 'uploads/images')));

// ---- Routes ----
app.use("/api/paypal", paypalRoutes);
app.use("/api/seed", seedRoute);
app.use("/api/products", ProductRoute);
app.use("/api/users", userRouter);
app.use("/api/orders", orderRouter);
app.use("/api/categories", categoryRoutes);
app.use("/api/admin", adminRouter);

// ---- Root route ----
app.get("/", (req, res) => {
  res.json({ message: "E-commerce API is working!" });
});

// ---- Start server ----
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
