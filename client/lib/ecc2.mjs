import bigInt from "big-integer";
// Modular inverse untuk k * k^-1 ≡ 1 (mod p)
export function modInverse(k, p) {
  if (k.isZero()) throw new Error('error pembagian dengan 0');
  // kasus k bernilai negatif
  if (k.isNegative()) {
    return p.minus(modInverse(k.negate(), p));
  }
  // Menggunakan extended euclidean algorithm
  let [s, prev_s] = [bigInt(0), bigInt(1)];
  let [t, prev_t] = [bigInt(1), bigInt(0)];
  let [r, prev_r] = [p, k]; // sisa
  // Iterasi sampai sisa habis
  while (!r.isZero()) {
    const quotient = prev_r.divide(r);
    [prev_r, r] = [r, prev_r.minus(quotient.multiply(r))];
    [prev_s, s] = [s, prev_s.minus(quotient.multiply(s))];
    [prev_t, t] = [t, prev_t.minus(quotient.multiply(t))];
  }
  return prev_s.add(p).mod(p);
}

// Penjumlahan 2 point di elliptic curve pada GF(p)
export function pointAddition(P, Q, p, a) {
  // Kasus penjumlahan dengan point at infinity [null, null]
  if (P[0] === null) return Q; 
  if (Q[0] === null) return P;
  const x1 = bigInt(P[0]), y1 = bigInt(P[1]);
  const x2 = bigInt(Q[0]), y2 = bigInt(Q[1]);
  // Kasus jika Q == P' atau P == Q' (elemen invers)
  if (x1.equals(x2) && y1.equals((p.minus(y2)).mod(p))) return [null, null]; 
  const m = (x1.equals(x2) && y1.equals(y2))
    // Jika P == Q
    ? (x1.square().multiply(3).add(a)).multiply(modInverse(y1.multiply(2), p)).mod(p)
    // Jika P !== Q
    : (y2.minus(y1)).multiply(modInverse(x2.minus(x1), p)).mod(p);
  const x3 = m.square().minus(x1).minus(x2).mod(p);
  const y3 = m.multiply(x1.minus(x3)).minus(y1).mod(p);
  return [x3 < 0 ? (x3.add(p)).toString() : x3.toString(), y3 < 0 ? (y3.add(p)).toString() : y3.toString()];
}

// Perkalian poin P di elliptic curve pada GF(p) dengan skalar k
export function scalarMultiplication(k, P, p, a) {
  k = bigInt(k);
  let R = [null, null];
  let Q = P;
  while (k.isPositive()) {
    if (k.mod(2).equals(1)) R = pointAddition(R, Q, p, a);
    Q = pointAddition(Q, Q, p, a);
    k = k.shiftRight(1);
  }
  return R;
}
