const express = require("express");
const app = express();
const indexRouter = require("./routes/index");
const path = require("path");

const http = require("http");
const socketIO = require("socket.io");
const server = http.createServer(app);
const io = socketIO(server);

let waitingusers = [];
let rooms = {};

io.on("connection", function (socket) {
  socket.on("joinroom", function () {
    if (waitingusers.length > 0) {
      let partner = waitingusers.shift();
      const roomname = `${socket.id}-${partner.id}`;

      socket.join(roomname);
      partner.join(roomname);

      io.to(roomname).emit("joined", roomname);
    } else {
      waitingusers.push(socket);
    }
  });

  socket.on("signalingMessage", function (data) {
    socket.broadcast.to(data.room).emit("signalingMessage", data.message);
  });

  socket.on("message", function (data) {
    socket.broadcast.to(data.room).emit("message", data.message);
  });

  socket.on("startVideoCall", function ({ room }) {
    socket.broadcast.to(room).emit("incomingCall");
  });

  socket.on("rejectCall", function ({ room }) {
    socket.broadcast.to(room).emit("callRejected");
  });

  socket.on("acceptCall", function ({ room }) {
    socket.broadcast.to(room).emit("callAccepted");
  });

  socket.on("disconnect", function () {
    let index = waitingusers.findIndex(
      (waitingUser) => waitingUser.id === socket.id
    );

    waitingusers.splice(index, 1);
  });
});

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);

server.listen(process.env.PORT || 3000);
