const mongoose = require("mongoose");  // data base connection

mongoose.connect("mongodb+srv://niru:niru@quizz.dughfbw.mongodb.net/quiz?retryWrites=true&w=majority");

////mongodb://127.0.0.1:27017/quiz

const db = mongoose.connection;

db.on("error", console.error.bind("Error connecting to MongoDB"));

db.once("open", function () {
  console.log("Conneted to Database:: MongoDB");
});

module.exports = db;