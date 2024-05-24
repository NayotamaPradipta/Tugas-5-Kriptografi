const { generatePrivateKey, generatePublicKey, generate_DS, verify_DS, generateGlobalPublicKey } = require('../schnorr')

const { p, q, alpha } = generateGlobalPublicKey();


const priv_key = generatePrivateKey(q);
const pub_key = generatePublicKey(priv_key, p, alpha);

const msg = "Tugas-5-Kriptografi";
const signature = generate_DS(msg, priv_key, p, q, alpha);
const verify = verify_DS(msg, signature, pub_key, p, alpha)
console.log("Private Key: ", priv_key);
console.log("Public Key: ", pub_key);
console.log("Signature: ", signature);
console.log("Verify Status: ", verify)