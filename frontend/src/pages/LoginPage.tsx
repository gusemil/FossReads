import { useState } from "react";
import { login } from "../api/booksApi";
import { setToken } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDarkMode } from "../hooks/useDarkMode";
import LangToggle from "../components/LangToggle";

export default function LoginPage() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { isDark, toggleDark } = useDarkMode();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await login(username, password);
      setToken(data.token);
      navigate("/");
    } catch {
      alert(t("login.failed"));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="fixed top-4 right-4 flex items-center gap-3">
        <LangToggle />
        <button
          onClick={toggleDark}
          className="text-xl"
          title={t("nav.toggleDark")}
        >
          {isDark ? "☀️" : "🌙"}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-6 text-center dark:text-white">{t("app.name")}</h1>
        <h2 className="text-2xl font-bold mb-6 text-center dark:text-white">{t("login.title")}</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
            placeholder={t("login.username")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
            type="password"
            placeholder={t("login.password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            type="submit"
          >
            {t("login.submit")}
          </button>
        </form>

        <p className="text-sm text-center mt-4 dark:text-gray-300">
          {t("login.noAccount")}{" "}
          <button
            className="text-blue-500 underline"
            onClick={() => navigate("/register")}
          >
            {t("login.register")}
          </button>
        </p>
      </div>
    </div>
  );
}
