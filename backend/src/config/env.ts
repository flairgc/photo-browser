import 'dotenv/config';
import path from 'path';

function requireEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(`❌ Environment variable ${name} is required`);
    }

    return value;
}

export const env = {
    PORT: Number(process.env.PORT ?? 3001),

    FS_ROOT: path.resolve(
        requireEnv('FS_ROOT')
    ),
} as const;
