// import crypto from 'crypto';
import bigInt from 'big-integer';
import { BBS } from './bbs.mjs';
import { keccakHashFromString } from './keccak.mjs';
/*
    TODO: 
    - KECCAK HASH FUNCTION (BONUS)
*/

function findP(q, bits){
    let p; 
    do {    
        let r = bigInt.randBetween(bigInt(2).pow(bits - q.bitLength() - 1), bigInt(2).pow(bits - q.bitLength()));
        p = r.multiply(q).add(1);
    } while (!p.isPrime());
    
    return p;
}

function findAlpha(p, q){
    const k = p.minus(1).divide(q); // Calculate k where p = kq + 1
    let alpha = bigInt(2);
    while (true) {
        const candidate = alpha.modPow(k, p);
        if (candidate.notEquals(1)) { // Check if it's a non-trivial root of unity
            if (candidate.modPow(q, p).equals(1)) { // Check if it is of order q
                return candidate; // This is a valid generator
            }
        }
        alpha = alpha.next(); // Move to the next candidate
    }
}

export function generateGlobalPublicKey(){
    // For now, P is 1024 bits and Q is 160 bits 
    const q = BBS(160, true);
    const p = findP(q, 1024);
    console.log("P: ", p);
    console.log('Q: ', q);
    if (!p.minus(1).mod(q).equals(bigInt.zero)) {
        console.log(p.minus(1).mod(q).toString());
        throw new Error('q harus faktor prima dari p-1')
    }
    const alpha = findAlpha(p, q);
    console.log("Alpha: ", alpha);

    if (!alpha.modPow(q, p).equals(bigInt.one)) {
        throw new Error('alpha^q mod p harus kongruen dengan 1')
    }
    return {p, q, alpha};
}

export function generatePrivateKey(q){
    let priv_key; 
    do {
        priv_key = bigInt(BBS(256, true)).mod(q);
    } while (priv_key.equals(bigInt.zero));
    return priv_key;
}

export function generatePublicKey(s, p, alpha){
    let key; 
    do {
        key = alpha.modPow(s.negate(), p);
    } while (key.equals(bigInt.zero));
    return key;
}

export function hash(message, x) {
    const messageBuffer = Buffer.from(message, 'utf8');
    const xBuffer = Buffer.from(x.toString(), 'utf8');
    const data = Buffer.concat([messageBuffer, xBuffer]);
    return bigInt(window.crypto.createHash('sha256').update(data).digest('hex'), 16);
}

export function generate_DS(message, s, p, q, alpha){
    const r = generatePrivateKey(q);
    const x = alpha.modPow(r, p);
    const e = keccakHashFromString(message + x.toString());
    const y = r.add(s.multiply(e)).mod(q);
    return { e, y };
}

export function verify_DS(message, signature, public_key, p, alpha){
    const {e, y} = signature;
    const term1 = alpha.modPow(y, p);
    const term2 = public_key.modPow(e, p);
    const x_aksen = term1.multiply(term2).mod(p); 
    const e_aksen = keccakHashFromString(message + x_aksen.toString());
    return e.equals(e_aksen);
}