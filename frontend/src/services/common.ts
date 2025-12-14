import { api } from "./api.ts";
import type { DirResponse } from '../types/api.ts';


export const fetchDir = async (path = '') => {
   const resp = await api.get<DirResponse>('/fs/dir', {
        params: { path },
    });

  return resp.data;
}

// export function previewUrl(path: string) {
//     return `${API_BASE}/image/preview?path=${encodeURIComponent(path)}`;
// }
//
// export function fileUrl(path: string) {
//     return `${API_BASE}/image/file?path=${encodeURIComponent(path)}`;
// }
