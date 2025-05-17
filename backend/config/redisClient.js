// redisClient.js

const redis = require("redis");

// Direct connection to Redis server
const client = redis.createClient({
  host: "127.0.0.1",   // Redis server address (localhost)
  port: 6379,          // Redis server default port
});

// Connect to Redis
client.connect().catch(console.error);

// Handle Redis connection errors
client.on("error", (err) => {
  console.error("❌ Redis Connection Error:", err);
});

// Function to set cache value
const setCache = async (key, value) => {
  await client.set(key, value);
};

// Function to get cache value
const getCache = async (key) => {
  const value = await client.get(key);
  return value;
};

module.exports = { client, setCache, getCache };