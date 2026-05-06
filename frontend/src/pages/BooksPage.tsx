import { useNavigate, Navigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";

import {
  createBook,
  deleteBook,
  updateBook,
  getBooks,
} from "../api/booksApi";

import { logout, getToken, getUsernameFromToken } from "../api/auth";
import { jwtDecode } from "jwt-decode";
const username = getUsernameFromToken();

type ReadingStatus = 0 | 1 | 2 | 3 | 4 | 5;

const STATUS_LABELS: Record<ReadingStatus, string> = {
  0: "No Progress",
  1: "Want to Read",
  2: "Owned",
  3: "In Progress",
  4: "Read",
  5: "Did Not Finish",
};

const STATUS_COLORS: Record<ReadingStatus, string> = {
  0: "bg-gray-200 text-gray-600",
  1: "bg-blue-100 text-blue-700",
  2: "bg-purple-100 text-purple-700",
  3: "bg-yellow-100 text-yellow-700",
  4: "bg-green-100 text-green-700",
  5: "bg-red-100 text-red-700",
};

type Book = {
  id: number;
  title: string;
  author: string;
  description: string;
  publishedYear: number;
  status: ReadingStatus;
  review?: Review | null;
};

type Review = {
  id: number;
  title: string;
  description: string;
  stars: number;
  createdAt: string; //Should be string in React
};

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publishedYear, setPublishedYear] = useState<number>(2026);
  const [description, setDescription] = useState("");

  const [status, setStatus] = useState<ReadingStatus>(0);

  const [editingId, setEditingId] = useState<number | null>(null);

  const formRef = useRef<HTMLDivElement | null>(null);

  const navigate = useNavigate();

  // ✅ derive auth directly from token
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

    formRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this book?")) return;

    try {
      await deleteBook(id);
      await loadBooks(page);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await updateBook(editingId, {
          title,
          author,
          description,
          publishedYear,
          status,
        });
      } else {
        await createBook({
          title,
          author,
          description,
          publishedYear,
          status,
        });
      }

      // Reset form
      setEditingId(null);
      setTitle("");
      setAuthor("");
      setDescription("");
      setPublishedYear(2026);
      setStatus(0);

      await loadBooks(page);
    } catch (err) {
      console.error(err);
    }

    const token = getToken() ?? "null token"
    console.log(jwtDecode(token));
  };

  // Redirect if not logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (loading) return <p>Loading books...</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">FossReads</h1>

          <div className="flex items-center gap-4">
          <span className="text-gray-600">
            👤 {username}
          </span>


        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </div>

      {/* Form */}
      <div ref={formRef} className="flex justify-center">
        <div className="bg-white p-6 rounded-2xl shadow mb-6 max-w-md w-full">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? "Edit Book" : "Add Book"}
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
              placeholder="Author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />

            <input
              className="w-full border p-2 rounded"
              type="number"
              value={publishedYear}
              onChange={(e) => setPublishedYear(Number(e.target.value))}
            />

            <select
              className="w-full border p-2 rounded"
              value={status}
              onChange={(e) => setStatus(Number(e.target.value) as ReadingStatus)}
            >
              {(Object.entries(STATUS_LABELS) as [string, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <textarea
              className="w-full border p-2 rounded"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <button
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              type="submit"
              disabled={!title || !author}
            >
              {editingId ? "Update Book" : "Add Book"}
            </button>

            {editingId && (
              <button
                type="button"
                className="w-full bg-gray-300 p-2 rounded hover:bg-gray-400"
                onClick={() => {
                  setEditingId(null);
                  setTitle("");
                  setAuthor("");
                  setDescription("");
                  setPublishedYear(2026);
                }}
              >
                Cancel
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
            className="bg-white p-4 rounded-xl shadow flex justify-between items-start"
          >
            <div>
              <h3 className="font-bold text-lg">{book.title}</h3>
              <p className="text-gray-600">
                {book.author} ({book.publishedYear})
              </p>
              <p className="text-sm italic text-gray-500">
                {book.description}
              </p>
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${STATUS_COLORS[book.status]}`}>
                {STATUS_LABELS[book.status]}
              </span>
              {book.review && (
                <p className="text-sm text-yellow-500 mt-1">
                  {"⭐".repeat(book.review.stars)}
                </p>
              )}
            </div>

            <div className="space-x-2">
              <button
                onClick={() => navigate(`/reviews/${book.id}`)}
                className="bg-blue-400 text-white px-3 py-1 rounded hover:bg-blue-500"
              >
                {book.review ? "Review" : "Add Review"}
              </button>

              <button
                onClick={() => startEdit(book)}
                className="bg-yellow-400 px-3 py-1 rounded hover:bg-yellow-500"
              >
                Edit
              </button>

              <button
                onClick={() => handleDelete(book.id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 mt-6">
        <button
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </button>

        <span className="font-semibold">
          Page {page} of {totalPages}
        </span>

        <button
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}