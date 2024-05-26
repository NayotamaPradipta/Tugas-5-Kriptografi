import { computeSharedKey, generateKeyPair } from "../ecdh.mjs";

let key = generateKeyPair();
console.log('Private key: ', key.privateKey);
console.log('Public key (x): ', key.publicKey[0]);
console.log('Public key (y): ', key.publicKey[1]);


let publicKey = ['5422799083382672484271629433797470694823133285949039191809','6250468576238299207611293761750060022371018699263521582997']
let privateKey = '2076850668586584240157966991930452621894473217106836979713'
console.log(computeSharedKey(privateKey, publicKey));