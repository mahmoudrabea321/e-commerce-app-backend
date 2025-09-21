import express from "express";
import Order from "./models/OrderMongoose.js";
import { isAuth } from "./utils.js";
import mongoose from "mongoose";

const orderRouter = express.Router();

// Create order (protected)
orderRouter.post("/", isAuth, async (req, res) => {
  try {
    console.log("=== ORDER CREATION REQUEST ===");
    console.log("User:", req.user);
    console.log("Request Body:", JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    if (!req.body.orderItems || req.body.orderItems.length === 0) {
      return res.status(400).json({ message: "Order items are required" });
    }

    if (!req.body.shipping) {
      return res.status(400).json({ message: "Shipping information is required" });
    }

    if (!req.body.totalPrice) {
      return res.status(400).json({ message: "Total price is required" });
    }

5    // Validate each order item
    for (const item of req.body.orderItems) {
      if (!item.product) {
        return res.status(400).json({ message: "Product ID is required for each item" });
      }
      
      // Check if product ID is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        return res.status(400).json({ message: `Invalid product ID: ${item.product}` });
      }
    }

    const newOrder = new Order({
      user: req.user._id,
      orderItems: req.body.orderItems,
      shipping: req.body.shipping,
      payment: req.body.payment || { method: "unknown" },
      totalPrice: req.body.totalPrice,
    });

    console.log("Order to be saved:", newOrder);
    
    const savedOrder = await newOrder.save();
    console.log("✅ Order saved successfully:", savedOrder._id);
    
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error(" ORDER CREATION ERROR:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation Error",
        details: error.errors 
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: "Invalid data format",
        details: error.message 
      });
    }
    
    res.status(500).json({ 
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user’s orders (protected)
orderRouter.get("/mine", isAuth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get order by ID (protected)
orderRouter.get("/:id", isAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(400).json({ message: "Invalid order ID" });
  }
});
orderRouter.put("/:id/pay", async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer.email_address,
    };
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404).send({ message: "Order not found" });
  }
});


orderRouter.get("/paypal", (req, res) => {
  res.send(process.env.PAYPAL_CLIENT_ID || "sb");
});



export default orderRouter;
