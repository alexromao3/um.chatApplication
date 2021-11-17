const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io')

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = 3000 || process.env.PORT;

const users = [];
const rooms = [];

app.use(express.static(path.join(__dirname, 'public')));

//Run when client connects
io.on('connection', socket => {
    var welcomeMessage = 'Welcome to NCC Chat';
    socket.emit('bot-message', welcomeMessage);
    //io.emit('update-userlist', users, socket.id);

    socket.on('disconnect', () => {

        try{
            var username = LeaveUser(socket.id);
            console.log(username+" left the chat.");
            console.log(socket.id+ ' : ' +username + " leaving the chat.");
            io.emit('goodbye-user', username);
            //io.emit('update-userlist', users, socket.id);
        }
        catch(error){
            console.log("Erro no disconnect");
        }
    });

    socket.on('chatMessage', (message) => {
        var user = GetUserFromId(socket.id);
        if (message.startsWith("!createroom")){
            //console.log("Room creation!");
            for (var i = 0; i < users.length; i++){
                if (message.includes((users[i].username))){
                    var roomUser = users[i];
                }
            }
            const randomCode = Math.random().toString(36).substring(2,7);
            var newRoom = CreateRoom(randomCode, socket.id, roomUser.id);
            console.log(newRoom);
            socket.emit('new-room', user.username, newRoom.code);

        }
        else {
            io.emit('message', message, user.username);

        }
    })

    //When user joins the server
    socket.on('new-user', (username) => {
        //console.log(user)
        console.log(socket.id+ ' : ' +username);
        JoinUser(socket.id, username, null);
        for (var i = 0; i < users.length; i++){
            console.log(users[i].username);
        }
        //console.log(users.length)
        socket.broadcast.emit('welcome-user', username);
        io.emit('update-userlist', users);

    })

    function GetUserFromId(socketid){
        return users.find(user => user.id === socketid);
    }

    function JoinUser(id, username, room){
        const user = {id, username, room}
        users.push(user);
        console.log(users);
        return user;
    }

    function LeaveUser(id){
        GetUserFromId(id);
        var user = users.find(user => user.id === id);
        //users.splice(user => user.id === id);
        users.splice(user);
        return user.username;
    }

    //Function to create room
    function CreateRoom(code, adminId, userId){
        const room = {code, adminId, userId};
        rooms.push(room);
        return room;
    }
});






server.listen(PORT, () => console.log('Server running on port '+PORT));
