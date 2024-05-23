// Function to check if the number is prime
function isPrime(num) {
    if (num <= 1) return false;
    if (num <= 3) return true;
    
    if (num % 2 === 0 || num % 3 === 0) return false;
    
    for (let i = 5; i * i <= num; i += 6) {
        if (num % i === 0 || num % (i + 2) === 0) return false;
    }
    
    return true;
}

// Function to generate prime numbers congruent to 3 mod 4
function generatePrime() {
    let prime;
    do {
        prime = Math.floor(Math.random() * 1000) + 3; // Upper limit is customizable, capped at 1000 so it doesn't get too long
    } while (!isPrime(prime) || prime % 4 !== 3);
    return prime;
}

// Function to calculate greatest common divisor
function gcd(a, b) {
    while (b !== 0) {
        [a, b] = [b, a % b];
    }
    return a;
}

// Function to generate a seed that is relatively prime to n
function generateSeed(n) {
    let seed;
    do {
        seed = Math.floor(Math.random() * (n - 2)) + 2;
    } while (gcd(seed, n) !== 1);
    return seed;
}

// Function to generate random numbers using BBS
function BBS(bits) {
    const p = generatePrime();
    const q = generatePrime();

    const n = p * q;

    const s = generateSeed(n);

    let x = (s * s) % n;

    let randomBits = [];

    for (let i = 0; i < bits; i++) {
        x = (x * x) % n;

        const zi = x % 2;

        randomBits.push(zi);
    }

    return randomBits.join('');
}