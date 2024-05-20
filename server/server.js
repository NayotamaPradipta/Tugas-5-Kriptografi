require('dotenv').config()
const express = require('express');
const http = require('http')
const { Server } = require("socket.io");
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb')
const connectDB = require('./db/connectDB')
const chatController = require('./controllers/chatController')
const keySessionController = require('./controllers/keyController')
const { generateKeyPair, computeSharedKey } = require('./lib/ecdh')

const sampleMessageData = {
    senderId: "Alice",
    receiverId: "Bob",
    encryptedMessage: "<Encrypted_Content>",
    sessionId: "session_1"
}

const sampleKeyData = {
    userId: "Alice",
    sessionId: "session_1",
    publicKey: "ABCD",
    privateKey: "EFGH",
    createdAt: new Date().getTime(),
    expiresAt: new Date(new Date().getTime() + (24 * 60 * 60 * 1000))
}

// connectDB().then(() => {
//     chatController.saveChatMessage(sampleMessageData)
//     .then(() => {
//         keySessionController.saveKeySession(sampleKeyData)
//     })
    
// })

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

    const serverKeyPair = generateKeyPair();

    socket.emit('serverPublicKey', serverKeyPair.publicKey)

    socket.on('clientPublicKey', (clientPublicKey) => {
        const sharedKey = computeSharedKey(serverKeyPair.privateKey, clientPublicKey);
        console.log('Shared Key: ', sharedKey.toString(16));
    })


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