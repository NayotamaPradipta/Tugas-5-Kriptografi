// Modular inverse untuk k * k^-1 ≡ 1 (mod p)
export function modInverse(k, p) {
  if (k === 0n) throw new Error('error pembagian dengan 0');
  // kasus k bernilai negatif
  if (k < 0n) {
    return p - modInverse(-k, p);
  }
  // Menggunakan extended euclidean algorithm
  let [s, prev_s] = [0n, 1n];
  let [t, prev_t] = [1n, 0n];
  let [r, prev_r] = [p, k]; // sisa
  // Iterasi sampai sisa habis
  while (r !== 0n) {
    const quotient = prev_r / r;
    [prev_r, r] = [r, prev_r - quotient*r];
    [prev_s, s] = [s, prev_s - quotient*s];
    [prev_t, t] = [t, prev_t - quotient*t];
  }
  return (prev_s + p) % p;
}

// Penjumlahan 2 point di elliptic curve pada GF(p)
export function pointAddition(P, Q, p, a) {
  // Kasus penjumlahan dengan point at infinity [null, null]
  if (P[0] === null) return Q; 
  if (Q[0] === null) return P;
  const [x1, y1] = P;
  const [x2, y2] = Q;
  // Kasus jika Q == P' atau P == Q' (elemen invers)
  if (x1 === x2 && y1 === (p - y2) % p) return [null, null]; 
  const m = (x1 === x2 && y1 === y2)
    // Jika P == Q
    ? (3n * x1*x1 + a) * modInverse(2n * y1, p) % p
    // Jika P !== Q
    : (y2 - y1) * modInverse(x2 - x1, p) % p;
  const x3 = (m * m - x1 - x2) % p;
  const y3 = (m * (x1 - x3) - y1) % p;
  return [x3 < 0 ? x3 + p : x3, y3 < 0 ? y3 + p : y3];
}

// Perkalian poin P di elliptic curve pada GF(p) dengan skalar k
export function scalarMultiplication(k, P, p, a) {
  let R = [null, null];
  let Q = P;
  while (k > 0n) {
    if (k % 2n === 1n) R = pointAddition(R, Q, p, a);
    Q = pointAddition(Q, Q, p, a);
    k >>= 1n;
  }
  return R;
}
