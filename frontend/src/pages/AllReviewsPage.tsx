import { useNavigate, Navigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";

import { getReviews, deleteReview, updateReview } from "../api/reviewsApi";
import { logout, getToken, getUsernameFromToken } from "../api/auth";
import { useDarkMode } from "../hooks/useDarkMode";
import LangToggle from "../components/LangToggle";
import BookCover from "../components/BookCover";

const username = getUsernameFromToken();

type Book = {
  id: number;
  title: string;
  author: string;
  imagePath?: string | null;
};

type Review = {
  id: number;
  title: string;
  description: string;
  stars: number;
  createdAt: string;
  bookId: number;
  book: Book;
};

export default function AllReviewsPage() {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stars, setStars] = useState<number>(0);
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
    loadReviews(page);
  }, [page, isAuthenticated]);

  const loadReviews = async (pageNumber: number) => {
    setLoading(true);
    try {
      const data = await getReviews(pageNumber, pageSize);
      setReviews(data.items ?? []);
      setTotalPages(data.totalPages);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const startEdit = (review: Review) => {
    setEditingId(review.id);
    setTitle(review.title);
    setStars(review.stars);
    setDescription(review.description ?? "");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setStars(0);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("reviews.confirmDelete"))) return;
    try {
      await deleteReview(id);
      await loadReviews(page);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      await updateReview(editingId, { title, description, stars });
      cancelEdit();
      await loadReviews(page);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (loading) return <p className="dark:text-white">{t("reviews.loading")}</p>;

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
          <h1 className="text-3xl font-bold dark:text-white">{t("reviews.reviews")}</h1>
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

      {/* Edit form — only visible while editing */}
      {editingId && (
        <div ref={formRef} className="flex justify-center mb-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">{t("reviews.editReviewTitle")}</h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                placeholder={t("reviews.title")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input
                className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                type="number"
                placeholder={t("reviews.stars")}
                value={stars || ""}
                onChange={(e) => setStars(Number(e.target.value))}
              />
              <textarea
                className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                placeholder={t("reviews.description")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <button
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                type="submit"
                disabled={!title || !(stars > 0 && stars < 6)}
              >
                {t("reviews.updateReviewTitle")}
              </button>
              <button
                type="button"
                className="w-full bg-gray-300 dark:bg-gray-600 dark:text-white p-2 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                onClick={cancelEdit}
              >
                {t("reviews.cancel")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 mt-12">
          <p className="text-lg">{t("reviews.noReviews")}</p>
          <button
            onClick={() => navigate("/")}
            className="mt-2 text-blue-500 hover:underline text-sm"
          >
            {t("reviews.goToBooks")}
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow flex gap-4 items-start"
            >
              <button onClick={() => navigate(`/books/${review.bookId}`)}>
                <BookCover imagePath={review.book?.imagePath} size="sm" />
              </button>
              <div className="flex-1 min-w-0">
                <h3
                  className="font-bold text-lg dark:text-white cursor-pointer hover:text-blue-500"
                  onClick={() => navigate(`/reviews/${review.bookId}`)}
                >
                  {review.book?.title ?? t("reviews.unknownBook")}
                </h3>
                <p className="text-yellow-500">{"⭐".repeat(review.stars)}</p>
                <p className="text-gray-600 dark:text-gray-300">{review.title}</p>
                <p className="text-sm italic text-gray-500 dark:text-gray-400">{review.description}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="space-x-2 shrink-0">
                <button
                  onClick={() => startEdit(review)}
                  className="bg-yellow-400 px-3 py-1 rounded hover:bg-yellow-500"
                >
                  {t("reviews.edit")}
                </button>
                <button
                  onClick={() => handleDelete(review.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  {t("reviews.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            className="px-4 py-2 bg-gray-300 dark:bg-gray-700 dark:text-white rounded disabled:opacity-50"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            {t("reviews.previous")}
          </button>
          <span className="font-semibold dark:text-white">
            {t("reviews.page", { page, total: totalPages })}
          </span>
          <button
            className="px-4 py-2 bg-gray-300 dark:bg-gray-700 dark:text-white rounded disabled:opacity-50"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("reviews.next")}
          </button>
        </div>
      )}
    </div>
  );
}
