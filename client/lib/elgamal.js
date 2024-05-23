import { pointAddition, scalarMultiplication } from './ecc.js';

// Parameter dari Kurva secp192r1 (P-192)
const p  = BigInt('0xfffffffffffffffffffffffffffffffeffffffffffffffff');
const a  = BigInt('0xfffffffffffffffffffffffffffffffefffffffffffffffc');
// Point Generator
const Gx = BigInt('0x188da80eb03090f67cbf20eb43a18800f4ff0afd82ff1012');
const Gy = BigInt('0x07192b95ffc8da78631011ed6b24cdd573f977a11e794811');
// Orde dari Generator (192 bit)
const n  = BigInt('0xffffffffffffffffffffffff99def836146bc9b1b4d22831');

function getRandomBytes(length) {
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
  return { privateKey, publicKey };
}

// Enkripsi: output cipher points {C1, C2}
export function encrypt(publicKey, M) {
  // K random
  const k = BigInt(`0x${Array.from(getRandomBytes(32)).map(b => b.toString(16).padStart(2, '0')).join('')}`);
  // Menghitung C1
  const C1 = scalarMultiplication(k, G, p, a);
  // Menghitung C2
  const C2 = pointAddition(M, scalarMultiplication(k, publicKey, p, a), p, a);
  return { C1, C2 };
}

// Dekripsi: output plain point M
export function decrypt(privateKey, C) {
  const { C1, C2 } = C;
  const S = scalarMultiplication(privateKey, C1, p, a);
  const M = pointAddition(C2, [S[0], p - S[1]], p, a);
  return M;
}