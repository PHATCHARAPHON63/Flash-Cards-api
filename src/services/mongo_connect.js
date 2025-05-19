const mongoose = require("mongoose");
require("dotenv").config();

const { MONGO_URI, DB_NAME } = process.env;

mongoose.connection.once("open", () => {
  console.log("MongoDB connection ready");
});

mongoose.connection.on("error", (err) => {
  console.error(err);
});

async function mongoConnect() {
  if (MONGO_URI && typeof MONGO_URI === "string") {
    await mongoose.connect(MONGO_URI, {
      dbName: DB_NAME,
    });
    console.log("MongoDB connected successfully 🎉🎉🎉");
  } else {
    console.log("MONGO_URI is not defined 💣💣💣");
  }
}

module.exports = { mongoConnect };
