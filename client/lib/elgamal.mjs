import { pointAddition, scalarMultiplication } from './ecc1.mjs';
import { computePoints } from './encoder.mjs';
import { webcrypto } from 'crypto';
// Parameter dari Kurva secp192r1 (P-192)
const p  = BigInt('0xfffffffffffffffffffffffffffffffeffffffffffffffff');
const a  = BigInt('0xfffffffffffffffffffffffffffffffefffffffffffffffc');
// Point Generator
const Gx = BigInt('0x188da80eb03090f67cbf20eb43a18800f4ff0afd82ff1012');
const Gy = BigInt('0x07192b95ffc8da78631011ed6b24cdd573f977a11e794811');
// Orde dari Generator (192 bit)
const n  = BigInt('0xffffffffffffffffffffffff99def836146bc9b1b4d22831');
const validPoints = computePoints();

function getRandomBytes(length) {
  const array = new Uint8Array(length);
  webcrypto.getRandomValues(array);
  return array;
}

// Menghitung private key (skalar) dan publik key (point)
export function generateKeyPair() {
  // Menentukan angka random 192 bit sebagai private key
  const privateKey = BigInt('0x' + Array.from(getRandomBytes(24)).map(b => b.toString(16).padStart(2, '0')).join('')) % n;
  // Menghitung private key * G sebagai public key
  const publicKey = scalarMultiplication(privateKey, [Gx, Gy], p, a);
  return [ privateKey, publicKey ];
}

// --Fungsi encoding dan decoding--
function encodeChar(char) {
  const charCode = char.charCodeAt(0);
  return validPoints[charCode];
}

function decodePoint(point) {
  for (let i = 0; i < validPoints.length; i++) {
      if (validPoints[i][0] === point[0] && validPoints[i][1] === point[1]) {
          return String.fromCharCode(i);
      }
  }
}

function encodeString(message) {
  return message.split('').map(encodeChar);
}

// --Fungsi enkripsi dan dekripsi--
export function encrypt(publicKey, message) {
  const cipher = [];
  const M = encodeString(message);

  // Enkripsi setiap char
  for (let i = 0; i < M.length; i++) {
    const k = BigInt('0x' + Array.from(getRandomBytes(24)).map(b => b.toString(16).padStart(2, '0')).join('')) % n;
    const C1 = scalarMultiplication(k, [Gx, Gy], p, a);
    const C2 = pointAddition(M[i], scalarMultiplication(k, publicKey, p, a), p, a);
    cipher.push({ C1, C2 });
  }

  return cipher;
}

export function decrypt(privateKey, cipher) {
  let message = '';

  // Dekripsi setiap cipher points pair
  for (let i = 0; i < cipher.length; i++) {
    const { C1, C2 } = cipher[i];
    const S = scalarMultiplication(privateKey, C1, p, a);
    const M = pointAddition(C2, [S[0], p - S[1]], p, a);
    const char = decodePoint(M);
    message += char;
  }

  return message;
}