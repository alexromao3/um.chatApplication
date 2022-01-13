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
const games = []

var gameOn = "false"
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
                    CreateRoom(roomName, socket.id, null)
                    socket.join(roomName)
                    io.to(socket.id).emit("OutputMessageBot", "You have created the room "+roomName+ " with "+otherUserName+". You are currently in that room.", "NCC BOT")
                    io.to(otherUserId).emit("OutputMessageBot", "You have been invited to the room "+roomName+" with "+currentUserName.username+". To join type /joinroom "+ roomName, "NCC BOT")
                }
            }
        }

        //If the user wants to join a private room
        else if (message.startsWith("/joinroom")){
            let messageChanged = message.replace("/joinroom ", "")
            for (i = 0; i < rooms.length; i++){
                if (messageChanged == rooms[i].name){
                    let room = rooms[i].name
                    try {
                        rooms[i].userId = socket.id
                        socket.join(room)
                        io.to(socket.id).emit("OutputMessageBot", "You have joined the room "+room, "NCC BOT")
                        //socket.join(room)
                    }
                    catch{
                        io.to(socket.id).emit("OutputMessageBot", "Something went wrong. You weren't able to join the room.", "NCC BOT")
                    }
                }
            }
        }

        //If the user wants to leave the room 
        else if (message.startsWith("/leaveroom")){
            messageChanged = message.replace("/leaveroom ", "")
            //console.log(messageChanged)
            for (i = 0; i < rooms.length; i++){
                if (messageChanged.startsWith(rooms[i].name.toString())){
                    if(CheckIfInRoom(socket.id) != ""){
                        io.to(rooms[i].name).emit("OutputMessageBot", "The room "+rooms[i].name +" will be deleted.", "NCC BOT")
                        io.to(rooms[i].name).emit("OutputMessageBot", "Room deleted. You are no longer in this room.", "NCC BOT")
                        //console.log(rooms)
                        socket.leave(rooms[i].name)
                        rooms.splice(rooms[i])
                    }
                }
            }
            
        }

        else if (message == "/clear"){
            socket.emit('clear')
        }

        else if (message.startsWith("/deleteroom")){
            let roomToBeDeleted = message.replace("/deleteroom ", "")
            let room = GetRoomWithName(roomToBeDeleted)
            if (room != null){
                if (room.adminId == socket.id){
                    io.to(room.name).emit("OutputMessageBot", "The room "+room.name +" will be deleted.", "NCC BOT")
                    io.to(room.name).emit("OutputMessageBot", "Room deleted. You are no longer in this room.", "NCC BOT")
                    socket.leave(room.name)
                    rooms.splice(room)
                }
                else {
                    io.to(socket.id).emit("OutputMessageBot", "Error. You can't delete that room.", "NCC BOT")
                }
            }
            else {
                io.to(socket.id).emit("OutputMessageBot", "Error. You can't delete that room.", "NCC BOT")
            }

        }

        else if (message == "/help"){

            let help = "Welcome to NCC Web Chat."
            let help1 = "You only can talk with other users easily."
            let help2 = "To leave a room use '/leaveroom NameOfRoom."
            let help3 = "To delete a room (if you are the admin), use '/deleteroom NameOfRoom'."
            let help4 = "Good chat!"
            let help5 = "PS: You can play a game, just be the admin of a room and type #GAMESTART!!!"

            io.to(socket.id).emit("OutputMessageBot", help, "NCC BOT")
            io.to(socket.id).emit("OutputMessageBot", help1, "NCC BOT")
            io.to(socket.id).emit("OutputMessageBot", help2, "NCC BOT")
            io.to(socket.id).emit("OutputMessageBot", help3, "NCC BOT")
            io.to(socket.id).emit("OutputMessageBot", help4, "NCC BOT")
            io.to(socket.id).emit("OutputMessageBot", help5, "NCC BOT")

        }

        else if (message == "#GAMESTART"){
            console.log("GAMESTART")
            let userPower = CheckIfInRoom(socket.id)
            var roomName = ""
            if (userPower == "adminId"){
                for (var i = 0; i < rooms.length; i++){
                    if (rooms[i].adminId == socket.id){
                        console.log("admin")
                        roomName = rooms[i].name
                        var OtherUserInRoom = GetUserFromId(rooms[i].userId)
                        CurrentUser.status = "gaming"
                        OtherUserInRoom.status = "gaming"
                        var game = {Admin: socket.id, Player: rooms[i].userId, room: roomName, wordToBeGuessed: "", wordChanged: "", letters: []}
                    }
                }
                console.log(users)
                io.to(roomName).emit("OutputMessageBot", "Word Guessing Game started!", "NCC BOT")
                WordGuessGameStart(game)
            }
            else{
                io.to(socket.id).emit("OutputMessageBot", "You can't start the game because you are not admin of any room.", "NCC BOT")
            }
        }

        //Verifica se o user que está mandando a mensagem está numa sala e se sim mandar para a sala
        else {
            //console.log(users)
            //console.log(rooms)
            let userHasRoom = 'false'
            for (i = 0; i < rooms.length; i++){
                if (rooms[i].adminId == socket.id || rooms[i].userId == socket.id){
                    userHasRoom = 'true'
                    try{
                        //io.to(rooms[i].name).emit('OutputMessage', message, user.username)
                        io.to(rooms[i].name).emit('OutputMessage', message, user.username, rooms[i].name)
                    }
                    catch{
                        io.to(socket.id).emit('OutputMessageBot', "Error with the room. Room deleted.", "NCC BOT")
                        rooms.splice(rooms[i])
                        io.emit('update-userlist', users);
                    }
                }
            }
            if (userHasRoom == 'false'){
                io.emit('OutputMessage', message, user.username, "public")
            }
        }
    }


    //If the current user status is gaming (If the user is playing the game)
    else {
        //console.log(message)
        console.log(users)
        if (message == "#GAMEEND"){
            for (var i = 0; i < games.length; i++){
                if (games[i].Admin == socket.id){
                    var OtherUserInRoom = GetUserFromId(games[i].Player)
                    //let currentGameAdmin = games[i].Admin
                    CurrentUser.status = "chat"
                    OtherUserInRoom.status = "chat"
                    io.to(games[i].room).emit("OutputMessageBot", "The game was ended by "+CurrentUser.username+".", "NCC BOT")
                    games.splice(i, 1)
                }
            }
            //console.log(games)
            //console.log(users)
        }
        else{
            
            var currentGame = GetGameFromAnyplayerId(socket.id)
            console.log(currentGame)
            var word = currentGame.wordToBeGuessed
            var newGuess = message.toUpperCase()
            if (newGuess == word){
                //var user = GetUserFromId(socket.id)
                io.to(currentGame.room).emit("OutputMessageBot", "Word to be guessed: "+currentGame.wordToBeGuessed, "NCC BOT")
                io.to(currentGame.room).emit("OutputMessageBot", "Game is finished. " + CurrentUser.username + " was the winner!", "NCC BOT")
                for (var i = 0; i < games.length; i++){
                    if (games[i] == currentGame){
                        games.splice(i, 1)
                    }
                }
                var game = {Admin: currentGame.Admin, Player: currentGame.Player, room: currentGame.room, wordToBeGuessed: "", wordChanged: "", letters: []}
                WordGuessGameStart(game)
            }
            else if (word.includes(newGuess)){
                for (var i = 0; i < word.length; i++){
                    if(word[i] == newGuess){
                        currentGame.wordChanged = setCharAt(currentGame.wordChanged, i, newGuess)
                        io.to(currentGame.room).emit("OutputMessageBot", "Word to be guessed: "+currentGame.wordChanged, "NCC BOT")
                    }
                }
            }

            else{
                missLetterCounter++
                if (missLetterCounter % 3 == 0){
                    let integers = []
                    for (var i = 0; i < word.length; i++){
                        integers.push(i)
                    }
                    shuffle(integers)
                    var random = integers[0]
                    currentGame.wordChanged = setCharAt(currentGame.wordChanged, random, word[random])
                    io.to(currentGame.room).emit("OutputMessageBot", "Word to be guessed: "+currentGame.wordChanged, "NCC BOT")
                    //unknownWordChanged = unknownWord
                }
            }
            if(!currentGame.wordChanged.includes("_")){
                var user = GetUserFromId(socket.id)
                io.to(currentGame.room).emit("OutputMessageBot", "Game is finished. " + user.username + " was the winner!", "NCC BOT")
                for (var i = 0; i < games.length; i++){
                    if (games[i] == currentGame){
                        games.splice(i, 1)
                    }
                }
                var game = {Admin: currentGame.Admin, Player: currentGame.Player, room: currentGame.room, wordToBeGuessed: "", wordChanged: "", letters: []}
                WordGuessGameStart(game)
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

    function GetRoomWithName(roomName){
        return rooms.find(room => room.name === roomName)
    }

    function GetGameFromAnyplayerId(playerId){
        for (var i = 0; i < games.length; i++){
            if (games[i].Admin == playerId || games[i].Player == playerId){
                return games[i]
            }
        }
        //return games.find(game => game.adminId == playerId || game.playerId == playerId)
    }

    function JoinUser(id, username, status){
        const user = {id, username, status}
        users.push(user);
        return user;
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

    function WordGuessGameStart(game){
        let commonWords = randomWords(25)
        var wordToMatch = commonWords[Math.floor(Math.random() * commonWords.length)].toUpperCase()
        console.log(wordToMatch)
        game.wordToBeGuessed = wordToMatch
        let integers = []

        for (var i = 0; i < wordToMatch.length; i++){
            game.wordChanged = game.wordChanged + "_"
            integers.push(i)
        }

        shuffle(integers)
        var random = integers[0]
        game.wordChanged = setCharAt(game.wordChanged, random, wordToMatch[random])
        console.log(game)
        games.push(game)
        io.to(game.room).emit("OutputMessageBot", "Word to be guessed: "+game.wordChanged, "NCC BOT")

    }


});



server.listen(PORT, () => console.log('Server running on port '+PORT));
