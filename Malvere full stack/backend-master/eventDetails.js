const mongoose = require("mongoose");
var Schema = mongoose.Schema;

const EventsScehma = new mongoose.Schema(
  {
    name: String,
    description: String,
    profilePic: String,
    sportsType: {type: Schema.Types.ObjectId, ref: 'SportsTypes'},
    team: {type: Schema.Types.ObjectId, ref: 'TeamInfo'},
    opponent: {type: Schema.Types.ObjectId, ref: 'TeamInfo'},
    members: [{type: Schema.Types.ObjectId, ref: 'UserInfo'}],
    location: String,
    date: String,
    startTime: String,
    endTime: String,
    repeat: String,
    results: String,
    cost: String
  },
  {
    collection: "EventDetails",
  }
);

mongoose.model("EventDetails", EventsScehma);
