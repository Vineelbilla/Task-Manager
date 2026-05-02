const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let memoryServer;

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("MONGO_URI is not configured");
      }

      memoryServer = await MongoMemoryServer.create();
      const memoryUri = memoryServer.getUri();
      await mongoose.connect(memoryUri);
      console.log("Using in-memory MongoDB for local development");
      return;
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);

    const allowMemoryFallback = process.env.ALLOW_MEMORY_DB_FALLBACK === "true";

    if (process.env.NODE_ENV === "production" || process.env.MONGO_URI || !allowMemoryFallback) {
      process.exit(1);
    }

    memoryServer = await MongoMemoryServer.create();
    const memoryUri = memoryServer.getUri();

    await mongoose.connect(memoryUri);
    console.log("Using in-memory MongoDB for local development");
  }
};

module.exports = connectDB;
