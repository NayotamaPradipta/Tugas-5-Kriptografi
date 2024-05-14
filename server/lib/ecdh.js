const crypto = require('crypto');
const scalarMultiplication = require('./ecc.js');

// Parameter dari Kurva secp192r1 (P-192)
const p  = BigInt('0xfffffffffffffffffffffffffffffffeffffffffffffffff');
const a  = BigInt('0xfffffffffffffffffffffffffffffffefffffffffffffffc');
// Point Generator
const Gx = BigInt('0x188da80eb03090f67cbf20eb43a18800f4ff0afd82ff1012');
const Gy = BigInt('0x07192b95ffc8da78631011ed6b24cdd573f977a11e794811');
// Orde dari Generator (192 bit)
const n  = BigInt('0xffffffffffffffffffffffff99def836146bc9b1b4d22831');

// Menghitung private key (skalar) dan publik key (point)
function generateKeyPair() {
  // Menentukan angka random 192 bit sebagai private key
  const privateKey = BigInt('0x' + crypto.randomBytes(24).toString('hex')) % n;
  // Menghitung private key * G sebagai public key
  const publicKey = scalarMultiplication(privateKey, [Gx, Gy], p, a);
  return { privateKey, publicKey };
}

// Menghitung shared key (skalar)
function computeSharedKey(privateKey, publicKey) {
  // Menghitung private key * public key lawan
  const sharedPoint = scalarMultiplication(privateKey, publicKey, p, a);
  // Menggunakan komponen x saja sebagai shared key
  return sharedPoint[0];
}

module.exports = {
  generateKeyPair,
  computeSharedKey
}
