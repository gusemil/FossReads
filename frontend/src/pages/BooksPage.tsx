import { useNavigate } from "react-router-dom";

import { useEffect, useState } from "react";
import { createBook } from "../api/booksApi";
import { deleteBook } from "../api/booksApi";
import { updateBook } from "../api/booksApi";
import { login } from "../api/booksApi";
import { setToken, logout } from "../api/auth";
import { getToken } from "../api/auth";
import { getBooks } from "../api/booksApi";
import { useRef } from "react";


type Book = {
  id: number;
  title: string;
  author: string;
  description: string;
  publishedYear: number;
};

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publishedYear, setPublishedYear] = useState<number>(2026);
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken()); //token exists -> true, token doesn't exist -> false

  const formRef = useRef<HTMLDivElement | null>(null);

  //Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const data = await login(username, password);

    setToken(data.token);
    setIsAuthenticated(true);

    await loadBooks(page);
  } catch {
    alert("Login failed");
  }
};

/*
const handleLogout = () => {
  logout();
  setIsAuthenticated(false);
  setBooks([]);
};
*/

const navigate = useNavigate();

const handleLogout = () => {
  logout();
  navigate("/login");
};


useEffect(() => {
  if (isAuthenticated) {
    loadBooks(page);
  }
}, [page]);

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

  const startEdit = (book: Book) => {
  setEditingId(book.id);

  setTitle(book.title);
  setAuthor(book.author);
  setDescription(book.description ?? "");
  setPublishedYear(book.publishedYear);

    //Scroll to form
  formRef.current?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};

  const handleDelete = async (id: number) => {
  if (!confirm("Are you sure you want to delete this book?"))
    return;
  try {
    await deleteBook(id);

    await loadBooks(page);
    // setBooks(prev => prev.filter(b => b.id !== id));
  } catch (err) {
    console.error(err);
  }
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    if (editingId) {
      // UPDATE
      await updateBook(editingId, {
        title,
        author,
        description,
        publishedYear
      });
    } else {
      // CREATE
      await createBook({
        title,
        author,
        description,
        publishedYear
      });
    }

    // Reset form
    setEditingId(null);
    setTitle("");
    setAuthor("");
    setDescription("");
    setPublishedYear(2026);

    await loadBooks(page);
  } catch (err) {
    console.error(err);
  }
};

  if (loading) return <p>Loading books...</p>;

if (!isAuthenticated) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm">
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
      </div>
    </div>
  );
}
else
return (
  <div className="min-h-screen bg-gray-100 p-6">
    
    {/* Header */}
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">FossReads</h1>
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>

    {/* Form Card */}
    <div ref={formRef} className="flex items-center justify-center">
        <div className="flex items-center justify-center">
            <div className="bg-white p-6 rounded-2xl shadow mb-6 max-w-md">
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
            </div>

            <div className="space-x-2">
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