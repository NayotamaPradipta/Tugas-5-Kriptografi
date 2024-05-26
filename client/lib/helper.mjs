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

    // Iterate over the numbers array in steps of 2 to form pairs
    for (let i = 0; i < numbers.length; i += 2) {
        if (i + 1 < numbers.length) {
            const pair = [numbers[i], numbers[i + 1]];
            cipher.push([pair]);
        }
    }

    return cipher;
}