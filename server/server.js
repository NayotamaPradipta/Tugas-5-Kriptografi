require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const connectDB = require('./db/connectDB');
const chatController = require('./controllers/chatController');
const keySessionController = require('./controllers/keyController');
const sharedKeyController = require('./controllers/sharedKeyController');
const { generateKeyPair, computeSharedKey } = require('./lib/ecdh');
const exp = require('constants');

const sampleMessageData = {
    senderId: "Alice",
    receiverId: "Bob",
    encryptedMessage: "<Encrypted_Content>",
    sessionId: "session_1"
};

const sampleKeyData = {
    userId: "Alice",
    sessionId: "session_1",
    publicKey: "ABCD",
    privateKey: "EFGH",
    createdAt: new Date().getTime(),
    expiresAt: new Date(new Date().getTime() + (24 * 60 * 60 * 1000))
};

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

connectDB().then(() => {
    const userPublicKeys = {};
    server.listen(3001, () => {
        console.log('Server is running on port 3001');
    });

    io.on('connection', async (socket) => {
        console.log('A user connected: ', socket.id);
        const userId = socket.handshake.query.userId;
        const hasActiveKey = await sharedKeyController.hasActiveSharedKey(userId);
        if (!hasActiveKey) {
            const clientPublicKey = socket.handshake.query.clientPublicKey;
            console.log(`A user connected: ${userId} (${socket.id}) with public key: ${clientPublicKey}`);
            const serverKeyPair = generateKeyPair();
            const expiresAt = new Date(Date.now() + 86400000);
            // Send server public key to client
            socket.emit('serverPublicKey', {
                publicKey: serverKeyPair.publicKey,
                expiresAt: expiresAt.toISOString()
            });
            (async () => {
                try {
                    console.log('Computing shared key...');
                    const sharedKey = computeSharedKey(serverKeyPair.privateKey, clientPublicKey);
                    console.log('Shared Key: ', sharedKey.toString(16));
        
                    const sharedKeyData = {
                        userId: userId,
                        sessionId: socket.id,
                        sharedKey: sharedKey.toString(16),
                        expiresAt: expiresAt,
                        isActive: true
                    };
        
                    console.log('Saving shared key...');
                    await sharedKeyController.saveSharedKey(sharedKeyData);
                } catch (error) {
                    console.log("Error during shared key computation or saving: ", error);
                }
            })();
        } 

        socket.on('sendE2EEPublicKey', (data) => {
            const { publicKey } = data; 
            userPublicKeys[userId] = publicKey;
            console.log(`Public key received and stored for user ${userId}`);

            socket.broadcast.emit('exchangePublicKeys', { userId, publicKey})
            console.log(`Public key from ${userId} broadcasted. `);
        })


        socket.on('disconnect', () => {
            console.log('A user disconnected', socket.id);
        })
        socket.on('chat message', (msg) => {
            console.log('message:', msg);
            socket.broadcast.emit('chat message', msg);
        })
    })
}).catch(err => {
    console.log('Failed to connect to MongoDB', err);
}); 


