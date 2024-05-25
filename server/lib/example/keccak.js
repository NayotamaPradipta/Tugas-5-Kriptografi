const { keccakHashFromString } = require('../keccak');
// example
let message = "Hello, world!";
let hash = keccakHashFromString(message, 256); 
console.log(hash); 