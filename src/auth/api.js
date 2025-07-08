const makeAuthHeaders = (token) => ({
    Authorization: 'Bearer ' + token.replace(/['']/g, ''),
});
 
export const makeAuthRefresh = (config) => {
    return new Promise((resolve, reject) => {
        axios(config)
            .then((response) => resolve(response.data))
            .catch((error) => reject(error));
    });
};
 
export function makeKeepAliveRequest({
    url,
    type = 'post',
    isQuery = false,
    useScanner = false,
}) {
    return async function (data, config) {
        const token = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.user)).token;
        const params = isQuery ? `${url}?${config}` : `${url}/${config}`;
        const baseURL = apiConfigManager.getUrl(!useScanner ? 'mainUrl' : 'scannerUrl');
 
        const result = await fetch(baseURL + (isQuery ? params : url), {
            method: type,
            headers: { ...makeAuthHeaders(token), 'Content-Type': 'application/json' },
            body: JSON.stringify(type === 'get' ? {} : data),
            keepalive: true,
        });
 
        return result.json();
    };
}
 
export function makeRequest({
    url,
    type = 'post',
    isQuery = false,
    useScanner = false,
}) {
    return async (data, config) => {
        const params = isQuery ? `${url}?${config}` : `${url}/${config}`;
        const token = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.user)).token;
 
        const baseURL = apiConfigManager.getUrl(!useScanner ? 'mainUrl' : 'scannerUrl');
 
        const configApi = {
            method: type,
            baseURL,
            url: isQuery ? params : url,
            data: type === 'get' ? {} : data,
            headers: makeAuthHeaders(token),
            dataType: 'json',
            timeout: 60 * 10 * 1000,
            ...config,
        };
 
        let reset = false;
 
        const promise = await axios(configApi)
            .then((response) => Promise.resolve(response.data))
            .catch((error) => {
                if (error.response.status === 401 || error.response.status === 0) {
                    sessionStorage.clear();
                    reset = true;
 
                    return Promise.reject(error);
                } else {
                    return Promise.reject(error);
                }
            });
 
        if (reset) {
            await authBase();
            configApi.headers = { Authorization: 'Bearer ' + token.replace(/['']/g, '') };
            await makeAuthRefresh(configApi);
            return await axios<T>(configApi)
                .then((response) => Promise.resolve(response.data))
                .catch((error) => {
                    if (error.response.status === 401 || error.response.status === 0) {
                        sessionStorage.clear();
                        reset = true;
 
                        return Promise.reject(error);
                    } else {
                        return Promise.reject(error);
                    }
                });
        }
 
        return promise;
    };
}
 
export function makeFileDownload({ url, type = 'post', useScanner = false }) {
    return async (data) => {
        const token = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.user)).token;
 
        const baseURL = useScanner ? apiConfigManager.getUrl('scannerUrl') : apiConfigManager.getUrl('mainUrl');
 
        return fetch(`${baseURL}${url}`, {
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                ...makeAuthHeaders(token),
            },
            body: JSON.stringify(data),
            method: type,
        }).then((resp) => resp.blob());
    };
}
 
// Обращение из проекта.
// await api.block.getDirections({}, serializeQueryParams({id: 1, name: 'sasha'}))
// await api.block.postTest({id: 1, name: 'sasha'})
const api = {
    block: {
        getDirections: makeRequest({
            url: '/test/1',
            type: 'get',
            isQuery: true,
        }),
        postTest: makeRequest({
            url: '/test/2',
            type: 'post',
        }),
    }
}

export default api;