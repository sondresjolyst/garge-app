import axios from 'axios';

const API_URL = 'http://localhost:5277/api/auth';

interface RegisterData {
    username: string;
    email: string;
    password: string;
}

interface LoginData {
    email: string;
    password: string;
}

const register = (data: RegisterData) => {
    return axios.post(`${API_URL}/register`, data);
};

const login = (data: LoginData) => {
    return axios.post(`${API_URL}/login`, data);
};

export default {
    register,
    login
};
