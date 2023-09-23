
const Room = require("../model/Room");

module.exports.home = async function (req, res) {

  return res.render("home", {
    title: "Home",
    rooms:Room,
  });
};