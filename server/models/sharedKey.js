const mongoose = require('mongoose')

const sharedKeySchema = mongoose.Schema(
    {
        userId: { type: String, required: true },
        sessionId: { type: String, required: true },
        sharedKey: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, required: true},
        isActive: { type: Boolean, default: true}
    }
)

const shared_key = mongoose.model('shared_key', sharedKeySchema)

module.exports = shared_key