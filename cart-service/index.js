const express = require("express");
const bodyParser = require("body-parser");

const {
  addToCart,
  getCart,
  removeItem,
  clearCart,
  updateQuantity,
  getCartInternal,
  clearCartInternal,
} = require("./controllers/cartController");

const { authenticate, requireRole } = require("./middleware/authMiddleware");

const app = express();
app.use(bodyParser.json());

// All cart operations require a logged in USER
app.post("/cart/add", authenticate, requireRole("USER"), addToCart);
app.post("/cart/update", authenticate, requireRole("USER"), updateQuantity);

app.get("/cart", authenticate, requireRole("USER"), getCart);

// Internal endpoint for other services (no JWT required)
app.get("/cart/:userId", getCartInternal);

app.delete("/cart/remove", authenticate, requireRole("USER"), removeItem);

// No userId param needed now—use req.user.id
app.delete("/cart/clear", authenticate, requireRole("USER"), clearCart);

// Internal clear endpoint
app.delete("/cart/:userId", clearCartInternal);

// health check
app.get("/", (req, res) => {
  res.send("Cart service running!");
});

app.listen(8083, () => {
  console.log("Cart service running on port 8083");
});
