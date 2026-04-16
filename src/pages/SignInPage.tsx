import { useAuth } from "../context/AuthContext";

export default function SignInPage() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0E3386]">
      <div className="bg-[#F5F0E8] rounded-2xl shadow-2xl p-10 flex flex-col items-center gap-6 w-full max-w-sm">
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl">⚾</span>
          <h1 className="text-3xl font-bold text-[#0E3386] tracking-tight">
            Ivy Books
          </h1>
          <p className="text-sm text-gray-500">Let's get Frome-ing!</p>
        </div>

        <div className="w-full h-px bg-gray-200" />

        <button
          onClick={signInWithGoogle}
          className="flex items-center gap-3 bg-white border border-gray-300 rounded-lg px-5 py-3 w-full justify-center cursor-pointer shadow-sm hover:shadow-md transition-shadow font-medium text-gray-700"
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            className="w-5 h-5"
          />
          Sign in with Google
        </button>

        <p className="text-xs text-gray-400 text-center">
          Access is by invitation only.
          <br />
          Read Ethan Frome, then hit me up.
        </p>
      </div>
    </div>
  );
}
