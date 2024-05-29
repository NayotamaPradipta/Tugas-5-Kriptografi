const CryptoJS = require('crypto-js');
const fs = require('fs').promises;

async function encryptIntercept() {
    try {
        // Read command line arguments for filenames
        const msgFilename = process.argv[2];
        const keyFilename = process.argv[3];

        // Read contents of the files
        const decryptedMessage = await fs.readFile(msgFilename, 'utf8');
        const sharedKey = (await fs.readFile(keyFilename, 'utf8')).trim();

        // Decrypt the message
        const messageObj = JSON.parse(decryptedMessage);
        const encryptedBody = CryptoJS.AES.encrypt(JSON.stringify(messageObj), sharedKey).toString();
        console.log('Decrypted body: ', encryptedBody); 

        // Write the decrypted data to a new file
        await fs.writeFile('encryptedOutput.txt', encryptedBody, 'utf8');
        console.log('Encryption complete. Data written to encryptedOutput.txt');
    } catch (error) {
        console.error('Error:', error);
    }
}

encryptIntercept();
