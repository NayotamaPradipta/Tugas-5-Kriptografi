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
    let priv_key; 
    do {
        priv_key = BigInt('0x' + crypto.randomBytes(32).toString('hex')) % q;
    } while (priv_key === 0n);
    return priv_key;
}

function generatePublicKey(s){
    let key; 
    do {
        key = modPow(alpha, -s, p);
    } while (key === 0n);
    return key;
}

function hash(message, x) {
    const messageBuffer = Buffer.from(message, 'utf8');
    const xBuffer = Buffer.from(x.toString(), 'utf8');
    const data = Buffer.concat([messageBuffer, xBuffer]);
    return BigInt('0x' + crypto.createHash('sha256').update(data).digest('hex'));
}

function generate_DS(message, s){
    const r = generatePrivateKey();
    const x = modPow(alpha, r, p);
    const e = hash(message, x)
    const y = (r + s*e) % q;
    return { e, y };
}

function verify_DS(message, signature, public_key){
    const {e, y} = signature;
    const term1 = modPow(alpha, y, p);
    const term2 = modPow(public_key, e, p);
    const x_aksen = (term1 * term2) % p; 
    const e_aksen = hash(message, x_aksen)
    return e === e_aksen
}


module.exports = {
    get_P,
    get_Q,
    get_alpha,
    generatePrivateKey,
    generatePublicKey,
    hash,
    generate_DS,
    verify_DS
}