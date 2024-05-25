const SharedKey = require('../models/sharedKey');

exports.saveSharedKey = async function(data) {
    try {
        const sharedKey = new SharedKey({
            userId: data.userId,
            sessionId: data.sessionId,
            sharedKey: data.sharedKey,
            createdAt: data.createdAt,
            expiresAt: data.expiresAt,
            isActive: data.isActive
        })
        await sharedKey.save();
        console.log("Shared Key saved successfully");
    } catch (error) {
        console.log('Error saving shared key: ', error);
    }
}

exports.hasActiveSharedKey = async function(userId){
    try {
        const sharedKey = await SharedKey.exists({userId: userId, isActive: true});
        return !!sharedKey;
    } catch (error) {
        console.error("Error checking for active shared key: ", error)
        return  false;
    }
}