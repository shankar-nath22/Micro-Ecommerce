const redis = require("../redis");
const { getProduct } = require("../services/productService");

// Utility to get Redis key for a user
const cartKey = (userId) => `cart:${userId}`;

// ADD to cart
async function addToCart(req, res) {
  const userId = req.body.userId;
  const productId = req.body.productId;
  const quantity = req.body.quantity || 1;

  // validate product exists
  const product = await getProduct(productId);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  // Add to Redis (increment quantity)
  await redis.hincrby(cartKey(userId), productId, quantity);

  return res.json({ message: "Item added to cart" });
}

// GET cart
async function getCart(req, res) {
  const userId = req.params.userId;

  const cart = await redis.hgetall(cartKey(userId));

  return res.json(cart);
}

// REMOVE item
async function removeItem(req, res) {
  const userId = req.body.userId;
  const productId = req.body.productId;

  await redis.hdel(cartKey(userId), productId);

  return res.json({ message: "Item removed" });
}

// CLEAR cart
async function clearCart(req, res) {
  const userId = req.params.userId;

  await redis.del(cartKey(userId));

  return res.json({ message: "Cart cleared" });
}

module.exports = {
  addToCart,
  getCart,
  removeItem,
  clearCart,
};
