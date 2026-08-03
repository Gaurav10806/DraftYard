const mongoose = require("mongoose");
const dns = require("node:dns");

// Force Node to use public DNS servers
dns.setServers(["1.1.1.1", "8.8.8.8"]);
dns.setDefaultResultOrder("ipv4first");

const connectDB = async () => {
  try {
    console.log("DNS Servers:", dns.getServers());

    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/draftyard';
    await mongoose.connect(mongoUri);
console.log("Connected Host:", mongoose.connection.host);

console.log("✅ MongoDB Connected");
    
    // Trigger revival analytics database migration
      // const runRevivalMigration = require("../migration_revival_runner");
      // runRevivalMigration();

  } catch (err) {
    console.warn("⚠️ MongoDB connection failed, continuing without DB. Error:");
    console.warn(err);
    // Do not exit; allow server to start in offline mode.
  }
};

module.exports = connectDB;