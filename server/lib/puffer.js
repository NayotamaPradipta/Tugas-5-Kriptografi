const { execFile } = require('child_process');
const path = require('path');

function runRubyFunction(script, method, text, key) {
  return new Promise((resolve, reject) => {
    const rubyScript = path.join(__dirname, script);
    console.log(`Running: ruby ${rubyScript} ${method} "${text}" "${key}"`); 
    execFile('ruby', [rubyScript, method, text, key], (error, stdout, stderr) => {
      if (error) {
        console.error('Error executing Ruby script:', error); 
        console.error('stderr:', stderr); 
        reject(error);
      } else {
        console.log('stderr:', stderr); 
        console.log('Raw output:', stdout);
        resolve(stdout.trim()); 
      }
    });
  });
}

function encrypt(text, key) {
  return runRubyFunction('run_ecb.rb', 'encrypt', text, key);
}

function decrypt(base64_text, key) {
  return runRubyFunction('run_ecb.rb', 'decrypt', base64_text, key);
}

function binary_to_base64(binary){
    const byteArray = binary.match(/.{1,8}/g).map(byte => parseInt(byte, 2));
    const buffer = Buffer.from(byteArray);
    return buffer.toString('base64');
}
function base64_to_string(base64){
    return Buffer.from(base64, 'base64').toString('utf-8');
}

function removePadding(decryptedBinary) {
    const byteArray = decryptedBinary.match(/.{1,8}/g).map(byte => parseInt(byte, 2));
    const paddingValue = byteArray[byteArray.length - 1];
    const unpaddedByteArray = byteArray.slice(0, byteArray.length - paddingValue);
    return unpaddedByteArray.map(byte => byte.toString(2).padStart(8, '0')).join('');
}

module.exports = {
    encrypt,
    decrypt,
    binary_to_base64,
    base64_to_string,
    removePadding
}