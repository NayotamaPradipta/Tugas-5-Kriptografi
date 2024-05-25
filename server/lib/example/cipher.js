const {
    encrypt,
    decrypt,
    binary_to_base64,
    base64_to_string,
    removePadding
  } = require('../puffer');
const key = 'KRIPTOGRAFI';
const text = 'PERANG DUNIA III';

encrypt(text, key).then(encrypted => {
  console.log('Encrypted:', encrypted);
  return decrypt(binary_to_base64(encrypted), key); 
}).then(decrypted => {
  console.log('Decrypted:', decrypted);
  const base64_decrypted = binary_to_base64(removePadding(decrypted));
  console.log('Decrypted Base 64: ', base64_decrypted);
  const utf_string = base64_to_string(base64_decrypted);
  console.log(utf_string);
}).catch(error => {
  console.error('Error:', error);
});