const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

const users = [
  {
    seedId: "User_1",
    name: "Aarav Sharma",
    email: "aarav.sharma@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_2",
    name: "Vivaan Patel",
    email: "vivaan.patel@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_3",
    name: "Aditya Verma",
    email: "aditya.verma@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_4",
    name: "Krishna Mehta",
    email: "krishna.mehta@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_5",
    name: "Rohan Desai",
    email: "rohan.desai@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_6",
    name: "Neel Shah",
    email: "neel.shah@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_7",
    name: "Harsh Joshi",
    email: "harsh.joshi@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_8",
    name: "Yash Gupta",
    email: "yash.gupta@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_9",
    name: "Dhruv Kapoor",
    email: "dhruv.kapoor@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_10",
    name: "Kunal Jain",
    email: "kunal.jain@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_11",
    name: "Arjun Singh",
    email: "arjun.singh@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_12",
    name: "Manav Nair",
    email: "manav.nair@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_13",
    name: "Siddharth Rao",
    email: "siddharth.rao@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_14",
    name: "Rahul Bansal",
    email: "rahul.bansal@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_15",
    name: "Aman Mishra",
    email: "aman.mishra@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_16",
    name: "Priya Patel",
    email: "priya.patel@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_17",
    name: "Sneha Shah",
    email: "sneha.shah@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_18",
    name: "Ananya Mehta",
    email: "ananya.mehta@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_19",
    name: "Diya Joshi",
    email: "diya.joshi@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_20",
    name: "Kavya Desai",
    email: "kavya.desai@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_21",
    name: "Ishita Verma",
    email: "ishita.verma@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_22",
    name: "Riya Sharma",
    email: "riya.sharma@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_23",
    name: "Meera Kapoor",
    email: "meera.kapoor@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_24",
    name: "Nisha Gupta",
    email: "nisha.gupta@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_25",
    name: "Pooja Nair",
    email: "pooja.nair@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_26",
    name: "Tanvi Rao",
    email: "tanvi.rao@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_27",
    name: "Ritika Jain",
    email: "ritika.jain@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_28",
    name: "Aditi Kulkarni",
    email: "aditi.kulkarni@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_29",
    name: "Sanya Malhotra",
    email: "sanya.malhotra@example.com",
    password: "123456",
    role: "user"
  },
  {
    seedId: "User_30",
    name: "Muskan Choudhary",
    email: "muskan.choudhary@example.com",
    password: "123456",
    role: "user"
  }
];

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    await User.deleteMany({});
    console.log("🗑️ Old users deleted");

    for (const user of users) {
      await new User(user).save();
      console.log(`✔ Seeded ${user.seedId}`);
    }

    console.log("🎉 All users seeded successfully!");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

seedUsers();