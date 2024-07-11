const mongoose = require("mongoose");
var Schema = mongoose.Schema;

const SportsTypesScehma = new mongoose.Schema(
  {
    name: String,
    description: String,
    profilePic: String,
  },
  {
    collection: "SportsTypes",
  }
);

mongoose.model("SportsTypes", SportsTypesScehma);
