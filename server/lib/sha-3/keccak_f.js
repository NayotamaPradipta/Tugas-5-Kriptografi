function rot(value, shift) {
  return (value << shift) | (value >>> (32 - shift));
}

function round(A, RC) {
  let C = new Array(5);
  let D = new Array(5);

  // θ step
  for (let x = 0; x < 5; x++) {
    C[x] = A[x][0] ^ A[x][1] ^ A[x][2] ^ A[x][3] ^ A[x][4];
  }
  for (let x = 0; x < 5; x++) {
    D[x] = C[(x - 1 + 5) % 5] ^ rot(C[(x + 1) % 5], 1);
  }
  for (let x = 0; x < 5; x++) {
    for (let y = 0; y < 5; y++) {
      A[x][y] ^= D[x];
    }
  }

  // ρ and π steps
  let B = Array.from(Array(5), () => new Array(5));
  for (let x = 0; x < 5; x++) {
    for (let y = 0; y < 5; y++) {
      B[y][(2 * x + 3 * y) % 5] = rot(A[x][y], r[x][y]);
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

function keccak_f(b, A) {
  const n = 12 + 2 * Math.log2(b / 25);
  const RC = [/* constants */];

  for (let i = 0; i < n; i++) {
    A = round(A, RC[i]);
  }

  return A;
}

module.exports = keccak_f;
