const bigInt = require('big-integer');
const RHO_OFFSETS = [
  [0, 36, 3, 41, 18],
  [1, 44, 10, 45, 2],
  [62, 6, 43, 15, 61],
  [28, 55, 25, 21, 56],
  [27, 20, 39, 8, 14]
];

const PI_INDEXES = [
  [0, 1], [1, 6], [2, 9], [3, 22], [4, 14],
  [0, 20], [1, 6], [2, 8], [3, 18], [4, 24],
  [0, 4], [1, 19], [2, 17], [3, 10], [4, 7],
  [0, 3], [1, 15], [2, 23], [3, 11], [4, 5],
  [0, 16], [1, 12], [2, 21], [3, 13], [4, 2]
];

const ROUND_CONSTANTS = [
  bigInt('0000000000000001', 16), bigInt('0000000000008082', 16), bigInt('800000000000808a', 16), bigInt('8000000080008000', 16),
  bigInt('000000000000808b', 16), bigInt('0000000080000001', 16), bigInt('8000000080008081', 16), bigInt('8000000000008009', 16),
  bigInt('000000000000008a', 16), bigInt('0000000000000088', 16), bigInt('0000000080008009', 16), bigInt('000000008000000a', 16),
  bigInt('000000008000808b', 16), bigInt('800000000000008b', 16), bigInt('8000000000008089', 16), bigInt('8000000000008003', 16),
  bigInt('8000000000008002', 16), bigInt('8000000000000080', 16), bigInt('000000000000800a', 16), bigInt('800000008000000a', 16),
  bigInt('8000000080008081', 16), bigInt('8000000000008080', 16), bigInt('0000000080000001', 16), bigInt('8000000080008008', 16)
];

function keccak_f(state) {
  for (let round = 0; round < 24; round++) {
    state = round_b(state, ROUND_CONSTANTS[round]);
  }
  return state;
}

function round_b(A, RC) {
  // θ step
  let C = new Array(5).fill(bigInt(0));
  let D = new Array(5).fill(bigInt(0));

  for (let x = 0; x < 5; x++) {
    C[x] = A[x][0].xor(A[x][1]).xor(A[x][2]).xor(A[x][3]).xor(A[x][4]);
  }

  for (let x = 0; x < 5; x++) {
    D[x] = C[(x + 4) % 5].xor(rotateLeft(C[(x + 1) % 5], 1));
  }

  for (let x = 0; x < 5; x++) {
    for (let y = 0; y < 5; y++) {
      A[x][y] = A[x][y].xor(D[x]);
    }
  }

  // ρ and π steps
  let B = Array.from(Array(5), () => new Array(5).fill(bigInt(0)));
  for (let x = 0; x < 5; x++) {
    for (let y = 0; y < 5; y++) {
      B[y][(2 * x + 3 * y) % 5] = rotateLeft(A[x][y], RHO_OFFSETS[x][y]);
    }
  }

  // χ step
  for (let x = 0; x < 5; x++) {
    for (let y = 0; y < 5; y++) {
      A[x][y] = B[x][y].xor((B[(x + 1) % 5][y].not()).and(B[(x + 2) % 5][y]));
    }
  }

  // ι step
  A[0][0] = A[0][0].xor(RC);

  return A;
}

function rotateLeft(x, n) {
  return x.shiftLeft(n).or(x.shiftRight(64-n)).and(bigInt('FFFFFFFFFFFFFFFF', 16));
}

function keccak(message, r, c, outputLength) {
  const b = r + c;
  const w = b / 25;
  let P = padding(message, r);

  let S = Array.from(Array(5), () => new Array(5).fill(bigInt(0)));

  for (let i = 0; i < P.length / (r / 8); i++) {
    let Pi = P.slice(i * (r / 8), (i + 1) * (r / 8));
    for (let j = 0; j < r / w; j++) {
      let block = Pi.slice(j * (w / 8), (j + 1) * (w / 8));
      let value = bigInt(0);
      for (let k = 0; k < block.length; k++) {
        value = value.or(bigInt(block[k]).shiftLeft(8 * k));
      }
      S[j % 5][Math.floor(j / 5)] = S[j % 5][Math.floor(j / 5)].xor(value);
    }
    S = keccak_f(S);
  }

  let Z = [];
  while (Z.length * 8 < outputLength) {
    for (let j = 0; j < r / w; j++) {
      let value = S[j % 5][Math.floor(j / 5)];
      for (let k = 0; k < w / 8; k++) {
        Z.push(Number(value.shiftRight(8 * k).and(0xFF)));
      }
    }
    if (Z.length * 8 >= outputLength) break;
    S = keccak_f(S);
  }

  return Z.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function padding(M, r) {
  let d = 0x01;
  M.push(d);
  while (M.length % (r / 8) !== (r / 8) - 1) {
    M.push(0x00);
  }
  M.push(0x80);
  return M;
}

function stringToByteArray(str) {
  let byteArray = [];
  for (let i = 0; i < str.length; i++) {
    byteArray.push(str.charCodeAt(i));
  }
  return byteArray;
}

function keccakHashFromString(input, outputLength = 256) {
  let byteArrayMessage = stringToByteArray(input);
  return bigInt(keccakHash(byteArrayMessage, outputLength), 16);
}

function keccakHash(message, outputLength = 256) {
  const r = 1088;
  const c = 512;
  return keccak(message, r, c, outputLength);
}



module.exports = {
  keccakHashFromString
}