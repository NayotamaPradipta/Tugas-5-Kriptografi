import { scalarMultiplication } from './ecc';
// Parameter dari Kurva secp192r1 (P-192)
const p  = BigInt('0xfffffffffffffffffffffffffffffffeffffffffffffffff');
const a  = BigInt('0xfffffffffffffffffffffffffffffffefffffffffffffffc');
// Point Generator
const Gx = BigInt('0x188da80eb03090f67cbf20eb43a18800f4ff0afd82ff1012');
const Gy = BigInt('0x07192b95ffc8da78631011ed6b24cdd573f977a11e794811');
// Orde dari Generator (192 bit)
const n  = BigInt('0xffffffffffffffffffffffff99def836146bc9b1b4d22831');

function getRandomBytes(length){
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return array;
}


// Menghitung private key (skalar) dan publik key (point)
export function generateKeyPair() {
  // Menentukan angka random 192 bit sebagai private key
  const privateKey = BigInt('0x' + Array.from(getRandomBytes(24)).map(b => b.toString(16).padStart(2, '0')).join('')) % n;
  // Menghitung private key * G sebagai public key
  const publicKey = scalarMultiplication(privateKey, [Gx, Gy], p, a);
  return { privateKey: privateKey.toString(), publicKey: publicKey.map(p => p.toString()) };
}

// Menghitung shared key (skalar)
export function computeSharedKey(privateKey, publicKey) {
  // Menghitung private key * public key lawan
  const sharedPoint = scalarMultiplication(privateKey, publicKey, p, a);
  // Menggunakan komponen x saja sebagai shared key
  return sharedPoint[0].toString();
}
