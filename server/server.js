const express = require('express');
const http = require('http')
const { Server } = require("socket.io");
const cors = require('cors')

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://127.0.0.1:4020", "http://127.0.0.1:2040"],
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
});

io.on('connection', (socket) => {
    console.log('A user connected', socket.id)
    socket.on('disconnect', () => {
        console.log('A user disconnected', socket.id);
    })
    socket.on('chat message', (msg) => {
        console.log('message:', msg);
        socket.broadcast.emit('chat message', msg);
    })
})

server.listen(3001, () => {
    console.log('Server is running on port 3001');
});