
var socket = io();

var form = document.getElementById('form');
var username = document.getElementById('username');

form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (username.value) {
        socket.emit('chat message', username.value);
        console.log(username.value)
        username.value = '';
        }
    });
