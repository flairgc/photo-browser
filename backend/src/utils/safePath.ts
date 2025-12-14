import path from 'path';

export function resolveSafePath(root: string, userPath = '') {
    const resolved = path.resolve(root, userPath);

    if (!resolved.startsWith(root)) {
        throw new Error('Access denied');
    }

    return resolved;
}
