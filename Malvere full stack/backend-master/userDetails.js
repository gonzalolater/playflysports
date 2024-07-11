const mongoose = require("mongoose");

const UserDetailsScehma = new mongoose.Schema(
  {
    fname: String,
    lname: String,
    email: { type: String, unique: true },
    password: String,
    userType: String,
    position: String,
    description: String,
    profilePic: String,
    profileBanner: String,
  },
  { timestamps: true },
  {
    collection: "UserInfo",
  }
);

mongoose.model("UserInfo", UserDetailsScehma);
