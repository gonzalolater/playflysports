const mongoose = require("mongoose");
var Schema = mongoose.Schema;

const UserEventsScehma = new mongoose.Schema(
  {
    user: {type: Schema.Types.ObjectId, ref: 'UserInfo'},
    event: {type: Schema.Types.ObjectId, ref: 'EventDetails'},
    status: String,
  },
  {
    collection: "UserEvents",
  }
);

mongoose.model("UserEvents", UserEventsScehma);
