import { keccak256, toHex, stringToHex } from 'viem';

try {
    console.log('toHex string:', toHex('hello'));
} catch (e) {
    console.log('toHex string error:', e.message);
}

try {
    console.log('stringToHex:', stringToHex('hello'));
} catch (e) {
    console.log('stringToHex error:', e.message);
}
