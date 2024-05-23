const { BBS } = require('../bbs')
const bbs1 = BBS(64, false);
console.log(bbs1.toString());
console.log(bbs1.isPrime());

const bbs2 = BBS(64, true);
console.log(bbs2.toString());
console.log(bbs2.isPrime());