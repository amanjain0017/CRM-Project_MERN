const mongoose = require("mongoose");

mongoose
  .connect("mongodb://localhost:27017/salesCRM")
  .then(() => {
    console.log("Connection is Established with DB");
  })
  .catch((err) => {
    console.log("No Connection, ERROR : ", err);
  });
