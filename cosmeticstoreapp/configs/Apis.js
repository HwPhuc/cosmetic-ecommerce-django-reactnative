import axios from "axios";

// export const API_URL = 'http://192.168.1.167:8000';
export const API_URL = 'http://192.168.1.154:8000';
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
	userAddresses: '/user-addresses/',
	orders: '/orders/',
	adminOrders: '/admin-orders/',
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
