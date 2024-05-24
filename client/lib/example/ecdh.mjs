import { generateKeyPair } from "../ecdh.mjs";

let key = generateKeyPair();
console.log('Private key: ', key.privateKey);
console.log('Public key (x): ', key.publicKey[0]);
console.log('Public key (y): ', key.publicKey[1]);