import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const fetchLeads = () => api.get('/api/leads');

export default api;
