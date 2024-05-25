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
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
  0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
  0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
  0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
  0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n
];

function keccak_f(state) {
  for (let round = 0; round < 24; round++) {
    state = round_b(state, ROUND_CONSTANTS[round]);
  }
  return state;
}

function round_b(A, RC) {
  // θ step
  let C = new Array(5).fill(0n);
  let D = new Array(5).fill(0n);

  for (let x = 0; x < 5; x++) {
    C[x] = A[x][0] ^ A[x][1] ^ A[x][2] ^ A[x][3] ^ A[x][4];
  }

  for (let x = 0; x < 5; x++) {
    D[x] = C[(x + 4) % 5] ^ rotateLeft(C[(x + 1) % 5], 1);
  }

  for (let x = 0; x < 5; x++) {
    for (let y = 0; y < 5; y++) {
      A[x][y] ^= D[x];
    }
  }

  // ρ and π steps
  let B = Array.from(Array(5), () => new Array(5).fill(0n));
  for (let x = 0; x < 5; x++) {
    for (let y = 0; y < 5; y++) {
      B[y][(2 * x + 3 * y) % 5] = rotateLeft(A[x][y], RHO_OFFSETS[x][y]);
    }
  }

  // χ step
  for (let x = 0; x < 5; x++) {
    for (let y = 0; y < 5; y++) {
      A[x][y] = B[x][y] ^ ((~B[(x + 1) % 5][y]) & B[(x + 2) % 5][y]);
    }
  }

  // ι step
  A[0][0] ^= RC;

  return A;
}

function rotateLeft(x, n) {
  return (x << BigInt(n)) | (x >> BigInt(64 - n));
}

function keccak(message, r, c, outputLength) {
  const b = r + c;
  const w = b / 25;
  let P = padding(message, r);

  let S = Array.from(Array(5), () => new Array(5).fill(0n));

  for (let i = 0; i < P.length / (r / 8); i++) {
    let Pi = P.slice(i * (r / 8), (i + 1) * (r / 8));
    for (let j = 0; j < r / w; j++) {
      let block = Pi.slice(j * (w / 8), (j + 1) * (w / 8));
      let value = 0n;
      for (let k = 0; k < block.length; k++) {
        value |= BigInt(block[k]) << BigInt(8 * k);
      }
      S[j % 5][Math.floor(j / 5)] ^= value;
    }
    S = keccak_f(S);
  }

  let Z = [];
  while (Z.length * 8 < outputLength) {
    for (let j = 0; j < r / w; j++) {
      let value = S[j % 5][Math.floor(j / 5)];
      for (let k = 0; k < w / 8; k++) {
        Z.push(Number((value >> BigInt(8 * k)) & 0xFFn));
      }
    }
    if (Z.length * 8 >= outputLength) break;
    S = keccak_f(S);
  }

  return Z.slice(0, outputLength / 8);
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
  return keccakHash(byteArrayMessage, outputLength);
}

function keccakHash(message, outputLength = 256) {
  const r = 1088;
  const c = 512;
  return keccak(message, r, c, outputLength);
}

// example
let message = "Heallo, world!";
let hash = keccakHashFromString(message, 256); 
console.log(hash.map(b => b.toString(16).padStart(2, '0')).join('')); 
