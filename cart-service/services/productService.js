const axios = require("axios");

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://product-service:8082/products";

async function getProduct(productId) {
  try {
    const res = await axios.get(`${PRODUCT_SERVICE_URL}/${productId}`);
    return res.data; // Product object
  } catch (err) {
    return null; // Product not found
  }
}

module.exports = { getProduct };
