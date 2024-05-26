import bigInt from "big-integer";
import { encrypt, decrypt, generateKeyPair } from "../elgamal.mjs";

const test = bigInt(5);
console.log(test);
const key = generateKeyPair();
console.log('Private: ', key[0]);
console.log('Public: ', key[1]);

const text = "Hello World"; 
const cipher = encrypt(key[1], text);
console.log('Cipher: ', cipher);
// Format cipher C1, c2 --> masing-masing x,y 
// Jadi input Puffer Cipher 
// 1 huruf jadi 1 point --> Jadi 2 point cipher 
// Array jadi string, terus string jadi array 
// Hapus n pada saat ngubah ke string 


const decrypted = decrypt(key[0], cipher);
console.log('Decrypted: ', decrypted);