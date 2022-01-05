const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const { Console } = require('console');
var randomWords = require('random-words')

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = 3000 || process.env.PORT;

const users = []
const rooms = []
const names = []

var gameOn = "false"
var wordToMatch
var unknownWord = ""
var roomNameee
var unknownWordChanged
var CurrentUser
var GameAdmin
var missLetterCounter = 0

app.use(express.static(path.join(__dirname, 'public')));

//Run when client connects
io.on('connection', socket => {
    var welcomeMessage = 'Welcome to NCC Chat';
    socket.emit('bot-message', welcomeMessage);
    //io.emit('update-userlist', users, socket.id);

    socket.on('disconnect', () => {
        //     //var username = LeaveUser(socket.id);
        var UserRemoved = GetUserFromId(socket.id)
        for (var i = 0; i < users.length; i++){
            if (users[i].id == socket.id){
                users.splice(i, 1)
            }
        }
        socket.broadcast.emit('goodbye-user', UserRemoved);
        io.emit('update-userlist', users);
    });

    var newGuess
    socket.on('chatMessage', message => {

    CurrentUser = GetUserFromId(socket.id)
    if (CurrentUser.status != "gaming"){

        
        var user = GetUserFromId(socket.id);

        //If the user wants to create a private room
        if (message.startsWith("/createroom")){
            messageChanged = message.replace("/createroom ", "")

            for (i = 0; i < users.length; i++){
                if (messageChanged.startsWith(users[i].username)){
                    let otherUserId = users[i].id
                    let otherUserName = users[i].username
                    let roomName = messageChanged.replace(otherUserName+" ", "")
                    let currentUserName = GetUserFromId(socket.id)
                    CreateRoom(roomName, socket.id, otherUserId)
                    socket.join(roomName)
                    io.to(socket.id).emit("OutputMessage", "You have created the room "+roomName+ " with "+otherUserName+". You are currently in that room.", "NCC BOT")
                    io.to(otherUserId).emit("OutputMessage", "You have been invited to the room "+roomName+" with "+currentUserName.username+". To join type /joinroom "+ roomName, "NCC BOT")
                }
            }
        }

        //If the user wants to join a private room
        else if (message.startsWith("/joinroom")){
            let messageChanged = message.replace("/joinroom ", "")
            for (i = 0; i < rooms.length; i++){
                if (messageChanged.startsWith(rooms[i].name)){
                    let room = rooms[i].name
                    try {
                        socket.join(room)
                        io.to(socket.id).emit("OutputMessage", "You have joined the room "+room, "NCC BOT")
                        //socket.join(room)
                    }
                    catch{
                        console.log("erro")
                        io.to(socket.id).emit("OutputMessage", "Something went wrong. You weren't able to join the room.", "NCC BOT")
                    }
                }
            }
        }

        //If the user wants to leave the room 
        else if (message.startsWith("/leaveroom")){
            messageChanged = message.replace("/leaveroom ", "")
            console.log(messageChanged)
            for (i = 0; i < rooms.length; i++){
                if (messageChanged.startsWith(rooms[i].name.toString())){
                    if(CheckIfInRoom(socket.id) != ""){
                        io.to(rooms[i].name).emit("OutputMessage", "The room "+rooms[i].name +" will be deleted.", "NCC BOT")
                        io.to(rooms[i].name).emit("OutputMessage", "Room deleted. You are no longer in this room.", "NCC BOT")
                        console.log(rooms)
                        socket.leave(rooms[i].name)
                        rooms.splice(rooms[i])
                    }
                }
            }
            
        }

        else if (message.startsWith("/deleteroom")){
            let roomToBeDeleted = message.replace("/deleteroom ", "")
            let room = GetRoomWithName(roomToBeDeleted)
            if (room != null){
                if (room.adminId == socket.id){
                    io.to(room.name).emit("OutputMessage", "The room "+room.name +" will be deleted.", "NCC BOT")
                    io.to(room.name).emit("OutputMessage", "Room deleted. You are no longer in this room.", "NCC BOT")
                    socket.leave(room.name)
                    rooms.splice(room)
                }
                else {
                    io.to(socket.id).emit("OutputMessage", "Error. You can't delete that room.", "NCC BOT")
                }
            }
            else {
                io.to(socket.id).emit("OutputMessage", "Error. You can't delete that room.", "NCC BOT")
            }

        }

        else if (message == "/help"){

            let help = "Welcome to mijo.pt chat."
            let help1 = "You only can talk with other users when inside a room. To create a room use '/createroom User NameOfRoom'."
            let help2 = "To leave a room use '/leaveroom NameOfRoom."
            let help3 = "To delete a room (if you are the admin), use '/deleteroom NameOfRoom'."
            let help4 = "Good chat!"
            let help5 = "PS: You can play a game, just be the admin of a room and type #GAMESTART!!!"

            io.to(socket.id).emit("OutputMessage", help, "NCC BOT")
            io.to(socket.id).emit("OutputMessage", help1, "NCC BOT")
            io.to(socket.id).emit("OutputMessage", help2, "NCC BOT")
            io.to(socket.id).emit("OutputMessage", help3, "NCC BOT")
            io.to(socket.id).emit("OutputMessage", help4, "NCC BOT")
            io.to(socket.id).emit("OutputMessage", help5, "NCC BOT")

        }

        else if (message == "#GAMESTART"){

            let userPower = CheckIfInRoom(socket.id)
            //console.log(userPower)
            let roomName = ""
            if (userPower == "adminId"){
                for (var i = 0; i < rooms.length; i++){
                    if (rooms[i].adminId == socket.id){
                        roomName = rooms[i].name
                        roomNameee = roomName
                        var OtherUserInRoom = GetUserFromId(rooms[i].userId)
                        CurrentUser.status = "gaming"
                        OtherUserInRoom.status = "gaming"
                    }
                }
                io.to(roomName).emit("OutputMessage", "Word Guessing Game started!", "NCC BOT")
                WordGuessGameStart(roomNameee)
            }
            else{
                io.to(socket.id).emit("OutputMessage", "You can't start the game because you are not admin of any room.", "NCC BOT")
            }
        }

        //Verifica se o user que está mandando a mensagem está numa sala e se sim mandar para a sala
        else {
            let userHasRoom = 'false'
            for (i = 0; i < rooms.length; i++){
                if (rooms[i].adminId == socket.id || rooms[i].userId == socket.id){
                    userHasRoom = 'true'
                    try{
                        io.to(rooms[i].name).emit('OutputMessage', message, user.username)
                    }
                    catch{
                        io.to(socket.id).emit('OutputMessage', "Error with the room. Room deleted.", "NCC BOT")
                        rooms.splice(rooms[i])
                        io.emit('update-userlist', users);
                    }
                }
            }
            if (userHasRoom == 'false'){
                io.emit('OutputMessage', message, user.username)
            }
        }
    }


    //If the current user status is gaming (If the user is playing the game)
    else {
        console.log(message)
        if (message == "#GAMEEND"){
            for (var i = 0; i < rooms.length; i++){
                if (rooms[i].adminId == socket.id){
                    var roomName = rooms[i].name
                    var OtherUserInRoom = GetUserFromId(rooms[i].userId)
                    CurrentUser.status = "chat"
                    OtherUserInRoom.status = "chat"
                }
            }
            io.to(roomName).emit("OutputMessage","The game was ended by "+CurrentUser.username+".", "NCC BOT")
        }
        else{
            newGuess = message.toUpperCase()
            if (newGuess == wordToMatch){
                var user = GetUserFromId(socket.id)
                io.to(roomNameee).emit("OutputMessage", "Word to be guessed: "+wordToMatch, "NCC BOT")
                io.to(roomNameee).emit("OutputMessage", "Game is finished. " + user.username + " was the winner!", "NCC BOT")
                WordGuessGameStart(roomNameee)
            }
            else if (wordToMatch.includes(newGuess)){
                for (var i = 0; i < wordToMatch.length; i++){
                    if(wordToMatch[i] == newGuess){
                        unknownWordChanged = setCharAt(unknownWordChanged, i, newGuess)
                        io.to(roomNameee).emit("OutputMessage", "Word to be guessed: "+unknownWordChanged, "NCC BOT")
                    }
                }
            }

            else{
                missLetterCounter++
                if (missLetterCounter % 3 == 0){
                    let integers = []
                    for (var i = 0; i < wordToMatch.length; i++){
                        integers.push(i)
                    }
                    shuffle(integers)
                    var random = integers[0]
                    unknownWordChanged = setCharAt(unknownWordChanged, random, wordToMatch[random])
                    io.to(roomNameee).emit("OutputMessage", "Word to be guessed: "+unknownWordChanged, "NCC BOT")
                    //unknownWordChanged = unknownWord
                }
            }
            if(!unknownWordChanged.includes("_")){
                var user = GetUserFromId(socket.id)
                io.to(roomNameee).emit("OutputMessage", "Game is finished. " + user.username + " was the winner!", "NCC BOT")
                WordGuessGameStart(roomNameee)
            }
        }
       
    }
    })

    //When user joins the server
    socket.on('new-user', (username) => {

        //Routine to verify if the name is already in use, and if yes increment 1 to it
        for (i = 0; i < names.length; i++){
            if (names[i].name == username){
                username+=String(names[i].times+1)
                names[i].times++
            }
        }
        const name = {name: username, times: 0}
        names.push(name)
        let status = "chat"
        JoinUser(socket.id, username, status);
        socket.broadcast.emit('welcome-user', username);
        io.emit('update-userlist', users);

    })

    socket.on('create-room', (roomCode, adminId, OtherUserId) =>{
        socket.join(roomCode)
        var teste = socket.to(adminId).to(OtherUserId).emit('JoinRoom', roomCode, adminId, OtherUserId);

    });

    socket.on('join-room', room =>{
        socket.join(room);
    });


    function GetUserFromId(socketid){
        return users.find(user => user.id === socketid);
    }

    function resetGameValues(){
        let commonWords = randomWords(25)
        wordToMatch = commonWords[Math.floor(Math.random() * commonWords.length)].toUpperCase()
        console.log(wordToMatch)
        unknownWord = ""
        unknownWordChanged = ""
    }

    function GetRoomWithName(roomName){
        return rooms.find(room => room.name === roomName)
    }

    function JoinUser(id, username, status){
        const user = {id, username, status}
        users.push(user);
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
    function CreateRoom(name, adminId, userId){
        const room = {name, adminId, userId};
        rooms.push(room);
        return room;
    }

    function CheckIfInRoom(id){
        for (i = 0; i < rooms.length; i++){
            if (rooms[i].adminId == id){
                return "adminId"
            }
            else if (rooms[i].userId == id){
                return "UserId"
            }
        }
        return ""
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
          let j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function setCharAt(str,index,chr) {
        if(index > str.length-1) return str;
        return str.substring(0,index) + chr + str.substring(index+1);
    }

    function WordGuessGameStart(roomName){
        resetGameValues()
        let integers = []
        for (var i = 0; i < wordToMatch.length; i++){
            unknownWord = unknownWord + "_"
            integers.push(i)
        }
        shuffle(integers)
        var random = integers[0]
        unknownWord = setCharAt(unknownWord, random, wordToMatch[random])
        unknownWordChanged = unknownWord
        io.to(roomName).emit("OutputMessage", "Word to be guessed: "+unknownWord, "NCC BOT")
            //}
            //else {
            //    io.to(socket.id).emit("OutputMessage", "You can't start the game because you are not admin of any room.", "NCC BOT")
            //}

    }


});



server.listen(PORT, () => console.log('Server running on port '+PORT));
