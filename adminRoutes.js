// i wanna to add route for delete product
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import slugify from "slugify";
import { isAuth, isAdmin } from "./utils.js";
import Product from "./models/ProductMongoose.js";
import Order from "./models/OrderMongoose.js";
import User from "./models/UserMongoose.js";

const router = express.Router();

//  Enhanced Multer setup
const uploadDir = path.join(process.cwd(), "uploads", "images");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  c6onsole.log('✅ Created uploads directory:', uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext)
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9_-]/g, '');
    
    cb(null, `${baseName}-${Date.now()}${ext}`);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 
  }
});
//  ADMIN: PRODUCTS

// Create product 
router.post(
  "/products",
  isAuth,
  isAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      console.log("=== PRODUCT CREATION REQUEST ===");
      console.log("Request body:", req.body);
      console.log("Uploaded file:", req.file);

      // Validate required fields
      const requiredFields = ['name', 'price', 'brand', 'category', 'countInStock', 'description'];
      const missingFields = requiredFields.filter(field => !req.body[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          message: `Missing required fields: ${missingFields.join(', ')}` 
        });
      }

      // Check if product name already exists
      const existingProduct = await Product.findOne({ name: req.body.name });
      if (existingProduct) {
        return res.status(400).json({ 
          message: "Product with this name already exists" 
        });
      }

      const product = new Product({
        name: req.body.name,
        slug: slugify(req.body.name, { lower: true, strict: true }),
        image: req.file ? `/uploads/images/${req.file.filename}` : "/uploads/images/default-product.png",        category: req.body.category,
        price: Number(req.body.price),
        brand: req.body.brand,
        countInStock: Number(req.body.countInStock),
        description: req.body.description,
      });

      const createdProduct = await product.save();
      
      console.log(" Product created successfully:", createdProduct._id);
      
      res.status(201).json(createdProduct);
    } catch (err) {
      console.error(" Create product error:", err);
      
      if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(error => error.message);
        return res.status(400).json({ 
          message: "Validation Error",
          errors: errors 
        });
      }
      
      if (err.code === 11000) {
        return res.status(400).json({ 
          message: "Product with this name or slug already exists" 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to create product",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
);

// Get all products
router.get("/products", isAuth, isAdmin, async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (err) {
    console.error(" Get products error:", err);
    res.status(500).json({ message: "Failed to load products" });
  }
});

// Get single product by ID
router.get("/products/:id", isAuth, isAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error(" Get product error:", err);
    res.status(500).json({ message: "Failed to load product" });
  }
});

// Update product
router.put(
  "/products/:id",
  isAuth,
  isAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: "Product not found" });

      product.name = req.body.name ?? product.name;
      product.slug = slugify(product.name, { lower: true });
      product.price = req.body.price !== undefined ? Number(req.body.price) : product.price;
      product.category = req.body.category ?? product.category;
      product.brand = req.body.brand ?? product.brand;
      product.countInStock = req.body.countInStock !== undefined 
        ? Number(req.body.countInStock) 
        : product.countInStock;
      product.description = req.body.description ?? product.description;

      if (req.file) {
        product.image = `/uploads/images/${req.file.filename}`;
      }

      const updated = await product.save();
      res.json(updated);
    } catch (err) {
      console.error(" Update product error:", err);
      res.status(500).json({ message: "Failed to update product" });
    }
  }
);

// Delete product
router.delete("/products/:id", isAuth, isAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
   
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error(" Delete product error:", err);
    res.status(500).json({ message: "Failed to delete product" });
  }
});

// Dashboard summary route
router.get("/summary", isAuth, isAdmin, async (req, res) => {
  try {
    const numUsers = await User.countDocuments();
    const numOrders = await Order.countDocuments();
    const numProducts = await Product.countDocuments();

    const salesData = await Order.aggregate([
      { $group: { _id: null, totalSales: { $sum: "$totalPrice" } } },
    ]);

    const productCategories = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    res.json({
      users: { numUsers },
      orders: { 
        numOrders, 
        totalSales: salesData[0]?.totalSales || 0 
      },
      products: { numProducts },
      productCategories
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching summary", error: error.message });
  }
});

//  ADMIN: USERS

// Get all users
router.get("/users", isAuth, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json(users);
  } catch (err) {
    console.error(" Get users error:", err);
    res.status(500).json({ message: "Failed to load users" });
  }
});

// Update user (toggle admin status)
router.put("/users/:id", isAuth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isAdmin = req.body.isAdmin !== undefined ? req.body.isAdmin : user.isAdmin;
    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin
    });
  } catch (err) {
    console.error(" Update user error:", err);
    res.status(500).json({ message: "Failed to update user" });
  }
});

// Delete user
router.delete("/users/:id", isAuth, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(" Delete user error:", err);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

// ADMIN: ORDERS

// Get all orders
router.get("/orders", isAuth, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error(" Get orders error:", err);
    res.status(500).json({ message: "Failed to load orders" });
  }
});

// Mark order as delivered
router.put("/orders/:id/deliver", isAuth, isAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.isDelivered = true;
    order.deliveredAt = Date.now();
    
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (err) {
    console.error(" Deliver order error:", err);
    res.status(500).json({ message: "Failed to update order" });
  }
});

export default router;
