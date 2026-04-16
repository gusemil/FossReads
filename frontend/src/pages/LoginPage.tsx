import { useState } from "react";
import { login } from "../api/booksApi";
import { setToken } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = await login(username, password);
      setToken(data.token);

      navigate("/"); // go to main app
    } catch {
      alert("Login failed");
    }
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm">
      <h1 className="text-3xl font-bold mb-6 text-center">FossReads</h1>
      <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          className="w-full border p-2 rounded"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          className="w-full border p-2 rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          type="submit"
        >
          Login
        </button>
      </form>

      <p className="text-sm text-center mt-4">
        Don't have an account?{" "}
        <button
          className="text-blue-500 underline"
          onClick={() => navigate("/register")}
        >
          Register
        </button>
      </p>
    </div>
  </div>
);
}