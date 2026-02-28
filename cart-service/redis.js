const Redis = require("ioredis");

// Connect to Redis (default to localhost if not specified in env)
const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379
});

module.exports = redis;
