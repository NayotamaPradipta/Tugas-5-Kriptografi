const CryptoJS = require('crypto-js');
const fs = require('fs').promises;

async function decryptIntercept() {
    try {
        // Read command line arguments for filenames
        const msgFilename = process.argv[2];
        const keyFilename = process.argv[3];

        // Read contents of the files
        const encryptedMsg = await fs.readFile(msgFilename, 'utf8');
        const sharedKey = (await fs.readFile(keyFilename, 'utf8')).trim();

        // Decrypt the message
        console.log(BigInt(sharedKey));
        console.log(encryptedMsg);
        const bytes = CryptoJS.AES.decrypt(encryptedMsg, sharedKey);
        const decryptedBody = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        console.log('Decrypted body: ', decryptedBody);

        // Write the decrypted data to a new file
        await fs.writeFile('decryptedOutput.txt', JSON.stringify(decryptedBody), 'utf8');
        console.log('Decryption complete. Data written to decryptedOutput.txt');
    } catch (error) {
        console.error('Error:', error);
    }
}

decryptIntercept();
