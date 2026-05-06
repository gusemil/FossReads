import { jwtDecode } from "jwt-decode";

type JwtPayload = {
  unique_name?: string;
  name?: string;
  sub?: string;
};

export const getUsernameFromToken = (): string | null => {
  const token = getToken();

  if (!token) return null;

  try {
    const decoded = jwtDecode<JwtPayload>(token);

    return decoded.name ?? decoded.unique_name ?? null;
  } catch {
    return null;
  }
};

//TODO: Remove old stuff as it is not needed

export const setToken = (token: string) => {
  localStorage.setItem("token", token);
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const logout = () => {
  localStorage.removeItem("token");
};