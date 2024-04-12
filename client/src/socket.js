import io from "socket.io-client";
const sockets = io("http://192.168.0.124:3001", {
  autoConnect: true,
  forceNew: true,
});
// const sockets = io("/");
export default sockets;
