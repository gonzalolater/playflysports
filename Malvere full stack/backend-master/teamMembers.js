const mongoose = require("mongoose");
var Schema = mongoose.Schema;

const TeamMembersScehma = new mongoose.Schema(
  {
    team: {type: Schema.Types.ObjectId, ref: 'TeamInfo'},
    user: {type: Schema.Types.ObjectId, ref: 'UserInfo'},
    position: String,
    description: String,
    role: String,
  },
  {
    collection: "TeamMembers",
  }
);

mongoose.model("TeamMembers", TeamMembersScehma);
