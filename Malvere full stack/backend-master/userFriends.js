const mongoose = require("mongoose");
var Schema = mongoose.Schema;

const UserFriendsScehma = new mongoose.Schema(
  {
    user: {type: Schema.Types.ObjectId, ref: 'UserInfo'},
    friend: {type: Schema.Types.ObjectId, ref: 'UserInfo'},
    status: String,
  },
  { timestamps: true },
  {
    collection: "UserFriends",
  }
);

mongoose.model("UserFriends", UserFriendsScehma);
