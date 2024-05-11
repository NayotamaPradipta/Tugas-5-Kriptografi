const mongoose = require('mongoose')

const chatMessageSchema = mongoose.Schema(
    {
        senderId: { type: String, required: true },
        receiverId: { type: String, required: true },
        encryptedMessage: { type: String, required: true},
        timeStamp: { type: Date, default: Date.now },
        sessionId: { type: String, required: true }
    }
)

const ChatMessage = mongoose.model('Message', chatMessageSchema) 

module.exports = ChatMessage