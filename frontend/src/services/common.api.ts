import { api } from "./api.ts";
import type { DirResponse } from '@/types/api.ts';


export const fetchDir = async (
  path = '',
  isOnlyImages: boolean,
  signal?: AbortSignal,
) => {
  const resp = await api.get<DirResponse>('/fs/dir', {
    params: {
      path,
      onlyImages: isOnlyImages ? 'true' : undefined,
    },
    signal,
  });

  return resp.data;
};

export const fetchExif = async (path = '') => {
  const resp = await api.get<string>('/image/exif', {
    params: {
      path,
    },
  });

  return resp.data;
}

export function downloadZip(paths: string[], options?: { raw: boolean }) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/api/fs/zip';
  form.style.display = 'none';
  form.target = '_self';

  const pathsInput = document.createElement('input');
  pathsInput.type = 'hidden';
  pathsInput.name = 'paths';
  pathsInput.value = JSON.stringify(paths);

  const rawInput = document.createElement('input');
  rawInput.type = 'hidden';
  rawInput.name = 'raw';
  rawInput.value = options?.raw ? 'true' : '';

  form.appendChild(pathsInput);
  form.appendChild(rawInput);

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}
