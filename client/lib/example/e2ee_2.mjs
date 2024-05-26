import CryptoJS from 'crypto-js';
import { encrypt, decrypt, generateKeyPair } from "../elgamal.mjs";
import { convertCipherToString, convertStringToCipher } from "../helper.mjs";
import { generateKeyPair as generateECDHKeyPair, computeSharedKey } from '../ecdh.mjs';
// Example usage of AES encryption and decryption
const keypairAlice = generateECDHKeyPair()
const keypairBob = generateECDHKeyPair()
const keyPairServer = generateECDHKeyPair()

const test = computeSharedKey(keypairAlice.privateKey, keyPairServer.publicKey);
let sharedKeyServerAlice = '5012706585773304299494667391592626557327236415116502268688'
let sharedKeyAliceServer = '5643156490685651858694861461958388076270112876890334873567'
let sharedKeyServerBob = '2862242940817484767931829385537693569183906934583203588829'
let sharedKeyBobServer = '643667461031370342458712022835015203972382083415692159932'
console.log(test);
console.log(sharedKeyAliceServer);

const plaintext = "SUSAH JIR";

const inner_key = generateKeyPair();
const encrypted_inner = encrypt(inner_key[1], plaintext);
console.log(`Encrypted inner: ${encrypted_inner}`);

const transformed_encrypted_inner = convertCipherToString(encrypted_inner);
console.log("Encrypted Inner Transformed: ", transformed_encrypted_inner);

const encrypted_outer = CryptoJS.AES.encrypt(transformed_encrypted_inner, sharedKeyAliceServer.toString(16)).toString();
console.log(`Encrypted outer : ${encrypted_outer}`);

const bytes = CryptoJS.AES.decrypt(encrypted_outer, sharedKeyServerAlice.toString(16));
const decrypted = bytes.toString(CryptoJS.enc.Utf8);
console.log(`Decrypted outer: ${decrypted}`);

const transformed_decrypted_outer = convertStringToCipher(decrypted);
console.log(transformed_decrypted_outer);

const reEncryptedForBob = CryptoJS.AES.encrypt(decrypted, sharedKeyServerBob.toString(16)).toString();
console.log(`Re-encrypted for Bob (Server to Bob): ${reEncryptedForBob}`);

// Bob decrypts the message with the shared key between Bob and the Server
const bytesBob = CryptoJS.AES.decrypt(reEncryptedForBob, sharedKeyBobServer.toString(16));
const decryptedByBob = bytesBob.toString(CryptoJS.enc.Utf8);
console.log(`Decrypted by Bob: ${decryptedByBob}`);

const transformed_decrypted_outer_by_bob = convertStringToCipher(decryptedByBob);
console.log("Transformed Decrypted Outer by Bob:", transformed_decrypted_outer_by_bob);

// Bob decrypts the inner message using the inner key
const decrypted_inner_by_bob = decrypt(inner_key[0], transformed_decrypted_outer_by_bob);
console.log(`Decrypted inner by Bob: ${decrypted_inner_by_bob}`);