import axios from "axios";
import { getToken } from "./auth";
import { logout } from "./auth";

// In local dev:   VITE_API_BASE_URL is undefined → falls back to localhost:5128
// In Docker:      VITE_API_BASE_URL="" → axios uses relative URLs → nginx proxies /api/* to the API container
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5128"
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;

export const getReviews = async (page: number, pageSize: number = 10) => {
  const res = await api.get("/api/reviews", { params: { page, pageSize } });

  return res.data;
};

export const createReview = async (review: {
  title: string;
  description?: string;
  stars: number;
  bookId: number;
}) => {
  const res = await api.post("/api/reviews", review);
  return res.data;
};

export const deleteReview = async (id: number) => {
  await api.delete(`/api/reviews/${id}`);
};

export const updateReview = async (
  id: number,
  review: {
    title: string;
    description?: string;
    stars: number;
  }
) => {
  await api.put(`/api/reviews/${id}`, review);
};

export const login = async (username: string, password: string) => {
  const res = await api.post("/api/auth/login", { username, password });
  return res.data;
};

export const register = async (username: string, password: string) => {
  await api.post("/api/auth/register", { username, password });
};

//Auto-logout on 401 (Unauthorized)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      logout();
      window.location.reload();
    }
    return Promise.reject(err);
  }
);