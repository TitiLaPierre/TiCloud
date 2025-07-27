const URL = window.location.protocol + "//" + window.location.host

function hexToArrayBuffer(hex) {
    const typedArray = new Uint8Array(hex.length / 2)
    for (let i = 0; i < typedArray.length; i++) {
        typedArray[i] = parseInt(hex.substring(i*2, i*2 + 2), 16)
    }
    return typedArray.buffer
}

function bufferToHex(buffer) {
    return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('')
}

function incrementIV(iv) {
    for (let i = iv.length - 1; i >= 0; i--) {
        if (iv[i] < 255) {
            iv[i]++;
            break;
        } else {
            iv[i] = 0;
        }
    }
}