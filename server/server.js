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
const CryptoJS = require('crypto-js');
const { type } = require('os');

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
        
        const userId = socket.handshake.query.userId;
        console.log('A user connected: ', socket.id, 'userId: ', userId);
        const hasActiveKey = await sharedKeyController.hasActiveSharedKey(userId);
        if (!hasActiveKey) {
            socket.emit('invalidSharedKey');
            socket.on('acknowledgeInvalidKey', async (ack) => {
                if (ack === 'cleared') {
                    let clientPublicKey = socket.handshake.query.clientPublicKey;
                    console.log(typeof(clientPublicKey));
                    if (clientPublicKey){
                        clientPublicKey = clientPublicKey.split(',').map(component => component.trim());
                    }
                    
                    console.log(`A user connected: ${userId} (${socket.id}) with public key: ${clientPublicKey}`);
                    const serverKeyPair = generateKeyPair();
                    console.log("Server Public Key: ", serverKeyPair.publicKey);
                    console.log("Server Private key: ", serverKeyPair.privateKey);
                    const expiresAt = new Date(Date.now() + 86400000);
                    // Send server public key to client
                    socket.emit('serverPublicKey', {
                        publicKey: [serverKeyPair.publicKey[0].toString(), serverKeyPair.publicKey[1].toString()],
                        expiresAt: expiresAt.toISOString()
                    });
                    try {
                        console.log('Computing shared key...');
                        console.log('Server Private Key (TRY): ', serverKeyPair.privateKey.toString());
                        console.log('Client Public Key: ', clientPublicKey);
                        console.log('Client Public Key: ', clientPublicKey[0]);
                        console.log('Client Public Key: ', clientPublicKey[1]);
                        const sharedKey = computeSharedKey(serverKeyPair.privateKey.toString(), clientPublicKey);
                        console.log('Shared Key: ', sharedKey.toString(16));
            
                        const sharedKeyData = {
                            userId: userId,
                            sessionId: socket.id,
                            sharedKey: sharedKey.toString(16),
                            expiresAt: expiresAt,
                            isActive: true
                        };
            
                        console.log('Saving shared key...');
                        await sharedKeyController.updateOrSaveSharedKey(sharedKeyData);
                    } catch (error) {
                        console.log("Error during shared key computation or saving: ", error);
                    }
                } else {
                    console.log(`Client ${userId} failed to clear local storage.`);
                }
            })
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
        socket.on('chat message', async (msg) => {
            console.log('message:', msg);
            console.log(userId);
            const sharedKeyData = await sharedKeyController.getSharedKey(userId);
            if (!sharedKeyData) {
                // socket.emit('invalidSharedKey');
                return;
            }
            const sharedKey = sharedKeyData.sharedKey;
            console.log(sharedKey);
            // Decrypt with shared key server + sender
            const bytes = CryptoJS.AES.decrypt(msg, sharedKey);
            console.log(bytes.toString(CryptoJS.enc.Utf8))
            const decryptedBody = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
            console.log('Decrypted body: ', decryptedBody);
            // Encrypt with shared key server + receiver
            const sharedKeyDataReceiver = await sharedKeyController.getSharedKey(decryptedBody.receiver);
            const sharedKeyReceiver = sharedKeyDataReceiver.sharedKey;
            const encryptedBody = CryptoJS.AES.encrypt(JSON.stringify(decryptedBody), sharedKeyReceiver).toString();
            console.log(encryptedBody);
            socket.broadcast.emit('chat message', encryptedBody);
        })
    })
}).catch(err => {
    console.log('Failed to connect to MongoDB', err);
}); 


