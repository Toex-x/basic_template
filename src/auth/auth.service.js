import axios from 'axios';
import { apiConfigManager } from './apiConfig';
import { STORAGE_KEYS } from 'constants/storage';
 
export const authBase = async () => {
    const authUrl = apiConfigManager.getUrl('authUrl');
    const authApiUrl = `${authUrl}/authorization/authorize`;
 
    try {
        const { data } = await axios.get(authApiUrl, {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (data?.token) {
            sessionStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data));
        }
 
        return data;
    } catch (error) {
        sessionStorage.setItem(STORAGE_KEYS.user, '');
        throw error;
    }
};