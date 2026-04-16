import { Angry } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "../assets/ivy-books-logo.png";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
      <img
        src={logo}
        alt="Ivy Books"
        className="w-36 h-36 -mb-3 object-contain"
      />
      <h1 className="text-4xl font-bold text-[#0E3386]">Foul Ball</h1>
      <p className="text-gray-500 max-w-sm flex items-center justify-center gap-1.5">
        Stop poking around where you don't belong
        <Angry className="inline shrink-0" />
      </p>
      <Link
        to="/"
        className="mt-2 px-6 py-2.5 bg-[#0E3386] text-white rounded-lg font-medium hover:bg-[#0E3386]/90 transition-colors cursor-pointer"
      >
        Back to the Lineup
      </Link>
    </div>
  );
}
