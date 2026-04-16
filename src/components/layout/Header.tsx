import { BookmarkCheck, ListChevronsUpDown, LogOut } from "lucide-react";

import { Link } from "react-router-dom";
import SearchBar from "./SearchBar";
import logo from "../../assets/ivy-books-logo-white-bg.png";
import { useAuth } from "../../context/AuthContext";

export default function Header() {
  const { currentUser, signOut } = useAuth();
  const displayName =
    currentUser?.customDisplayName ?? currentUser?.displayName ?? "User";

  return (
    <header className="bg-[#0E3386] text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 shrink-0 mr-2 group cursor-pointer"
        >
          <img
            src={logo}
            alt="Ivy Books"
            className="w-12 h-12 object-contain"
          />
          <div className="hidden sm:flex flex-col leading-none -mt-1">
            <h1 className="tracking-tight text-xl">Ivy Books</h1>
            <span className="text-[10px] text-white/50 uppercase tracking-widest">
              Book Club
            </span>
          </div>
        </Link>

        {/* Divider */}
        <div className="hidden sm:block h-8 w-px bg-white/20 mx-1" />

        {/* Search bar */}
        <div className="flex-1">
          <SearchBar />
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-1 shrink-0">
          <Link
            to="/archive"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer"
          >
            <BookmarkCheck className="w-4 h-4" />
            <span className="hidden md:block">Archive</span>
          </Link>

          <Link
            to="/prefs"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ListChevronsUpDown className="w-4 h-4" />
            <span className="hidden md:block">Pref List</span>
          </Link>

          {/* Divider */}
          <div className="h-6 w-px bg-white/20 mx-1" />

          {/* User */}
          <Link
            to="/profile"
            className="flex items-center gap-1.5 px-2 py-2 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-[#CC3433] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
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
        </nav>
      </div>
    </header>
  );
}
