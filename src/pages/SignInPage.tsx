import logo from "../assets/ivy-books-logo.png";
import { useAuth } from "../context/AuthContext";

export default function SignInPage() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0E3386] relative overflow-hidden">
      {/* Background decoration */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none select-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-1" />
      <div className="absolute bottom-0 left-0 right-0 h-1" />

      {/* Card */}
      <div className="relative bg-[#F5F0E8] rounded-2xl shadow-2xl p-10 flex flex-col items-center gap-7 w-full max-w-sm mx-4 border-t-4 border-[#CC3433]">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <img
            src={logo}
            alt="Ivy Books"
            className="w-36 h-36 -mb-2 object-contain"
          />
          <div className="text-center">
            <h1 className="text-4xl font-bold text-[#0E3386]">Ivy Books</h1>
            <p className="text-sm text-gray-500 mt-1 tracking-wide uppercase">
              Book Club
            </p>
          </div>
        </div>

        {/* Divider with stitching look */}
        <div className="w-full flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-gray-400 text-xs uppercase tracking-widest">
            Let's get Fromeing
          </span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        {/* Sign in button */}
        <button
          onClick={signInWithGoogle}
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-5 py-3.5 w-full justify-center shadow-sm hover:shadow-md hover:border-gray-300 transition-all font-medium text-gray-700 cursor-pointer"
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            className="w-5 h-5"
          />
          Sign in with Google
        </button>

        <p className="text-xs text-gray-400 text-center leading-relaxed">
          Access is by invitation only.
          <br />
          Read Ethan Frome, then hit me up.
        </p>
      </div>
    </div>
  );
}
