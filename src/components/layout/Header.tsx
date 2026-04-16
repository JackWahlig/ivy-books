import { BookmarkCheck, ListChevronsUpDown, LogOut, User } from "lucide-react";

import { Link } from "react-router-dom";
import SearchBar from "./SearchBar";
import { useAuth } from "../../context/AuthContext";

export default function Header() {
  const { currentUser, signOut } = useAuth();

  const displayName =
    currentUser?.customDisplayName ?? currentUser?.displayName ?? "User";

  return (
    <header className="bg-[#0E3386] text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 mr-2">
          <span className="text-2xl">⚾</span>
          <span className="text-xl font-bold tracking-tight hidden sm:block">
            Ivy Books
          </span>
        </Link>

        {/* Search bar — takes up remaining space */}
        <div className="flex-1">
          <SearchBar />
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-1 shrink-0">
          <Link
            to="/archive"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <BookmarkCheck className="w-4 h-4" />
            <span className="hidden md:block">Archive</span>
          </Link>

          <Link
            to="/prefs"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <ListChevronsUpDown className="w-4 h-4" />
            <span className="hidden md:block">Pref List</span>
          </Link>

          {/* User menu */}
          {/* User menu */}
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/20">
            <Link
              to="/profile"
              className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span className="hidden md:block max-w-30 truncate">
                {displayName}
              </span>
            </Link>
            <button
              onClick={signOut}
              title="Sign out"
              className="p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
