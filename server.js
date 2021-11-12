const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static(__dirname + '/public'));

let users = [];
let messages = [];

//Initialize first page when entering in the app
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// //Run when user connects or disconnects
// io.on('connection', (socket) => {
//     console.log('user connected');

//     socket.on('disconnect', () => {
//       console.log('user disconnected');
//     });
//   });

  //Receive the username from the client
  io.on('connection', (socket) => {
    socket.on('username-input', (username) =>{
      console.log(username+ ' connected.');
      users.push(username);
    })
  })

  //Send the username to the 

















server.listen(3000, () => {
  console.log('listening on *:3000');
});