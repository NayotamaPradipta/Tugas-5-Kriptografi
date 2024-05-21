const crypto = require('crypto');
const { modPow } = require('bigint-crypto-utils');
/*
    TODO: 
    - KECCAK HASH FUNCTION
    - More complex p,q,alpha values
*/
const p = BigInt('0x17');
const q = BigInt('0xB');
const alpha = BigInt('0x2');

if ((p-1n) % q !== 0n) {
    console.log((p-1n) % q)
    throw new Error('q harus faktor prima dari p-1')
}

if (modPow(alpha, q, p) !== 1n) {
    throw new Error('alpha^q mod p harus kongruen dengan 1')
}

function generatePrivateKey(){
    return BigInt('0x' + crypto.randomBytes(32).toString('hex')) % q;
}

function generatePublicKey(s){
    return alpha ** s % p;
}

function hash(data) {
    return BigInt('0x' + crypto.createHash('sha256').update(data).digest('hex'));
}

function generate_DS(message, s){
    const r = generatePrivateKey();
    const x = alpha ** r % p;
    const e = hash(message + x.toString())
    const y = (r + s*e) % q;
    return {e:e, y:y};
}

module.exports = {
    generatePrivateKey,
    generatePublicKey,
    hash,
    generate_DS
}