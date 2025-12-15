import { api } from "./api.ts";
import type { DirResponse } from '../types/api.ts';


export const fetchDir = async (path = '', isOnlyImages: boolean) => {
   const resp = await api.get<DirResponse>('/fs/dir', {
        params: {
          path,
          onlyImages: isOnlyImages ? 'true' : undefined,
        },
    });

  return resp.data;
}
