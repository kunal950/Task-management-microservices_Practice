const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3001;
app.use(bodyParser.json());

mongoose
  .connect("mongodb://mongo:27017/userdb")
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
});
const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.send("User Service is running");
});

app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).send(users);
  } catch (error) {
    console.log("Error Fetching: ", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/users", async (req, res) => {
  const { name, email } = req.body;
  try {
    const user = new User({ name, email });
    await user.save();
    res.status(201).send(user);
  } catch (error) {
    console.log("Error Saving: ", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`User Service is listening on port ${PORT}`);
});
