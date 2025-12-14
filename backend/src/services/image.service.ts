import fs from 'fs';
import sharp from 'sharp';
import { resolveSafePath } from '../utils/safePath.js';
import { getFromCache, saveToCache } from './imageCache.js';

export async function createPreviewStream(root: string, relativePath: string) {
    const fullPath = resolveSafePath(root, relativePath);

    console.log('fullPath', fullPath)

    return sharp(fullPath);
}

export async function createFileStream(root: string, relativePath: string) {
    const fullPath = resolveSafePath(root, relativePath);
    return fs.createReadStream(fullPath);
}

const VIEW_SIZE = 400;

export async function createPreviewViewImage(
    root: string,
    relativePath: string
): Promise<Buffer> {
    const fullPath = resolveSafePath(root, relativePath);

    const cacheKey = `${fullPath}::view-${VIEW_SIZE}`;

    const cached = getFromCache(cacheKey);
    if (cached) {
        return cached;
    }

    const buffer = await sharp(fullPath)
        .resize({
            width: VIEW_SIZE,
            height: VIEW_SIZE,
            fit: 'inside',
            withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toBuffer();

    saveToCache(cacheKey, buffer);

    return buffer;
}