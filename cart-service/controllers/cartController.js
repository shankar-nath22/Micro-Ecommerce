const redis = require("../redis");
const { getProduct } = require("../services/productService");

// Utility to get Redis key for a user
const cartKey = (userId) => `cart:${userId}`;

// ADD to cart
async function addToCart(req, res) {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ error: "Unauthenticated" });

  const productId = req.body.productId;
  const quantity = Number(req.body.quantity) || 1;

  const product = await getProduct(productId);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const currentCartQty = Number(await redis.hget(cartKey(userId), productId)) || 0;
  if (currentCartQty + quantity > product.stock) {
    return res.status(400).json({ error: `Not enough stock. Only ${product.stock} available.` });
  }

  const newQty = await redis.hincrby(cartKey(userId), productId, quantity);

  if (newQty <= 0) await redis.hdel(cartKey(userId), productId);

  return res.json({ message: "Item added to cart" });
}

// GET cart (no userId from URL)
async function getCart(req, res) {
  const userId = req.user.id;
  if (!userId) return res.status(401).json({ error: "Unauthenticated" });

  const cart = await redis.hgetall(cartKey(userId));

  const parsed = {};
  for (let p in cart) parsed[p] = Number(cart[p]);

  res.json(parsed);
}

// Internal version using userId from params
async function getCartInternal(req, res) {
  const userId = req.params.userId;
  const cart = await redis.hgetall(cartKey(userId));
  const parsed = {};
  for (let p in cart) parsed[p] = Number(cart[p]);
  res.json(parsed);
}

// REMOVE item
async function removeItem(req, res) {
  const userId = req.user.id;
  if (!userId) return res.status(401).json({ error: "Unauthenticated" });

  const productId = req.body.productId;

  await redis.hdel(cartKey(userId), productId);

  return res.json({ message: "Item removed" });
}

// CLEAR cart (no params!)
async function clearCart(req, res) {
  const userId = req.user.id;
  if (!userId) return res.status(401).json({ error: "Unauthenticated" });

  await redis.del(cartKey(userId));

  return res.json({ message: "Cart cleared" });
}

// UPDATE quantity
async function updateQuantity(req, res) {
  const userId = req.user.id;
  if (!userId) return res.status(401).json({ error: "Unauthenticated" });

  const { productId, quantity } = req.body;

  if (!productId || quantity == null) {
    return res.status(400).json({ error: "Missing fields" });
  }

  if (quantity <= 0) {
    await redis.hdel(cartKey(userId), productId);
    return res.json({ message: "Item removed" });
  }

  const product = await getProduct(productId);
  if (!product) return res.status(404).json({ error: "Product not found" });

  if (quantity > product.stock) {
    return res.status(400).json({ error: `Not enough stock. Only ${product.stock} available.` });
  }

  await redis.hset(cartKey(userId), productId, quantity);
  return res.json({ message: "Quantity updated" });
}

async function clearCartInternal(req, res) {
  const userId = req.params.userId;
  await redis.del(cartKey(userId));
  return res.json({ message: "Cart cleared" });
}

module.exports = {
  addToCart,
  getCart,
  removeItem,
  clearCart,
  updateQuantity,
  getCartInternal,
  clearCartInternal,
};
