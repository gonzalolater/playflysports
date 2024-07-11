const mongoose = require("mongoose");
var Schema = mongoose.Schema;

const TeamDetailsScehma = new mongoose.Schema(
  {
    name: String,
    sportsType: {type: Schema.Types.ObjectId, ref: 'SportsTypes'},
    gender: String,
    members: [{type: Schema.Types.ObjectId, ref: 'UserInfo'}],
    description: String,
    profilePic: String,
    profileBanner: String,
    inviteCode: String,
    private: Boolean,
  },
  { timestamps: true },
  {
    collection: "TeamInfo",
  }
);

mongoose.model("TeamInfo", TeamDetailsScehma);
