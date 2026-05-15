import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import BooksPage from "./pages/BooksPage";
import RegisterPage from "./pages/RegisterPage";
import ReviewsPage from "./pages/ReviewsPage";
import AllReviewsPage from "./pages/AllReviewsPage";
import UserPage from "./pages/UserPage";
import BookPage from "./pages/BookPage";
import ProtectedRoute from "./components/ProtectedRoute";
//import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <BooksPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reviews"
        element={
          <ProtectedRoute>
            <AllReviewsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reviews/:bookId"
        element={
          <ProtectedRoute>
            <ReviewsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/user"
        element={
          <ProtectedRoute>
            <UserPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/books/:bookId"
        element={
          <ProtectedRoute>
            <BookPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;