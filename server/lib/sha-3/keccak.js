const keccak_f = require('./keccak_f');

function pad(Mbytes, Mbits) {
  let d = (1 << Mbits.length) + Mbits.reduce((acc, bit, i) => acc + (bit << i), 0);
  let P = Mbytes.concat([d]).concat([0x00]);

  while ((P.length * 8) % r !== 0) {
    P.push(0x00);
  }

  P[P.length - 1] ^= 0x80;

  return P;
}

function keccak(r, c, Mbytes, Mbits) {
  let P = pad(Mbytes, Mbits);
  let S = Array.from(Array(5), () => new Array(5).fill(0));

  // Absorbing phase
  for (let i = 0; i < P.length; i += r / 8) {
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        if (x + 5 * y < r / 8) {
          S[x][y] ^= P[i + x + 5 * y];
        }
      }
    }
    S = keccak_f(r + c, S);
  }

  // Squeezing phase
  let Z = [];
  while (true) {
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        if (x + 5 * y < r / 8) {
          Z.push(S[x][y]);
        }
      }
    }
    S = keccak_f(r + c, S);
    // Break the loop condition as per required output length
  }

  return Z;
}

module.exports = keccak;
