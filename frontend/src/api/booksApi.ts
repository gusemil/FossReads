import axios from "axios";
import { getToken } from "./auth";
import { logout } from "./auth";

const api = axios.create({
  baseURL: "http://localhost:5128" //Connecting to .NET API
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;

export const getBooks = async (page: number, pageSize: number = 10) => {
  const res = await api.get("/api/books", { params: { page, pageSize } });

  return res.data;
};

export const getReadBooks = async (page: number, pageSize: number = 10) => {
  const res = await api.get("/api/books/read", { params: { page, pageSize } });
  return res.data;
};

export const getBookById = async (id: number) => {
  const res = await api.get(`/api/books/${id}`);
  return res.data;
};

export const createBook = async (book: {
  title: string;
  author: string;
  description?: string;
  publishedYear: number;
  status: number;
  ownership?: number | null;
}) => {
  const res = await api.post("/api/books", book);
  return res.data;
};

export const deleteBook = async (id: number) => {
  await api.delete(`/api/books/${id}`);
};

export const updateBook = async (
  id: number,
  book: {
    title: string;
    author: string;
    description?: string;
    publishedYear: number;
    status: number;
    ownership?: number | null;
  }
) => {
  await api.put(`/api/books/${id}`, book);
};

export const uploadBookImage = async (id: number, file: File) => {
  const form = new FormData();
  form.append("image", file);
  const res = await api.post(`/api/books/${id}/image`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data as { imagePath: string };
};

export const deleteBookImage = async (id: number) => {
  await api.delete(`/api/books/${id}/image`);
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