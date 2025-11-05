require("dotenv").config();
const express = require("express");
const app = express();
const usersRouter = require("./routes/usersRouter");
const mongoose = require("mongoose");
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/users", usersRouter);

mongoose
  .connect(process.env.MONGODB_URl)
  .then(() => {
    console.log("Mongodb Connected");
  })
  .catch(() => {
    console.log("Mongodb not connected");
  });

app.get("/", (req, res) => {
  res.render("index");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("You are Live");
});
