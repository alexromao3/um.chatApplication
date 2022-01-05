//const { links } = require("express/lib/response");

const chatForm = document.getElementById('send-container');
var messages = document.getElementById('messages');
var usersUL = document.getElementById('users')
var divMessage = document.getElementById('message-part')

const socket = io();

//Get username from URL
const username = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

//Send the username received in the index to server validation
socket.emit("new-user", (username.username));


//Message from server to be outputted
socket.on('OutputMessage', (message, username) => {
    /*var item = document.createElement('p');
    item.textContent = username+ " : " +message;
    messages.appendChild(item);
    divMessage.scrollIntoView()*/
    var li = document.createElement("li")
    li.appendChild(document.createTextNode(username+ " : " +message))
    messages.appendChild(li)
    // $('messages').append($('<li>').text(username+ " : " +message))
    // var ul = document.getElementById("messages");
    divMessage.scrollTop = divMessage.scrollHeight
});

socket.on("SimpleMessage", message => {
    var item = document.createElement('p');
    item.textContent = "NCCBOT"+ " : " +message;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
})
//Message from bot to be outputted
// socket.on('bot-message', (message) => {
//     var item = document.createElement('div');
//     item.textContent = "NCC-Bot : " +message;
//     messages.appendChild(item);
//     window.scrollTo(0, document.body.scrollHeight);
//     //outputMessage(message);
// });

socket.on('welcome-user', username => {
    // var item = document.createElement('div');
    // item.textContent = username +' has joined the chat.';
    // messages.appendChild(item);
    // window.scrollTo(0, document.body.scrollHeight);
    var li = document.createElement("li")
    li.appendChild(document.createTextNode(username +' has joined the chat.'))
    messages.appendChild(li)
    divMessage.scrollTop = divMessage.scrollHeight

})


const createRoom = (OtherUserid) => {
    alert(OtherUserid)
    alert(socket.id)
    var randomCode = Math.random().toString(36).substring(2,7);
    roomCode = randomCode.toString();
    socket.emit('create-room', roomCode, socket.id, OtherUserid);
    //openChatWindow(roomCode);
}



// const sendMessage = (room) => {
//     let loggedUser = socket.id;
//     let message = $('#'+room).find('.messageText').val();
//     $('#'+room).find('.messageText').val('');
//     socket.emit('message', {room: room, message:message, from: loggedUser});
//     sendMyMessage(room, loggedUser, message)
// }



socket.on('update-userlist', users => {
    var connectedUserId = socket.id;
    $('.user-list').html('<ul></ul>').addClass('users')
    users.forEach(user => {
        if(connectedUserId != user.id){
            $('.user-list ul').append(`<li>${user.username}</li>`)
        }
        else {
            $('.user-list ul').append(`<li>You: ${user.username}</li>`)
        }
    });
})


socket.on('NewRoomWarn', (adminId, OtherUserId) => {
    if (socket.id == adminId){
        socket.emit('OutputMessage')
    }
})


socket.on('invite', room => {
    socket.emit('join-room', room);
})


socket.on('goodbye-user', user => {

    var li = document.createElement('li');
    li.appendChild(document.createTextNode(user.username +' has left the chat.'))
    messages.appendChild(li);
    divMessage.scrollTop = divMessage.scrollHeight

})

//Message submit on chatbox form (click on send button)
chatForm.addEventListener('submit', e => {
    e.preventDefault();
    var message = document.getElementById('message-input');
    console.log(message);
    socket.emit('chatMessage', message.value);
    message.value = "";
});


