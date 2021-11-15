const chatForm = document.getElementById('send-container');
var messages = document.getElementById('messages');

//const userForm = document.getElementsById('user-container');
//console.log(username.value);


const socket = io();

//Get username from URL
const username = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

//Send the username received in the index to the server validate
socket.emit("new-user", (username.username));


//Message from server to be outputted
socket.on('message', (message, username) => {
    var item = document.createElement('div');
    item.textContent = username+ " : " +message;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
    //outputMessage(message);
});

socket.on('new-user', username => {
    var item = document.createElement('div');
    item.textContent('Welcome '+socket.id+ ' : ' +username);
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
})
// socket.on('connection', socket => {
//     var username = prompt('What´s your username');
//     socket.emit('new-user', username);
// })
//Message submit
chatForm.addEventListener('submit', e => {
    e.preventDefault();
    var message = document.getElementById('message-input');
    //console.log(message);
    socket.emit('chatMessage', message.value);
    message.value = "";
});

// })

//Add user to system
// userForm.addEventListener('submit', e => {
//     e.preventDefault();
//     const username = document.getElementById('username').value;
//     socket.emit('addUser', username);
//     username = '';
// })
