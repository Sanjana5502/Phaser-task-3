const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
app.use(cors());
const PORT = process.env.PORT || 4000;

let adminSocketId = null;
io.on("connection", (socket) => {
  if (!adminSocketId) {
    adminSocketId = socket.id;
    socket.emit("admin");
    socket.join("adminRoom");
  } else {
    socket.emit("viewer");
    socket.join("viewerRoom");
  }

  socket.on("admin", () => {
    console.log(`Admin is connected: ${socket.id}`);
    io.to(socket.id).emit("admin");
  });

  socket.on("viewer", () => {
    console.log(`User is connected: ${socket.id}`);
    io.to(socket.id).emit("viewer");
  });

  socket.on("ballMoved", (data) => {
    io.to("viewerRoom").emit("ballMoved", data);
  });
  socket.on("adminButtonClicked", (data) => {
    io.to("viewerRoom").emit("adminButtonClicked", data);
  });

  socket.on("disconnect", () => {
    if (socket.id === adminSocketId) {
      console.log("Admin is disconnected");
      adminSocketId = null;
    }
    socket.leave("adminRoom");
    socket.leave("viewerRoom");
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
