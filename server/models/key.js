const mongoose = require('mongoose')

const keySessionSchema = mongoose.Schema(
    {
        userId: { type: String, required: true },
        sessionId: { type: String, required: true },
        publicKey: { type: String, required: true },
        privateKey: { type: String, required: true, select: false },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, required: true},
        isActive: { type: Boolean, default: true}
    }
)

const key = mongoose.model('session_key', keySessionSchema)

module.exports = key