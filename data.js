import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const data = {
  order: {
    "shipping": {
      "fullName": "John Doe",
      "address": "123 Main St",
      "city": "New York",
      "postalCode": "10001",
      "country": "USA"
    },
    "payment": {
      "method": "Paypal"
    },
    "cart": [
      {
        "name": "Product A",
        "qty": 2,
        "price": 50,
        "product": new mongoose.Types.ObjectId("65d2c3f2a2b7c8e45f0a1234")
      }
    ]
  },

  users: [
    {
      _id: new mongoose.Types.ObjectId(),
      name: "rabea",
      email: "admin@example.com",
      password: bcrypt.hashSync("12345", 10),
      isAdmin: true,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      name: "ReadableStream",
      email: "user@example.com",
      password: bcrypt.hashSync("12345", 10),
      isAdmin: false,
    },
  ],

  products: [
    {
      _id: new mongoose.Types.ObjectId("65d2c3f2a2b7c8e45f0a1234"),
      name: "camera",
      slug: "camera",
      brand: "sony",
      price: 22,
      category: "camera"||'cameras',
      image: "/uploads/images/img1.jpg", 
      countInStock: 10,
      numReviews: 10,
      rating: 4.0,
      description: "high quality",
    },
    {
      _id: new mongoose.Types.ObjectId("65d2c3f2a2b7c8e45f0a1235"),
      name: "headset",
      slug: "headset",
      brand: "sony",
      price: 30,
      category: "headsets"||'headset',
      image: "/uploads/images/img2.jpg", 
      countInStock: 10,
      numReviews: 10,
      rating: 4.5,
      description: "high quality",
    },
    {
      _id: new mongoose.Types.ObjectId("65d2c3f2a2b7c8e45f0a1236"),
      name: "watch",
      slug: "watch",
      brand: "rolex",
      price: 15,
      category: "watchs"||'watch',
      image: "/uploads/images/img3.jpg", 
      countInStock: 0,
      numReviews: 20,
      rating: 3.5,
      description: "high quality",
    },
  ],
};

export default data;