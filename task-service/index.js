const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const amqp = require("amqplib");

const app = express();
const PORT = 3002;

app.use(bodyParser.json());

mongoose
  .connect("mongodb://mongo:27017/tasksdb")
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  userId: String,
  createdAt: { type: Date, default: Date.now },
});
const Task = mongoose.model("Task", TaskSchema);

let channel, connection;

async function connectRabbitMQWithRetry(retries = 5, delay = 3000) {
  while (retries) {
    try {
      connection = await amqp.connect("amqp://rabbitmq");
      channel = await connection.createChannel();
      await channel.assertQueue("taskQueue");
      console.log("Connected to RabbitMQ");
      return;
    } catch (error) {
      console.error("Failed to connect to RabbitMQ, retrying...", error);
      retries--;
      console.log(`Retries left: ${retries}`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}
app.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find();
    res.status(200).send(tasks);
  } catch (error) {
    console.log("Error Fetching: ", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/tasks", async (req, res) => {
  const { title, description, userId } = req.body;
  try {
    const task = new Task({ title, description, userId });
    await task.save();
    const message = { taskId: task._id, userId, title };
    if (!channel) {
      return res.status(500).json({ error: "No channel to RabbitMQ" });
    }
    channel.sendToQueue("taskQueue", Buffer.from(JSON.stringify(message)));
    res.status(201).send(task);
  } catch (error) {
    console.log("Error Saving: ", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`Task Service is listening on port ${PORT}`);
  connectRabbitMQWithRetry();
});
