const KeySession = require('../models/key')

exports.saveKeySession = async function(data) {
    try {
        const key = new KeySession({
            userId: data.userId, 
            sessionId: data.sessionId, 
            publicKey: data.publicKey,
            privateKey: data.privateKey,
            createdAt: data.createdAt,
            expiresAt: data.expiresAt,
            isActive: data.isActive
        })
        await key.save()
        console.log("Key session saved successfully")
    } catch (error) {
        console.log('Error saving key session: ', error)
    }
}