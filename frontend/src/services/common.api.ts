import { api } from "./api.ts";
import type { DirResponse } from '@/types/api.ts';


export const fetchDir = async (path = '', isOnlyImages: boolean) => {
   const resp = await api.get<DirResponse>('/fs/dir', {
        params: {
          path,
          onlyImages: isOnlyImages ? 'true' : undefined,
        },
    });

  return resp.data;
}

export const fetchExif = async (path = '') => {
   const resp = await api.get<string>('/fs/exif', {
        params: {
          path,
        },
    });

  return resp.data;
}

export async function downloadTestZip() {
  const response = await api.post(
    '/fs/zip',
    {
      paths: [
        'DSC03140.JPG',
        'DSC06910.ARW',
      ],
    },
    {
      responseType: 'blob', // 👈 обязательно
    },
  );

  const blob = new Blob([response.data], {
    type: 'application/zip',
  });

  const url = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'photos.zip';
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}