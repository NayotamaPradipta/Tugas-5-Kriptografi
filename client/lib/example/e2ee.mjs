import CryptoJS from 'crypto-js';
import { encrypt, decrypt, generateKeyPair } from "../elgamal.mjs";
import { convertCipherToString, convertStringToCipher } from "../helper.mjs";
// Example usage of AES encryption and decryption
const shared_key = "KRIPTOGRAFI TUGAS V"; 
const plaintext = "SUSAH JIR";

const inner_key = generateKeyPair();
const encrypted_inner = encrypt(inner_key[1], plaintext);
console.log(`Encrypted inner: ${encrypted_inner}`);

const transformed_encrypted_inner = convertCipherToString(encrypted_inner);
console.log("Encrypted Inner Transformed: ", transformed_encrypted_inner);

const encrypted_outer = CryptoJS.AES.encrypt(transformed_encrypted_inner, shared_key).toString();
console.log(`Encrypted outer : ${encrypted_outer}`);

const bytes = CryptoJS.AES.decrypt(encrypted_outer, shared_key);
const decrypted = bytes.toString(CryptoJS.enc.Utf8);
console.log(`Decrypted outer: ${decrypted}`);

const transformed_decrypted_outer = convertStringToCipher(decrypted);
console.log(transformed_decrypted_outer);

const decrypted_inner = decrypt(inner_key[0], transformed_decrypted_outer);
console.log(decrypted_inner);
