import 'dotenv/config';
import dotenv from 'dotenv';
import path from 'path';


dotenv.config({
  path: path.resolve(process.cwd(), '../.env'),
});

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`❌ Environment variable ${name} is required`);
  }

  return value;
}

const FS_ROOT_ENV = process.env.NODE_ENV === 'production' ? requireEnv('BACKEND_FS_ROOT') : requireEnv('BACKEND_FS_ROOT_DEV');
const PORT = process.env.NODE_ENV === 'production' ? Number(requireEnv('BACKEND_PORT')) : Number(requireEnv('BACKEND_PORT_DEV'));

export const env = {
  PORT,
  FS_ROOT: path.resolve(
    FS_ROOT_ENV,
  ),
} as const;
