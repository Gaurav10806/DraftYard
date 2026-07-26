const mongoose = require("mongoose");
const dns = require("node:dns");

// Force Node to use public DNS servers
dns.setServers(["1.1.1.1", "8.8.8.8"]);
dns.setDefaultResultOrder("ipv4first");

const connectDB = async () => {
  try {
    console.log("DNS Servers:", dns.getServers());

    await mongoose.connect(process.env.MONGO_URI);

console.log("Connected DB:", mongoose.connection.name);
console.log("Connected Host:", mongoose.connection.host);

console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:");
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;