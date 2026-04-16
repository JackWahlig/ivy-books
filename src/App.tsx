import { AuthProvider, useAuth } from "./context/AuthContext";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import ArchivePage from "./pages/ArchivePage";
import BookPage from "./pages/BookPage";
import Header from "./components/layout/Header";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import PrefListPage from "./pages/PrefListPage";
import ProfilePage from "./pages/ProfilePage";
import SearchResultsPage from "./pages/SearchResultsPage";
import SignInPage from "./pages/SignInPage";
import { Toaster } from "react-hot-toast";

function ProtectedRoutes() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0E3386]">
        <span className="text-white text-xl animate-pulse">Loading...</span>
      </div>
    );
  }

  if (!currentUser) return <SignInPage />;

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/book/:bookId" element={<BookPage />} />
          <Route path="/prefs" element={<PrefListPage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" />
        <ProtectedRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
