export class ImageProcessor {
    constructor() {
        this.canvas = document.createElement('canvas'); // Offscreen canvas
        this.ctx = this.canvas.getContext('2d');
    }

    async loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    process(image, pixelSize = 4) {
        // Target characteristics
        const pixelWidth = 300;   // The "look" resolution (chunky pixels)
        const finalWidth = 580;  // The physical canvas size (high res output)

        // 1. Process at low resolution
        const scale = pixelWidth / image.width;
        const sh = Math.floor(image.height * scale);
        const sw = pixelWidth;

        this.canvas.width = sw;
        this.canvas.height = sh;

        // Draw small
        this.ctx.drawImage(image, 0, 0, sw, sh);

        // Get data
        const imageData = this.ctx.getImageData(0, 0, sw, sh);
        const data = imageData.data;

        // Step 2: Grayscale & Posterize (Game Boy style)
        const levels = 4; // 4 shades of smooth gray
        const step = 255 / (levels - 1);

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Grayscale
            const avg = (0.299 * r + 0.587 * g + 0.114 * b);

            // Posterize grayscale
            const gray = Math.floor(avg / step) * step;

            data[i] = gray;     // R
            data[i + 1] = gray; // G
            data[i + 2] = gray; // B
            // A stays distinct
        }

        this.ctx.putImageData(imageData, 0, 0);

        // 3. Upscale to Final Target Size
        const outputCanvas = document.createElement('canvas');
        const finalScale = finalWidth / sw;
        const finalHeight = Math.floor(sh * finalScale);

        outputCanvas.width = finalWidth;
        outputCanvas.height = finalHeight;

        const outCtx = outputCanvas.getContext('2d');
        outCtx.imageSmoothingEnabled = false; // Key for pixelated look

        // Draw the processed small canvas onto large canvas
        outCtx.drawImage(this.canvas, 0, 0, finalWidth, finalHeight);

        return outputCanvas;
    }

    processToAscii(image, width = 60) {
        const ratio = image.height / image.width;
        // Fonts are usually 2x tall, so we correct by multiplying height by 0.5 roughly, 
        // OR we just assume the 'width' chars will result in a certain height.
        // Let's use 0.55 height correction for standard terminal fonts to correct for line-height vs char-width.
        const height = Math.floor(width * ratio * 0.55);

        this.canvas.width = width;
        this.canvas.height = height;

        this.ctx.drawImage(image, 0, 0, width, height);
        const imageData = this.ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Densities
        const chars = [" ", ".", ":", "-", "=", "+", "*", "#", "%", "@"];

        let output = "";

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const offset = (y * width + x) * 4;
                const r = data[offset];
                const g = data[offset + 1];
                const b = data[offset + 2];
                // const a = data[offset + 3];

                const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
                const charIndex = Math.floor((brightness / 255) * (chars.length - 1));
                output += chars[charIndex];
            }
            output += "\n";
        }

        return output;
    }
}
