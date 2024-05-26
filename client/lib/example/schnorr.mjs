import { generatePrivateKey, generatePublicKey, generate_DS, verify_DS, generateGlobalPublicKey } from '../schnorr.mjs'

const { p, q, alpha } = generateGlobalPublicKey();

const priv_key = generatePrivateKey(q);
const pub_key = generatePublicKey(priv_key, p, alpha);

const msg = "Tugas-5-Kriptografi";
const msg2 = "Tugas-5-Kriptografi";
const signature = generate_DS(msg, priv_key, p, q, alpha);
const verify = verify_DS(msg2, signature, pub_key, p, alpha)
console.log("Private Key: ", priv_key);
console.log("Public Key: ", pub_key);
console.log("Signature: ", signature);
console.log("Verify Status: ", verify)