const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// Serve static files from the current directory
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('a user connected');

    // Handle sharing of video URL and captions data
    socket.on('shareMovieData', (data) => {
        console.log('Data shared by:', socket.id);
        // Broadcast the shared data to all connected clients
        io.emit('sharedMovieData', data);
    });

    socket.on('play', (timestamp) => {
        console.log('Play event received from:', socket.id);
        // Broadcast the 'play' event along with the received timestamp to all connected clients
        io.emit('play', timestamp);
    });

    socket.on('pause', (timestamp) => {
        console.log('Pause event received from:', socket.id);
        // Broadcast the 'pause' event along with the received timestamp to all connected clients
        io.emit('pause', timestamp);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected:', socket.id);
    });
});

server.listen(process.env.PORT || 3000, () => {
    console.log('listening on *:3000');
});
