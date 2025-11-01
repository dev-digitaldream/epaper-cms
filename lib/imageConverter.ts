import sharp from 'sharp'

/**
 * Convert image buffer to 1-bit BMP format for e-paper display
 * Uses Floyd-Steinberg dithering for better quality
 */
export async function convertToBMP(
  imageBuffer: Buffer,
  width: number,
  height: number
): Promise<Buffer> {
  // Resize and convert to grayscale
  const processed = await sharp(imageBuffer)
    .resize(width, height, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { data, info } = processed

  // Floyd-Steinberg dithering
  const dithered = floydSteinbergDithering(data, info.width, info.height)

  // Create 1-bit BMP
  return createBMP(dithered, info.width, info.height)
}

/**
 * Floyd-Steinberg dithering algorithm
 */
function floydSteinbergDithering(pixels: Buffer, width: number, height: number): Buffer {
  const output = Buffer.from(pixels)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      const oldPixel = output[idx]
      const newPixel = oldPixel < 128 ? 0 : 255
      output[idx] = newPixel

      const error = oldPixel - newPixel

      // Distribute error to neighboring pixels
      if (x + 1 < width) output[idx + 1] += (error * 7) / 16
      if (y + 1 < height) {
        if (x > 0) output[idx + width - 1] += (error * 3) / 16
        output[idx + width] += (error * 5) / 16
        if (x + 1 < width) output[idx + width + 1] += (error * 1) / 16
      }
    }
  }

  return output
}

/**
 * Create BMP file buffer from 1-bit pixel data
 */
function createBMP(pixels: Buffer, width: number, height: number): Buffer {
  const rowSize = Math.ceil(width / 8)
  const rowPadding = (4 - (rowSize % 4)) % 4
  const paddedRowSize = rowSize + rowPadding
  const pixelDataSize = paddedRowSize * height

  const fileSize = 62 + pixelDataSize // Header (14) + DIB header (40) + Color table (8) + Pixel data
  const buffer = Buffer.alloc(fileSize)

  // BMP Header
  buffer.write('BM', 0) // Signature
  buffer.writeUInt32LE(fileSize, 2) // File size
  buffer.writeUInt32LE(62, 10) // Pixel data offset

  // DIB Header (BITMAPINFOHEADER)
  buffer.writeUInt32LE(40, 14) // DIB header size
  buffer.writeInt32LE(width, 18) // Width
  buffer.writeInt32LE(-height, 22) // Height (negative = top-down)
  buffer.writeUInt16LE(1, 26) // Planes
  buffer.writeUInt16LE(1, 28) // Bits per pixel
  buffer.writeUInt32LE(0, 30) // Compression (none)
  buffer.writeUInt32LE(pixelDataSize, 34) // Image size
  buffer.writeInt32LE(2835, 38) // X pixels per meter
  buffer.writeInt32LE(2835, 42) // Y pixels per meter
  buffer.writeUInt32LE(2, 46) // Colors in palette
  buffer.writeUInt32LE(2, 50) // Important colors

  // Color palette (black and white)
  buffer.writeUInt32LE(0x00000000, 54) // Black
  buffer.writeUInt32LE(0x00ffffff, 58) // White

  // Pixel data
  let bufferOffset = 62
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x += 8) {
      let byte = 0
      for (let bit = 0; bit < 8 && x + bit < width; bit++) {
        const pixelIdx = y * width + x + bit
        if (pixels[pixelIdx] === 0) {
          byte |= 1 << (7 - bit) // Black pixel
        }
      }
      buffer[bufferOffset++] = byte
    }
    // Add row padding
    bufferOffset += rowPadding
  }

  return buffer
}

/**
 * Convert BMP buffer to base64 string
 */
export function bmpToBase64(bmpBuffer: Buffer): string {
  return bmpBuffer.toString('base64')
}

/**
 * Generate a preview PNG from the BMP data
 */
export async function generatePreviewPNG(bmpBuffer: Buffer): Promise<Buffer> {
  return sharp(bmpBuffer).png().toBuffer()
}
