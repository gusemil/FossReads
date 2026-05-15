import { useNavigate, Navigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";

import {
  createBook,
  deleteBook,
  updateBook,
  getBooks,
  uploadBookImage,
} from "../api/booksApi";

import { logout, getToken, getUsernameFromToken } from "../api/auth";
import { jwtDecode } from "jwt-decode";
import { useDarkMode } from "../hooks/useDarkMode";
import LangToggle from "../components/LangToggle";
import BookCover from "../components/BookCover";

const username = getUsernameFromToken();

type ReadingStatus = 0 | 1 | 2 | 3 | 4 | 5;

const STATUS_COLORS: Record<ReadingStatus, string> = {
  0: "bg-gray-200 text-gray-600",
  1: "bg-blue-100 text-blue-700",
  2: "bg-purple-100 text-purple-700",
  3: "bg-yellow-100 text-yellow-700",
  4: "bg-green-100 text-green-700",
  5: "bg-red-100 text-red-700",
};

type Ownership = 0 | 1 | 2;

type Book = {
  id: number;
  title: string;
  author: string;
  description: string;
  publishedYear: number;
  status: ReadingStatus;
  ownership?: Ownership | null;
  imagePath?: string | null;
  review?: Review | null;
};

type Review = {
  id: number;
  title: string;
  description: string;
  stars: number;
  createdAt: string;
};

export default function BooksPage() {
  const { t } = useTranslation();

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publishedYear, setPublishedYear] = useState<number>(2026);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ReadingStatus>(0);
  const [ownership, setOwnership] = useState<Ownership | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);

  const formRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { isDark, toggleDark } = useDarkMode();

  const isAuthenticated = !!getToken();

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadBooks(page);
  }, [page, isAuthenticated]);

  const loadBooks = async (pageNumber: number) => {
    setLoading(true);
    try {
      const data = await getBooks(pageNumber, pageSize);
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

  const startEdit = (book: Book) => {
    setEditingId(book.id);
    setTitle(book.title);
    setAuthor(book.author);
    setDescription(book.description ?? "");
    setPublishedYear(book.publishedYear);
    setStatus(book.status);
    setOwnership(book.ownership ?? null);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("books.confirmDelete"))) return;
    try {
      await deleteBook(id);
      await loadBooks(page);
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageUpload = async (bookId: number, file: File) => {
    try {
      await uploadBookImage(bookId, file);
      await loadBooks(page);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateBook(editingId, { title, author, description, publishedYear, status, ownership });
      } else {
        await createBook({ title, author, description, publishedYear, status, ownership });
      }
      setEditingId(null);
      setTitle("");
      setAuthor("");
      setDescription("");
      setPublishedYear(2026);
      setStatus(0);
      setOwnership(null);
      await loadBooks(page);
    } catch (err) {
      console.error(err);
    }
    const token = getToken() ?? "null token";
    console.log(jwtDecode(token));
  };

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (loading) return <p className="dark:text-white">{t("books.loading")}</p>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold dark:text-white">{t("app.name")}</h1>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/reviews")}
            className="text-blue-500 hover:underline text-sm"
          >
            {t("nav.reviews")}
          </button>
          <button
            onClick={() => navigate("/user")}
            className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
          >
            👤 {username}
          </button>
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

      {/* Form */}
      <div ref={formRef} className="flex justify-center">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow mb-6 max-w-md w-full">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">
            {editingId ? t("books.editBook") : t("books.addBook")}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
              placeholder={t("books.title")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
              placeholder={t("books.author")}
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
            <input
              className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
              type="number"
              value={publishedYear}
              onChange={(e) => setPublishedYear(Number(e.target.value))}
            />
            <select
              className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
              value={status}
              onChange={(e) => setStatus(Number(e.target.value) as ReadingStatus)}
            >
              {([0, 1, 2, 3, 4, 5] as ReadingStatus[]).map((val) => (
                <option key={val} value={val}>{t(`status.${val}`)}</option>
              ))}
            </select>
            <select
              className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
              value={ownership ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setOwnership(v === "" ? null : Number(v) as Ownership);
              }}
            >
              <option value="">{t("ownership.null")}</option>
              {([0, 1, 2] as Ownership[]).map((val) => (
                <option key={val} value={val}>{t(`ownership.${val}`)}</option>
              ))}
            </select>
            <textarea
              className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
              placeholder={t("books.description")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              type="submit"
              disabled={!title || !author}
            >
              {editingId ? t("books.updateBook") : t("books.addBook")}
            </button>
            {editingId && (
              <button
                type="button"
                className="w-full bg-gray-300 dark:bg-gray-600 dark:text-white p-2 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                onClick={() => {
                  setEditingId(null);
                  setTitle("");
                  setAuthor("");
                  setDescription("");
                  setPublishedYear(2026);
                }}
              >
                {t("books.cancel")}
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Book List */}
      <div className="grid gap-4">
        {books.map((book) => (
          <div
            key={book.id}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow flex gap-4 items-start"
          >
            {/* Cover + upload */}
            <div className="flex flex-col items-center gap-1">
              <button onClick={() => navigate(`/books/${book.id}`)}>
                <BookCover imagePath={book.imagePath} size="sm" />
              </button>
              <label className="text-xs text-blue-500 hover:underline cursor-pointer">
                {t("books.uploadImage")}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(book.id, file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3
                className="font-bold text-lg dark:text-white cursor-pointer hover:text-blue-500"
                onClick={() => navigate(`/books/${book.id}`)}
              >
                {book.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {book.author} ({book.publishedYear})
              </p>
              <p className="text-sm italic text-gray-500 dark:text-gray-400 truncate">
                {book.description}
              </p>
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${STATUS_COLORS[book.status]}`}>
                {t(`status.${book.status}`)}
              </span>
              {book.ownership != null && (
                <span className="inline-block text-xs px-2 py-0.5 rounded-full mt-1 ml-1 bg-amber-100 text-amber-700">
                  {t(`ownership.${book.ownership}`)}
                </span>
              )}
              {book.review && (
                <p className="text-sm text-yellow-500 mt-1">
                  {"⭐".repeat(book.review.stars)}
                </p>
              )}
            </div>

            <div className="space-x-2 shrink-0">
              <button
                onClick={() => navigate(`/reviews/${book.id}`)}
                className="bg-blue-400 text-white px-3 py-1 rounded hover:bg-blue-500"
              >
                {book.review ? t("books.review") : t("books.addReview")}
              </button>
              <button
                onClick={() => startEdit(book)}
                className="bg-yellow-400 px-3 py-1 rounded hover:bg-yellow-500"
              >
                {t("books.edit")}
              </button>
              <button
                onClick={() => handleDelete(book.id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                {t("books.delete")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 mt-6">
        <button
          className="px-4 py-2 bg-gray-300 dark:bg-gray-700 dark:text-white rounded disabled:opacity-50"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          {t("books.previous")}
        </button>
        <span className="font-semibold dark:text-white">
          {t("books.page", { page, total: totalPages })}
        </span>
        <button
          className="px-4 py-2 bg-gray-300 dark:bg-gray-700 dark:text-white rounded disabled:opacity-50"
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          {t("books.next")}
        </button>
      </div>
    </div>
  );
}
