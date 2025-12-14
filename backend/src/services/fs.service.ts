import fs from 'fs/promises';
// import path from 'path';
import { resolveSafePath } from '../utils/safePath.js';


export interface FsItem {
    name: string;
    path: string;
    type: 'file' | 'directory' | 'image';
}

export interface Breadcrumb {
    name: string;
    path: string;
}

function buildBreadcrumbs(relativePath: string) {
    if (!relativePath) {
        return [];
    }

    const normalizedPath = relativePath.replace(/\\/g, '/');

    const parts = normalizedPath.split('/').filter(Boolean);

    let accPath = '';

    return parts.map((part) => {
        accPath = accPath ? `${accPath}/${part}` : part;

        return {
            name: part,
            path: accPath,
        };
    });
}


export async function getDirectoryStructure(root: string, relativePath: string): Promise<{
    content: FsItem[],
    breadcrumbs: Breadcrumb[],
}> {
    const rawRelativePath = relativePath ?? '';

    const normalizedRelativePath = rawRelativePath.replace(/\\/g, '/');

    const fullPath = resolveSafePath(root, normalizedRelativePath);

    const entries = await fs.readdir(fullPath, { withFileTypes: true });

    const content = await Promise.all(
        entries.map(async (entry) => {
            // ❗️ВАЖНО: формируем API-путь вручную, НЕ path.join
            const entryPath = normalizedRelativePath
                ? `${normalizedRelativePath}/${entry.name}`
                : entry.name;

            const isImage = entry.isFile() && /\.(jpe?g|png|webp|gif)$/i.test(entry.name)

            const type: FsItem['type'] = entry.isDirectory() ? 'directory' : isImage ? 'image' : 'file';

            return {
                name: entry.name,
                path: entryPath,
                type,
            };
        })
    );

    const breadcrumbs = buildBreadcrumbs(normalizedRelativePath);

    return {
        content,
        breadcrumbs,
    };
}
