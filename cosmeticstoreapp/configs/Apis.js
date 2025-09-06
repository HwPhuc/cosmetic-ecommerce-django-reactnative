import axios from "axios";
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// export const API_URL = 'http://0.0.0.0:8000';
export const API_URL = 'http://192.168.1.167:8000';

// OAuth2 config
export const CLIENT_ID = Constants.expoConfig?.extra?.CLIENT_ID;
export const CLIENT_SECRET = Constants.expoConfig?.extra?.CLIENT_SECRET;
export const TOKEN_URL = `${API_URL}/o/token/`;

// Các endpoint API
export const endpoints = {
	categories: '/categories/',
	products: '/products/',
	register: '/register/',
	login: '/o/token/',
	currentUser: '/current-user/',
	updateUser: '/update-user/',
	productDetails: (id) => `/products/${id}/`,
};

// Axios instance không token
export const axiosInstance = axios.create({
	baseURL: API_URL
});

// Axios instance có token
export const authAxios = (token) => axios.create({
	baseURL: API_URL,
	headers: {
		'Authorization': `Bearer ${token}`
	}
});
