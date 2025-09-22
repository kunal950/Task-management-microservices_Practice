const ampq = require("amqplib");

async function start() {
  try {
    const connection = await ampq.connect("amqp://rabbitmq");
    const channel = await connection.createChannel();

    await channel.assertQueue("taskQueue");
    console.log("Waiting for messages in taskQueue...");

    channel.consume(
      "taskQueue",
      (msg) => {
        if (msg !== null) {
          const messageContent = JSON.parse(msg.content.toString());
          console.log("Received message:", messageContent);
          console.log("\n");
          channel.ack(msg);
        }
      },
      { noAck: false }
    );
  } catch (error) {
    console.error("Error in notification service:", error.message);
  }
}

start();
