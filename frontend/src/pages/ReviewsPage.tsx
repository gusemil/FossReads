import { useNavigate, Navigate, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";

import { createReview, deleteReview, updateReview } from "../api/reviewsApi";
import { getBookById } from "../api/booksApi";
import { logout, getToken, getUsernameFromToken } from "../api/auth";

const username = getUsernameFromToken();

type Review = {
  id: number;
  title: string;
  description: string;
  stars: number;
  createdAt: string;
};

type Book = {
  id: number;
  title: string;
  author: string;
  review?: Review | null;
};

export default function ReviewsPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const parsedBookId = Number(bookId);

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stars, setStars] = useState<number>(0);
  const [editingId, setEditingId] = useState<number | null>(null);

  const formRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

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

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      await deleteReview(id);
      await loadBook();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateReview(editingId, { title, description, stars });
      } else {
        await createReview({ title, description, stars, bookId: parsedBookId });
      }
      setEditingId(null);
      setTitle("");
      setDescription("");
      setStars(0);
      await loadBook();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (loading) return <p>Loading...</p>;

  const review = book?.review ?? null;
  const showForm = !review || editingId !== null;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="text-blue-500 hover:underline text-sm"
          >
            ← Books
          </button>
          <h1 className="text-3xl font-bold">{book?.title ?? "Review"}</h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-gray-600">👤 {username}</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Existing review */}
      {review && !editingId && (
        <div className="flex justify-center mb-6">
          <div className="bg-white p-4 rounded-xl shadow w-full max-w-md flex justify-between items-start">
            <div>
              <p className="text-xl mb-1">{"⭐".repeat(review.stars)}</p>
              <p className="font-semibold">{review.title}</p>
              <p className="text-sm italic text-gray-500">{review.description}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="space-x-2">
              <button
                onClick={() => startEdit(review)}
                className="bg-yellow-400 px-3 py-1 rounded hover:bg-yellow-500"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(review.id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div ref={formRef} className="flex justify-center">
          <div className="bg-white p-6 rounded-2xl shadow mb-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? "Edit review" : "Add review"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                className="w-full border p-2 rounded"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <input
                className="w-full border p-2 rounded"
                type="number"
                placeholder="Stars (1-5)"
                value={stars || ""}
                onChange={(e) => setStars(Number(e.target.value))}
              />

              <textarea
                className="w-full border p-2 rounded"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <button
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                type="submit"
                disabled={!title || !(stars > 0 && stars < 6)}
              >
                {editingId ? "Update review" : "Add review"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="w-full bg-gray-300 p-2 rounded hover:bg-gray-400"
                  onClick={() => {
                    setEditingId(null);
                    setTitle("");
                    setDescription("");
                    setStars(0);
                  }}
                >
                  Cancel
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
