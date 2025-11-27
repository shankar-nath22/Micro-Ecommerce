const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const {
  addToCart,
  getCart,
  removeItem,
  clearCart,
} = require("./controllers/cartController");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const { authenticate, requireRole } = require("./middleware/authMiddleware");

// Protect add to cart (only authenticated users)
app.post("/cart/add", authenticate, addToCart);

// Allow anyone to GET cart? maybe only owner -> authenticate and check userId
app.get("/cart/:userId", authenticate, getCart);

// Remove/clear should be authenticated
app.delete("/cart/remove", authenticate, removeItem);
app.delete("/cart/clear/:userId", authenticate, clearCart);

// Test endpoint
app.get("/", (req, res) => {
  res.send("Cart service running!");
});

app.listen(8083, () => {
  console.log("Cart service running on port 8083");
});
