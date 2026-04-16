import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import BooksPage from "./pages/BooksPage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./components/protectedRoute";
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
    </Routes>
  );
}

export default App;