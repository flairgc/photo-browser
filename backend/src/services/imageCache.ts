const imageCache = new Map<string, Buffer>();

export function getFromCache(key: string): Buffer | undefined {
    return imageCache.get(key);
}

export function saveToCache(key: string, buffer: Buffer) {
    imageCache.set(key, buffer);
}

export function getCacheSize() {
    return imageCache.size;
}
