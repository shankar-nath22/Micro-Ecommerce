const Redis = require("ioredis");

// Connect to Redis running locally (default port 6379)
const redis = new Redis();

module.exports = redis;
