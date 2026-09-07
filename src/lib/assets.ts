'use client';

import type { ImageAsset } from './types';

/** Formats pdf-lib can embed directly; anything else is transcoded to PNG. */
const NATIVE_TYPES = new Set(['image/png', 'image/jpeg']);

export const ACCEPTED_IMAGE_TYPES =
  'image/png,image/jpeg,image/webp,image/gif,image/bmp,image/avif';

async function decode(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    // The element keeps its decoded bitmap after the URL is revoked.
    URL.revokeObjectURL(url);
  }
}

function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not convert the image.'));
        return;
      }
      blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)), reject);
    }, 'image/png');
  });
}

/**
 * Turns a user-supplied image file into bytes pdf-lib can embed.
 *
 * PNG and JPEG are passed through untouched so no quality is lost; WebP, GIF
 * and friends are re-encoded as PNG, since PDF has no native support for them.
 */
export async function createImageAsset(file: File | Blob): Promise<ImageAsset> {
  const type = file.type;
  let bytes: Uint8Array;
  let mimeType: ImageAsset['mimeType'];
  let width: number;
  let height: number;

  if (NATIVE_TYPES.has(type)) {
    bytes = new Uint8Array(await file.arrayBuffer());
    mimeType = type as ImageAsset['mimeType'];
    const image = await decode(file);
    width = image.naturalWidth;
    height = image.naturalHeight;
  } else {
    const image = await decode(file);
    width = image.naturalWidth;
    height = image.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not read that image.');
    ctx.drawImage(image, 0, 0);
    bytes = await canvasToPngBytes(canvas);
    mimeType = 'image/png';
  }

  if (!width || !height) throw new Error('That image appears to be empty.');

  return {
    id: `asset-${crypto.randomUUID()}`,
    bytes,
    mimeType,
    width,
    height,
    objectUrl: URL.createObjectURL(new Blob([bytes.slice().buffer as ArrayBuffer], { type: mimeType })),
  };
}
