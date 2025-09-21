import express from "express";
import Product from "./models/ProductMongoose.js";
import User from "./models/UserMongoose.js"; 
import data from "./data.js";
import Order from "./models/OrderMongoose.js";
const seedRoute = express.Router();

seedRoute.get("/", async (req, res) => {
  try {
    await Product.deleteMany({});
    await User.deleteMany({});
    await Order.deleteMany({});

    // Insert sample products
    const createdProducts = await Product.insertMany(data.products);

    // Insert sample users
    const createdUsers = await User.insertMany(data.users); 
    const createdShipping = await Order.insertMany(data.order);

    res.send({
     message: "Database seeded!",
     users: createdUsers,  
     products: createdProducts,
     });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default seedRoute;
