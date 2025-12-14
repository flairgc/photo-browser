import axios, {
    type AxiosInstance,
    type AxiosRequestConfig,
} from 'axios';

const baseConfig: AxiosRequestConfig = {
    baseURL: '/api',
    timeout: 15_000,
    withCredentials: true,
};


export const api: AxiosInstance = axios.create(baseConfig);
