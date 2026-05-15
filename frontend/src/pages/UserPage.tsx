import { useNavigate, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { getReadBooks } from "../api/booksApi";
import { logout, getToken, getUsernameFromToken } from "../api/auth";
import { useDarkMode } from "../hooks/useDarkMode";
import LangToggle from "../components/LangToggle";

const username = getUsernameFromToken();

type Book = {
  id: number;
  title: string;
  author: string;
  description?: string;
  publishedYear: number;
  readDate: string;
};

export default function UserPage() {
  const { t } = useTranslation();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();
  const { isDark, toggleDark } = useDarkMode();
  const isAuthenticated = !!getToken();

  useEffect(() => {
    if (!isAuthenticated) return;
    loadBooks(page);
  }, [page, isAuthenticated]);

  const loadBooks = async (pageNumber: number) => {
    setLoading(true);
    try {
      const data = await getReadBooks(pageNumber, pageSize);
      setBooks(data.items ?? []);
      setTotalPages(data.totalPages);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="text-blue-500 hover:underline text-sm"
          >
            {t("nav.books")}
          </button>
          <h1 className="text-3xl font-bold dark:text-white">
            👤 {username} — {t("user.title")}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <LangToggle />
          <button onClick={toggleDark} className="text-xl" title={t("nav.toggleDark")}>
            {isDark ? "☀️" : "🌙"}
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            {t("nav.logout")}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="dark:text-white">{t("books.loading")}</p>
      ) : books.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 mt-12">
          <p className="text-lg">{t("user.noBooks")}</p>
          <button
            onClick={() => navigate("/")}
            className="mt-2 text-blue-500 hover:underline text-sm"
          >
            {t("user.goToBooks")}
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {books.map((book) => (
            <div
              key={book.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow flex justify-between items-start"
            >
              <div>
                <h3
                  className="font-bold text-lg dark:text-white cursor-pointer hover:text-blue-500"
                  onClick={() => navigate(`/books/${book.id}`)}
                >
                  {book.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {book.author} ({book.publishedYear})
                </p>
                {book.description && (
                  <p className="text-sm italic text-gray-500 dark:text-gray-400">
                    {book.description}
                  </p>
                )}
              </div>
              <div className="text-sm text-gray-400 dark:text-gray-500 shrink-0 text-right">
                <span className="block text-xs uppercase tracking-wide mb-0.5">
                  {t("user.readOn")}
                </span>
                {new Date(book.readDate).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            className="px-4 py-2 bg-gray-300 dark:bg-gray-700 dark:text-white rounded disabled:opacity-50"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            {t("user.previous")}
          </button>
          <span className="font-semibold dark:text-white">
            {t("user.page", { page, total: totalPages })}
          </span>
          <button
            className="px-4 py-2 bg-gray-300 dark:bg-gray-700 dark:text-white rounded disabled:opacity-50"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("user.next")}
          </button>
        </div>
      )}
    </div>
  );
}
