import {PREVIEW_MAX_BYTES, PREVIEW_MAX_SIZE} from "@/utils/utils.js"

export function loadImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = e => {
            const img = new Image()
            img.onload = () => resolve(img)
            img.onerror = reject
            img.src = e.target.result
        }
        reader.readAsDataURL(file)
    })
}

export function resizeAndCompress(image, maxWidth, maxHeight, quality) {
    return new Promise(resolve => {
        const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1)
        const width = Math.round(image.width * ratio)
        const height = Math.round(image.height * ratio)

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(image, 0, 0, width, height)
        resolve(canvas.toDataURL('image/webp', quality))
    })
}

export function imageFileToThumbnail(file) {
    return new Promise(async (resolve) => {
        const image = await loadImage(file)
        let quality = 1
        let base64
        do {
            base64 = await resizeAndCompress(image, PREVIEW_MAX_SIZE, PREVIEW_MAX_SIZE, quality)
            quality -= 0.05
        } while (base64.length > PREVIEW_MAX_BYTES && quality > 0.1)
        resolve(base64)
    })
}