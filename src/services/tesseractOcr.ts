/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createWorker } from 'tesseract.js';
import { parseLabelText } from './labelParser.ts';
import { LabelExtractionResult } from '../types/index.ts';

export interface OcrProgress {
  status: string;
  progress: number;
}

/**
 * Pre-processes an image file on an in-memory Canvas to improve OCR readability:
 * - Resizes if excessively large
 * - Converts to high-contrast grayscale
 */
async function preprocessImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Keep dimensions reasonable for OCR speed and accuracy
        const maxDim = 1800;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        // Grayscale & contrast enhancement
        try {
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;
          // Simple contrast stretch
          for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            // Increase contrast
            const contrastFactor = 1.25;
            const enhanced = Math.min(255, Math.max(0, (gray - 128) * contrastFactor + 128));
            data[i] = enhanced;
            data[i + 1] = enhanced;
            data[i + 2] = enhanced;
          }
          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch {
          // If canvas read fails (e.g. cross-origin), fallback to original
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image for processing.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Runs browser-side Tesseract.js OCR on an uploaded food package label image.
 * Validates image type and size, preprocesses on Canvas, and returns parsed fields.
 */
export async function performBrowserOcr(
  file: File,
  onProgress?: (progress: OcrProgress) => void
): Promise<LabelExtractionResult> {
  // 1. Validation
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Unsupported image format. Please upload a JPG, PNG, or WEBP image.');
  }

  const maxSizeMb = 12;
  if (file.size > maxSizeMb * 1024 * 1024) {
    throw new Error(`File is too large (${Math.round(file.size / (1024 * 1024))}MB). Maximum allowed size is ${maxSizeMb}MB.`);
  }

  onProgress?.({ status: 'Enhancing label contrast...', progress: 0.15 });

  const preprocessedDataUrl = await preprocessImage(file);

  onProgress?.({ status: 'Initializing Tesseract OCR worker...', progress: 0.3 });

  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        const p = 0.3 + (m.progress || 0) * 0.65;
        onProgress?.({ status: `Scanning label text (${Math.round((m.progress || 0) * 100)}%)...`, progress: p });
      }
    }
  });

  try {
    const { data } = await worker.recognize(preprocessedDataUrl);
    await worker.terminate();

    onProgress?.({ status: 'Structuring findings and validating sources...', progress: 1.0 });

    const confidence = data.confidence || 70;
    const parsed = parseLabelText(data.text, confidence);

    return parsed;
  } catch (err) {
    await worker.terminate().catch(() => {});
    throw new Error(`OCR processing failed: ${err instanceof Error ? err.message : 'Unknown OCR error'}`);
  }
}
