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

function getParentDir(path: string): string | null {
  const parts = path.split('/').filter(Boolean);

  // Export/test/file.jpg → ['Export', 'test', 'file.jpg']
  if (parts.length < 2) return null;

  return parts[parts.length - 2];
}

//
// export async function downloadZip(paths: string[], options?: {raw: boolean}) {
//   const response = await api.post(
//     '/fs/zip',
//     { paths, raw: options?.raw },
//     {
//       responseType: 'blob',
//     },
//   );
//
//   const blob = new Blob([response.data], {
//     type: 'application/zip',
//   });
//
//   const url = window.URL.createObjectURL(blob);
//
//   // 👇 имя файла из Content-Disposition
//   const disposition = response.headers['content-disposition'];
//   const match = disposition?.match(/filename="?(.+?)"?$/);
//   const fileName = getParentDir(paths[0]) ?? match?.[1] ?? 'photos.zip';
//
//   const a = document.createElement('a');
//   a.href = url;
//   a.download = fileName;
//
//   document.body.appendChild(a);
//   a.click();
//
//   document.body.removeChild(a);
//   window.URL.revokeObjectURL(url);
// }

export async function downloadZip(
  paths: string[],
  options?: { raw: boolean },
) {
  const response = await api.post(
    '/fs/zip',
    { paths, raw: options?.raw },
    {
      responseType: 'blob',
      onDownloadProgress: (event) => {
        if (!event.total) {
          console.info(`Downloaded ${event.loaded} bytes`);
          return;
        }

        const percent = Math.round((event.loaded * 100) / event.total);
        console.info(`Downloading: ${percent}%`);
      },
    },
  );

  const blob = new Blob([response.data], {
    type: 'application/zip',
  });

  const url = window.URL.createObjectURL(blob);

  const disposition = response.headers['content-disposition'];
  const match = disposition?.match(/filename="?(.+?)"?$/);
  const fileName = getParentDir(paths[0]) ?? match?.[1] ?? 'photos.zip';

  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;

  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
