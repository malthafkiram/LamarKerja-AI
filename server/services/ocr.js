import { createWorker } from 'tesseract.js';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * Extract text from an image or PDF flyer
 * @param {string} filePath - absolute path to file
 * @param {string} mimeType - mime type of file
 * @returns {Promise<string>} extracted raw text
 */
export async function extractTextFromFile(filePath, mimeType = '') {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File tidak ditemukan: ${filePath}`);
  }

  // Handle PDF directly
  if (mimeType.includes('pdf') || filePath.toLowerCase().endsWith('.pdf')) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      if (pdfData.text && pdfData.text.trim().length > 20) {
        return pdfData.text.trim();
      }
    } catch (err) {
      console.warn('PDF parsing had an issue, falling back:', err.message);
    }
  }

  // Handle Image with Tesseract OCR (Supports Indonesian & English)
  try {
    const worker = await createWorker(['ind', 'eng']);
    const ret = await worker.recognize(filePath);
    await worker.terminate();
    
    return ret.data.text ? ret.data.text.trim() : '';
  } catch (error) {
    console.error('Tesseract OCR error:', error);
    // If OCR fails or language files take time, attempt English default
    try {
      const fallbackWorker = await createWorker('eng');
      const fallbackRet = await fallbackWorker.recognize(filePath);
      await fallbackWorker.terminate();
      return fallbackRet.data.text ? fallbackRet.data.text.trim() : '';
    } catch (fallbackError) {
      throw new Error(`Gagal membaca gambar brosur dengan OCR: ${fallbackError.message}`);
    }
  }
}
