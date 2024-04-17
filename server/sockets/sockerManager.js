const socketManager = (io) => {
  let socketList = {};
  io.on("connection", (socket) => {
    console.log("Hellsdjkfbsdjhkfbasdjhkfb");
    console.log(`New User connected: ${socket.id}`);

    socket.on("disconnect", () => {
      socket.disconnect();
      console.log("User disconnected!");
    });

    socket.on("BE-check-user", ({ roomId, userName }) => {
      let error = false;

      io.sockets.in(roomId).clients((err, clients) => {
        clients.forEach((client) => {
          if (socketList[client] == userName) {
            error = true;
          }
        });
        socket.emit("FE-error-user-exist", { error });
      });
    });

    /**
     * Join Room
     */
    socket.on("BE-join-room", ({ roomId, userName }) => {
      // Socket Join RoomName
      socket.join(roomId);
      socketList[socket.id] = { userName, video: true, audio: true };

      // Set User List
      io.sockets.in(roomId).clients((err, clients) => {
        try {
          const users = [];
          clients.forEach((client) => {
            // Add User List
            users.push({ userId: client, info: socketList[client] });
          });
          socket.broadcast.to(roomId).emit("FE-user-join", users);
          // io.sockets.in(roomId).emit('FE-user-join', users);
        } catch (e) {
          io.sockets.in(roomId).emit("FE-error-user-exist", { err: true });
        }
      });
    });

    socket.on("BE-call-user", ({ userToCall, from, signal }) => {
      io.to(userToCall).emit("FE-receive-call", {
        signal,
        from,
        info: socketList[socket.id],
      });
    });

    socket.on("BE-accept-call", ({ signal, to }) => {
      io.to(to).emit("FE-call-accepted", {
        signal,
        answerId: socket.id,
      });
    });

    socket.on("BE-send-message", ({ roomId, msg, sender }) => {
      io.sockets.in(roomId).emit("FE-receive-message", { msg, sender });
    });

    socket.on("BE-leave-room", ({ roomId, leaver }) => {
      delete socketList[socket.id];
      socket.broadcast
        .to(roomId)
        .emit("FE-user-leave", { userId: socket.id, userName: [socket.id] });
      io.sockets.sockets[socket.id].leave(roomId);
    });

    socket.on("BE-toggle-camera-audio", ({ roomId, switchTarget }) => {
      if (switchTarget === "video") {
        socketList[socket.id].video = !socketList[socket.id].video;
      } else {
        socketList[socket.id].audio = !socketList[socket.id].audio;
      }
      socket.broadcast
        .to(roomId)
        .emit("FE-toggle-camera", { userId: socket.id, switchTarget });
    });

    socket.on("whiteboard-data", ({ roomId, data }) => {
      // Broadcast the drawing data to all other peers in the same room
      console.log("Canvas data:", data);

      io.to(roomId).emit("FE-whiteboard-data", { data });
    });

    // Emit the new state to all peers in the room
    socket.on("BE-toggle-whiteboard", ({ roomId, whiteboardVisible }) => {
      console.log(whiteboardVisible);
      io.to(roomId).emit("FE-toggle-whiteboard", { whiteboardVisible });
    });

    socket.on("clear-canvas", ({ roomId }) => {
      // Broadcast the clear-canvas event to all clients in the same room
      io.to(roomId).emit("clear-canvas", { roomId });
    });
  });
};

module.exports = socketManager;
