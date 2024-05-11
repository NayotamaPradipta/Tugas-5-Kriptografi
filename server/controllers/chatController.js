const ChatMessage = require('../models/chat')

exports.saveChatMessage = async function(data) {
    try {
        const message = new ChatMessage({
            senderId: data.senderId,
            receiverId: data.receiverId, 
            encryptedMessage: data.encryptedMessage,
            sessionId: data.sessionId
        })
        await message.save()
        console.log("Chat message saved successfully")
    } catch (error) {
        console.error('Error saving chat message: ', error)
    }
}