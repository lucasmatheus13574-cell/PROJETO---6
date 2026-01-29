import axios from "axios";

const URL_API  =  import.meta.env.VITE_API_URL;


const api = axios.create({
    baseURL: URL_API,
});


api.interceptors.request.use(config => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});


export default api;
