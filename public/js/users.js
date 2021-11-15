const socket = io();
// var username = document.getElementById('username');
// console.log(username);

//const userForm = document.getElementById("user-container");
//var user = document.getElementById("username-input");
socket.emit('new-user');
