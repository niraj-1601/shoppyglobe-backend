const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/shoppyglobe")
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log(err));

// Models
const Product = require("./models/Product");
const Cart = require("./models/Cart");
const User = require("./models/User");

// Auth Middleware
const auth = require("./middleware/auth");

// ------------------- PRODUCT APIs -------------------

// Add Dummy Product
app.get("/add-product", async (req, res) => {
  const p = new Product({
    name: "Laptop",
    price: 50000,
    description: "Gaming laptop",
    stock: 10,
  });

  await p.save();
  res.send("Product added");
});

// GET all products
app.get("/products", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// GET single product
app.get("/products/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Not found" });
  }

  res.json(product);
});

// ------------------- CART APIs -------------------

// Add to cart
app.post("/cart", auth, async (req, res) => {
  const { productId, quantity } = req.body;

  const cartItem = new Cart({ productId, quantity });
  await cartItem.save();

  res.json(cartItem);
});

// Update cart
app.put("/cart/:id", auth, async (req, res) => {
  const { quantity } = req.body;

  const updated = await Cart.findByIdAndUpdate(
    req.params.id,
    { quantity },
    { new: true }
  );

  res.json(updated);
});

// Delete from cart
app.delete("/cart/:id", auth, async (req, res) => {
  await Cart.findByIdAndDelete(req.params.id);
  res.json({ message: "Item removed" });
});

// ------------------- AUTH APIs -------------------

// Register
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  const user = new User({
    email,
    password: hashed,
  });

  await user.save();
  res.json({ message: "User registered" });
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(400).json({ message: "Invalid password" });
  }

  const token = jwt.sign({ id: user._id }, "secretkey");

  res.json({ token });
});

// ------------------- SERVER -------------------

app.listen(5000, () => {
  console.log("Server running on port 5000 🚀");
});