export function convertCipherToString(cipher) {
    let result = [];

    cipher.forEach(pairArray => {
        pairArray.forEach(pair => {
            pair.forEach(number => {
                result.push(number.toString());
            });
        });
    });

    return result.join(',');
}

export function convertStringToCipher(str) {
    // Split the string into an array of BigInt numbers
    const numbers = str.split(',').map(num => BigInt(num));

    // The result array
    const cipher = [];

    // Iterate over the numbers array in steps of 4 to form pairs of pairs
    for (let i = 0; i < numbers.length; i += 4) {
        if (i + 3 < numbers.length) {
            const pair1 = [numbers[i], numbers[i + 1]];
            const pair2 = [numbers[i + 2], numbers[i + 3]];
            cipher.push([pair1, pair2]);
        }
    }

    return cipher;
}