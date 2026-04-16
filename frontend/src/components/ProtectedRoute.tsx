import { Navigate } from "react-router-dom";
import { getToken } from "../api/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ProtectedRoute({ children }: any) {
  const token = getToken();

  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
}