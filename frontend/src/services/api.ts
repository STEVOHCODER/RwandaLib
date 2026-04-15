import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const library = {
  getDocuments: (params: any) => api.get('/documents', { params }),
  uploadDocument: (formData: FormData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadBulk: (formData: FormData) => api.post('/documents/upload-bulk', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  requestDownload: (data: { documentId: number, phoneNumber: string, reason?: string }) => api.post('/download/request', data),
};

export const admin = {
  getPendingDocs: () => api.get('/admin/documents?status=PENDING'),
  getAllDocs: () => api.get('/admin/documents?status=APPROVED'),
  getPendingRequests: () => api.get('/admin/download-requests?status=PENDING'),
  approveDoc: (id: number) => api.patch(`/admin/documents/${id}/status`, { status: 'APPROVED' }),
  updateDoc: (id: number, data: any) => api.put(`/admin/documents/${id}`, data),
  deleteDoc: (id: number) => api.delete(`/admin/documents/${id}`),
  approveRequest: (id: number) => api.patch(`/admin/download-requests/${id}`, { status: 'APPROVED' }),
  getStats: () => api.get('/admin/stats'),
};

export default api;
