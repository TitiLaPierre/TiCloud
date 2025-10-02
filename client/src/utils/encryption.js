import {AUTH_TAG_LENGTH} from "@/utils/utils.js"

export function hexToArrayBuffer(hex) {
    const typedArray = new Uint8Array(hex.length / 2)
    for (let i = 0; i < typedArray.length; i++) {
        typedArray[i] = parseInt(hex.substring(i*2, i*2 + 2), 16)
    }
    return typedArray.buffer
}

export function bufferToHex(buffer) {
    return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('')
}

export function hexToUint8Array(hex) {
    return new Uint8Array(hex.length / 2).map((_, i) => parseInt(hex.substring(i * 2, (i+1) * 2), 16))
}

export function uint8ArrayToHex(uint8Array) {
    return [...uint8Array].map(b => b.toString(16).padStart(2, "0")).join("")
}

export class Data {
    constructor() {
        this.uint8array = null
        this._buffer = null
        this._hex = null
    }

    static from(data) {
        const instance = new this()
        if (typeof data === "string") {
            instance.uint8array = hexToUint8Array(data)
            instance._hex = data
        } else if (data instanceof ArrayBuffer) {
            instance.uint8array = new Uint8Array(data)
            instance._buffer = data
        } else if (data instanceof Uint8Array) {
            instance.uint8array = data
        } else {
            throw new Error("Invalid data type")
        }
        return instance
    }

    get buffer() {
        if (!this._buffer && this.uint8array) {
            this._buffer = this.uint8array.buffer
        }
        return this._buffer
    }

    get hex() {
        if (!this._hex && this.uint8array) {
            this._hex = uint8ArrayToHex(this.uint8array)
        }
        return this._hex
    }
}

export class IV extends Data {
    constructor() {
        super()
        if (this.uint8array === null) {
            this.uint8array = crypto.getRandomValues(new Uint8Array(12))
        }
    }

    static from(data) {
        return super.from(data)
    }

    increment() {
        this._buffer = null
        this._hex = null
        for (let i = this.uint8array.length - 1; i >= 0; i--) {
            if (this.uint8array[i] < 255) {
                this.uint8array[i]++
                break
            } else {
                this.uint8array[i] = 0
            }
        }
    }
}

export class EncryptionKey extends Data {
    constructor() {
        super()
        this.cryptoKey = null
    }

    static async from(data) {
        const instance = super.from(data)
        instance.cryptoKey = await crypto.subtle.importKey(
            "raw",
            instance.uint8array,
            { name: "AES-GCM" },
            false,
            ["encrypt", "decrypt"]
        )
        return instance
    }

    async encrypt(data, iv=null) {
        if (!this.cryptoKey) {
            throw new Error("Key not initialized")
        }

        if (typeof data === "string") {
            data = new TextEncoder().encode(data)
        } else if (data instanceof ArrayBuffer) {
            data = new Uint8Array(data)
        } else if (!(data instanceof Uint8Array)) {
            throw new Error("Invalid data type")
        }

        if (iv === null) {
            iv = new IV()
        } else if (!(iv instanceof IV)) {
            iv = IV.from(iv)
        }

        const encrypted_buffer = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv.uint8array,
                tagLength: AUTH_TAG_LENGTH*8,
            },
            this.cryptoKey,
            data
        )

        const encrypted_uint8Array = new Uint8Array(encrypted_buffer)
        const encrypted_hex = uint8ArrayToHex(encrypted_uint8Array)

        return { iv, buffer: encrypted_buffer, uint8array: encrypted_uint8Array, hex: encrypted_hex }
    }

    async decryptAsBuffer(data, iv) {
        if (!this.cryptoKey) {
            throw new Error("Key not initialized")
        }

        if (typeof data === "string") {
            data = hexToUint8Array(data)
        } else if (data instanceof ArrayBuffer) {
            data = new Uint8Array(data)
        } else if (!(data instanceof Uint8Array)) {
            throw new Error("Invalid data type")
        }

        if (!(iv instanceof IV)) {
            iv = IV.from(iv)
        }

        return await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv.uint8array,
                tagLength: AUTH_TAG_LENGTH*8,
            },
            this.cryptoKey,
            data
        )
    }

    async decryptAsHex(data, iv) {
        const decrypted = await this.decryptAsBuffer(data, iv)
        return uint8ArrayToHex(new Uint8Array(decrypted))
    }

    async decryptAsText(data, iv) {
        const decrypted = await this.decryptAsBuffer(data, iv)
        return new TextDecoder().decode(decrypted)
    }

    async decryptAsUint8Array(data, iv) {
        const decrypted = await this.decryptAsBuffer(data, iv)
        return new Uint8Array(decrypted)
    }
}

export async function deriveMasterKey(password, saltHex) {
    const salt = hexToArrayBuffer(saltHex)
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
    )
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt,
            iterations: 100_000,
            hash: "SHA-256"
        },
        keyMaterial,
        32 * 8 // 32 bytes = 256 bits
    )
    return new Uint8Array(derivedBits)
}

export async function hashMasterKey(masterKeyBytes) {
    const digest = await crypto.subtle.digest("SHA-256", masterKeyBytes)
    return bufferToHex(new Uint8Array(digest))
}

export function incrementIV(iv) {
    iv._buffer = null
    iv._hex = null
    for (let i = iv.uint8array.length - 1; i >= 0; i--) {
        if (iv.uint8array[i] < 255) {
            iv.uint8array[i]++
            break
        } else {
            iv.uint8array[i] = 0
        }
    }
}