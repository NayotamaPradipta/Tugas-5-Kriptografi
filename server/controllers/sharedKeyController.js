const SharedKey = require('../models/sharedKey');

exports.updateOrSaveSharedKey = async function(data) {
    try {
        const existingKey = await SharedKey.findOne({ userId: data.userId });
        if (existingKey) {
            existingKey.sharedKey = data.sharedKey;
            existingKey.sessionId = data.sessionId;
            existingKey.expiresAt = data.expiresAt;
            existingKey.createdAt = new Date(); 
            await existingKey.save();
            console.log("Shared Key updated successfully");
        } else {
            const sharedKey = new SharedKey({
                userId: data.userId,
                sessionId: data.sessionId,
                sharedKey: data.sharedKey,
                createdAt: data.createdAt,
                expiresAt: data.expiresAt
            })
            await sharedKey.save();
            console.log("Shared Key saved successfully");
        }

    } catch (error) {
        console.log('Error saving shared key: ', error);
    }
}

exports.hasActiveSharedKey = async function(userId) {
    try {
        const now = new Date();
        const sharedKey = await SharedKey.findOne({ userId: userId });
        if (sharedKey && new Date(sharedKey.expiresAt) > now) {
            return true;
        }
        return false;
    } catch (error) {
        console.error("Error checking for active shared key: ", error);
        return false;
    }
};


exports.getSharedKey = async function(userId) {
    try {
        const sharedKey = await SharedKey.findOne({ userId: userId });
        if (sharedKey && new Date(sharedKey.expiresAt) > new Date()) {
            return sharedKey;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error retrieving shared key: ", error);
        throw error;
    }
};