var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, () => {
    console.log('listening on at port %d', port);
});


//Routing
app.use(express.static(path.join(__dirname, 'public')));

//Chatroom 

var numUsers = 0;

io.on('connection', (socket) => {
    var addedUser = false;

    //when client emits 'new message', this listens and executes
    socket.on('new message', (data) => {
        //we tell client to excute new message
        socket.broadcast.emit('new message', {
            username: socket.username,
            message: data
        });
    });

    //when client emits 'add user', listen and execute
    socket.on('add user', (username) => {
        if (addedUser) return;
        // store username in socket session for this client
        socket.username = username;
        ++numUsers;
        addedUser = true;
        socket.emit('login', {
            numUsers: numUsers
        });
        //echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: numUsers
        });
    });
    // when client emits 'typing', we broadcasst to others
    socket.on('typing', () => {
        socket.broadcast.emit('typing', {
            username: socket.username
        });
    });
    // when client emits 'stop typing', broadcast to others
    socket.on('stop typing', () => {
        socket.broadcast.emit('stop typing', {
            username: socket.username
        });
    });
    // when user disconnects
    socket.on('disconnect', () => {
        if (addedUser) {
            --numUsers;
            //echo globally this client has left
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });
        }
    });
});
