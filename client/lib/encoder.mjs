// Parameter dari Kurva secp192r1 (P-192)
const p  = BigInt('0xfffffffffffffffffffffffffffffffeffffffffffffffff');
const a  = BigInt('0xfffffffffffffffffffffffffffffffefffffffffffffffc');
const b  = BigInt('0x64210519e59c80e70fa7e9ab72243049feb8deecc146b9b1');
// Point Generator
const Gx = BigInt('0x188da80eb03090f67cbf20eb43a18800f4ff0afd82ff1012');
const Gy = BigInt('0x07192b95ffc8da78631011ed6b24cdd573f977a11e794811');
// Orde dari Generator (192 bit)
const n  = BigInt('0xffffffffffffffffffffffff99def836146bc9b1b4d22831');

// Perhitungan mod
function mod(n, m) {
    return ((n % m) + m) % m;
}

// Cek apakah point berada di kurva
function isOnCurve(x, y) {
    // Check if y^2 ≡ x^3 + ax + b (mod p)
    return mod(y * y, p) === mod(x * x * x + a * x + b, p);
}

// Menghitung perpankatan modulo -> (basis^exp) % mod
function modPow(basis, exp, mod) {
    let result = 1n;
    basis = basis % mod;
    while (exp > 0n) {
        if (exp % 2n === 1n) {
            result = (result * basis) % mod;
        }
        exp = exp >> 1n;
        basis = (basis*basis) % mod;
    }
    return result;
}

// Menghitung (a/p)
function ap(a, p) {
    const ls = modPow(a, (p - 1n) / 2n, p);
    return ls === p - 1n ? -1n : ls;
}

// Menghitung akar kuadrat modulo
function modularSqrt(a, p) {
    // Kasus khusus
    if (a === 0n) return 0n;
    if (p === 2n) return a; 
    if (ap(a, p) !== 1n) return 0n;

    let s = p - 1n;
    let e = 0n;
    while (s % 2n === 0n) {
        s /= 2n;
        e += 1n;
    }
    let n = 2n;
    while (ap(n, p) !== -1n) {
        n += 1n;
    }

    let x = modPow(a, (s + 1n) / 2n, p);
    let b = modPow(a, s, p);
    let g = modPow(n, s, p);
    let r = e;
    while (true) {
        let t = b;
        let m = 0n;
        for (m = 0n; m < r; m++) {
            if (t === 1n) break;
            t = modPow(t, 2n, p);
        }
        if (m === 0n) return x;
        const gs = modPow(g, 2n ** (r - m - 1n), p);
        g = mod(gs * gs, p);
        x = mod(x * gs, p);
        b = mod(b * g, p);
        r = m;
    }
}

// Membuat daftar points untuk encoding-decoding
export function computePoints() {
    const points = [];
    // Melakukan iterasi points apa saja yang ada di kurva
    for (let x = 1n; x < p; x++) {
        // Sisi kanan persamaan
        const right = mod(x * x * x + a * x + b, p); 
        if (ap(right, p) === 1n) {
            // Sisi kiri persamaan
            const y = modularSqrt(right, p);
            // Masukan points ke array
            if (y !== 0n && isOnCurve(x, y)) {
                points.push([x, y]);
                const negY = mod(-y, p);
                points.push([x, negY]);
            }
        }
        // Points untuk ASCII
        if (points.length >= 128) break;
    }
    return points;
}
