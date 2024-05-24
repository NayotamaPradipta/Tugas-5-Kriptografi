const bigInt = require("big-integer");

// Function to generate prime numbers congruent to 3 mod 4
function generatePrime() {
    let prime;
    do {
        prime = bigInt(Math.floor(Math.random() * 1000) + 3);
    } while (!prime.isPrime() || !prime.mod(4).equals(3));
    return prime;
}

// Function to calculate greatest common divisor
function gcd(a, b) {
    while (!b.equals(0)) {
        [a, b] = [b, a.mod(b)];
    }
    return a;
}

// Function to generate a seed that is relatively prime to n
function generateSeed(n) {
    let seed;
    do {
        seed = bigInt(Math.floor(Math.random() * (n.minus(2).toJSNumber())) + 2);
    } while (!gcd(seed, n).equals(1));
    return seed;
}

// Find next prime closest to num (larger)
function findNextPrime(num){
    let prime = bigInt(num);
    if (prime.mod(2).equals(0)) {
        prime = prime.add(1);
    }
    while (!prime.isPrime()) {
        prime = prime.add(2);
    }
    return prime;
}

/**
 * 
 * @param {*} bits - Amount of bits
 * @param { Boolean } prime_flag - If true returns prime, else returns random number
 * @returns { bigInt } random_number - Cryptographically secure random number  
 */
function BBS(bits, prime_flag) {
    const p = generatePrime();
    const q = generatePrime();
    const n = p.multiply(q);
    const s = generateSeed(n);
    let x = s.multiply(s).mod(n);

    function generate_random_bits(bits) {
        let randomBits = [];

        for (let i = 0; i < bits; i++) {
            x = x.multiply(x).mod(n);
            const zi = x.mod(2);
            randomBits.push(zi);
        }
        return randomBits;
    }

    let random_bits = generate_random_bits(bits);
    let random_number = bigInt(parseInt(random_bits.join(''), 2));
    if (prime_flag && !random_number.isPrime()) {
        random_number = findNextPrime(random_number);
    } 
    return bigInt(random_number);
}

module.exports = {
    BBS
}
