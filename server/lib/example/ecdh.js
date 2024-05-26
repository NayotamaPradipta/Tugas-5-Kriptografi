const { generateKeyPair, computeSharedKey } = require('../ecdh')

let key = generateKeyPair();
console.log('Private key: ', key.privateKey);
console.log('Public key (x): ', key.publicKey[0]);
console.log('Public key (y): ', key.publicKey[1]);

let publicKey = ['2678883892339877921223583835631342291165060625188428113118', '1373332615041658521761498956881110646196793904642689421034']
let privateKey = '2516248685443751004517247368683617978801646906508463570945'
console.log(computeSharedKey(privateKey, publicKey));