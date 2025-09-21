import express from "express";
import Product from "./models/ProductMongoose.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const categories = await Product.find().distinct("category");
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

export default router;
