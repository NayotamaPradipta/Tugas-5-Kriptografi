import { scalarMultiplication } from './ecc2.mjs';
import bigInt from 'big-integer';
import { BBS } from './bbs.mjs';
// Parameter dari Kurva secp192r1 (P-192)
const p  = bigInt('fffffffffffffffffffffffffffffffeffffffffffffffff', 16);
const a  = bigInt('fffffffffffffffffffffffffffffffefffffffffffffffc', 16);
// Point Generator
const Gx = bigInt('188da80eb03090f67cbf20eb43a18800f4ff0afd82ff1012', 16);
const Gy = bigInt('07192b95ffc8da78631011ed6b24cdd573f977a11e794811', 16);
// Orde dari Generator (192 bit)
const n  = bigInt('ffffffffffffffffffffffff99def836146bc9b1b4d22831', 16);

// Menghitung private key (skalar) dan publik key (point)
export function generateKeyPair() {
  // Menentukan angka random 192 bit sebagai private key 
  const privateKey = BBS(192, false).mod(n.minus(1)).add(1);
  // Menghitung private key * G sebagai public key
  const publicKey = scalarMultiplication(privateKey, [Gx, Gy], p, a);
  return { 
    privateKey: privateKey.toString(), 
    publicKey: publicKey.map(p => p.toString()) 
  };
}

// Menghitung shared key (skalar)
export function computeSharedKey(privateKey, publicKey) {
  // Menghitung private key * public key lawan
  const sharedPoint = scalarMultiplication(privateKey, publicKey, p, a);
  // Menggunakan komponen x saja sebagai shared key
  return sharedPoint[0].toString();
}