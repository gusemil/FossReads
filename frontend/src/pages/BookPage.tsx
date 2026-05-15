import { useNavigate, Navigate, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";

import { getBookById, updateBook, deleteBook, uploadBookImage, deleteBookImage } from "../api/booksApi";
import { logout, getToken, getUsernameFromToken } from "../api/auth";
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

type Review = {
  id: number;
  title: string;
  stars: number;
};

type Ownership = 0 | 1 | 2;

type Book = {
  id: number;
  title: string;
  author: string;
  description?: string;
  publishedYear: number;
  status: ReadingStatus;
  readDate?: string | null;
  ownership?: Ownership | null;
  imagePath?: string | null;
  review?: Review | null;
};

export default function BookPage() {
  const { t } = useTranslation();
  const { bookId } = useParams<{ bookId: string }>();
  const parsedBookId = Number(bookId);

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publishedYear, setPublishedYear] = useState<number>(2026);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ReadingStatus>(0);
  const [ownership, setOwnership] = useState<Ownership | null>(null);

  const formRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { isDark, toggleDark } = useDarkMode();
  const isAuthenticated = !!getToken();

  useEffect(() => {
    if (!isAuthenticated) return;
    loadBook();
  }, [isAuthenticated]);

  const loadBook = async () => {
    setLoading(true);
    try {
      const data = await getBookById(parsedBookId);
      setBook(data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = () => {
    if (!book) return;
    setTitle(book.title);
    setAuthor(book.author);
    setDescription(book.description ?? "");
    setPublishedYear(book.publishedYear);
    setStatus(book.status);
    setOwnership(book.ownership ?? null);
    setEditing(true);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateBook(parsedBookId, { title, author, description, publishedYear, status, ownership });
      setEditing(false);
      await loadBook();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("books.confirmDelete"))) return;
    try {
      await deleteBook(parsedBookId);
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      await uploadBookImage(parsedBookId, file);
      await loadBook();
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageRemove = async () => {
    try {
      await deleteBookImage(parsedBookId);
      await loadBook();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (loading) return <p className="p-6 dark:text-white">{t("bookPage.loading")}</p>;
  if (notFound || !book) return <p className="p-6 dark:text-white">{t("bookPage.notFound")}</p>;

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
          <h1 className="text-3xl font-bold dark:text-white">{book.title}</h1>
        </div>

        <div className="flex items-center gap-4">
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

      {/* Book detail card */}
      {!editing && (
        <div className="flex justify-center mb-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow w-full max-w-md">
            {/* Cover image */}
            <div className="flex gap-5 mb-4">
              <div className="flex flex-col items-center gap-2 shrink-0">
                <BookCover imagePath={book.imagePath} size="lg" />
                <label className="text-xs text-blue-500 hover:underline cursor-pointer">
                  {book.imagePath ? t("books.changeImage") : t("books.uploadImage")}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                      e.target.value = "";
                    }}
                  />
                </label>
                {book.imagePath && (
                  <button
                    onClick={handleImageRemove}
                    className="text-xs text-red-400 hover:underline"
                  >
                    {t("books.removeImage")}
                  </button>
                )}
              </div>

              <div>
                <p className="mb-2 text-xl font-bold dark:text-white">
                  {book.title} ({book.publishedYear})
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  {book.author}
                </p>
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${STATUS_COLORS[book.status]}`}>
                  {t(`status.${book.status}`)}
                </span>
                {book.ownership != null && (
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full mt-1 ml-1 bg-amber-100 text-amber-700">
                    {t(`ownership.${book.ownership}`)}
                  </span>
                )}
                {book.readDate && (
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    {t("bookPage.readOn")}: {new Date(book.readDate).toLocaleDateString()}
                  </p>
                )}
                {book.description && (
                  <p className="text-sm italic text-gray-500 dark:text-gray-400 mt-3">
                    {book.description}
                  </p>
                )}
              </div>
            </div>

            {book.review && (
              <div className="border-t dark:border-gray-700 pt-3 mb-4">
                <p className="text-yellow-500 text-sm">{"⭐".repeat(book.review.stars)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{book.review.title}</p>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={startEdit}
                className="bg-yellow-400 px-4 py-2 rounded hover:bg-yellow-500"
              >
                {t("books.edit")}
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                {t("books.delete")}
              </button>
              <button
                onClick={() => navigate(`/reviews/${book.id}`)}
                className="bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-500"
              >
                {book.review ? t("bookPage.viewReview") : t("books.addReview")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div ref={formRef} className="flex justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow mb-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">
              {t("books.editBook")}
            </h2>

            <form onSubmit={handleUpdate} className="space-y-3">
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
                {t("books.updateBook")}
              </button>
              <button
                type="button"
                className="w-full bg-gray-300 dark:bg-gray-600 dark:text-white p-2 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                onClick={cancelEdit}
              >
                {t("books.cancel")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
