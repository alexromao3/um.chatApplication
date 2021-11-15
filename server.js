const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io')

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = 3000 || process.env.PORT;

const users = [];

app.use(express.static(path.join(__dirname, 'public')));

//Run when client connects
io.on('connection', socket => {
    socket.emit('message', 'Welcome to NCC Chat');
    //socket.broadcast.emit('message', 'A user has joined the chat.');
    //var username = prompt('What´s your username');
    //socket.emit('new-user', username);


    socket.on('disconnect', () => {
        io.emit('message', 'A user has left the chat.');
    });

    socket.on('chatMessage', (message) => {
        var user = GetUsernameFromId(socket.id);
        io.emit('message', message, user.username);
    })

    socket.on('new-user', (user) => {
        //console.log(user)
        users.push([socket.id, user])
        console.log(socket.id+ ' : ' +user);
        JoinUser(socket.id, user, null);
    })
    // socket.on('addUser', (username) => {
    //     users.push([socket.id, username]);
    // })

    function GetUsernameFromId(socketid){
        return users.find(user => user.id === socketid);
    }

    function JoinUser(id, username, room){
        const user = {id, username, room}
        users.push(user);
        return user;
    }
});






server.listen(PORT, () => console.log('Server running on port '+PORT));
