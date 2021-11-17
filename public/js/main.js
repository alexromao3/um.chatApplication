const chatForm = document.getElementById('send-container');
var messages = document.getElementById('messages');

//const userForm = document.getElementsById('user-container');
//console.log(username.value);


const socket = io();

//Get username from URL
const username = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

//Send the username received in the index to server validation
socket.emit("new-user", (username.username));


//Message from server to be outputted
socket.on('message', (message, username) => {
    var item = document.createElement('div');
    item.textContent = username+ " : " +message;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
    //outputMessage(message);
});

//Message from bot to be outputted
socket.on('bot-message', (message) => {
    var item = document.createElement('div');
    item.textContent = "NCC-Bot : " +message;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
    //outputMessage(message);
});

socket.on('welcome-user', username => {
    var item = document.createElement('div');
    item.textContent = username +' has joined the chat.';
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);

})


socket.on('update-userlist', users => {

    document.getElementById('user-list').innerHTML = '';
    ul = document.createElement('ul');
    document.getElementById('user-list').appendChild(ul);
    //alert(users);
    // alert(users.length)
    // alert(connectedUserId);
    // for (let i = 0; i < users.length; i++){
    //     alert(users[i].username)
    // }
    for (var i = 0; i < users.length; i++)
    {
        if(users[i].id !== socket.id){
            let li = document.createElement('li');
            ul.appendChild(li);
            li.textContent = users[i].username;
            alert(li.textContent);
        }
    }

})


socket.on('goodbye-user', username => {
    var item = document.createElement('div');
    item.textContent = username +' has left the chat.';
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);


})


//Message submit
chatForm.addEventListener('submit', e => {
    e.preventDefault();
    var message = document.getElementById('message-input');
    //console.log(message);
    socket.emit('chatMessage', message.value);
    message.value = "";
});

