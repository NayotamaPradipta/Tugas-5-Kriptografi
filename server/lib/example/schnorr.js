const { generatePrivateKey, generatePublicKey, hash, generate_DS } = require('../schnorr')


const priv_key = generatePrivateKey();
const pub_key = generatePublicKey(priv_key);

const msg = "Tugas-5-Kriptografi";
const signature = generate_DS(msg, priv_key);

console.log("Private Key: ", priv_key);
console.log("Public Key: ", pub_key);
console.log("Signature: ", signature);
