import { doc, updateDoc } from "firebase/firestore";

import { USERS } from "../constants";
import { db } from "../lib/firebase";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function ProfilePage() {
  const { currentUser } = useAuth();

  const [customName, setCustomName] = useState(
    currentUser?.customDisplayName ?? "",
  );
  const [saving, setSaving] = useState(false);

  const effectiveName =
    currentUser?.customDisplayName ?? currentUser?.displayName ?? "";

  async function handleSave() {
    if (!currentUser) return;
    const trimmed = customName.trim();

    setSaving(true);
    try {
      await updateDoc(doc(db, USERS, currentUser.uid), {
        customDisplayName: trimmed.length > 0 ? trimmed : null,
      });
      toast.success("Display name updated.");
    } catch {
      toast.error("Failed to update display name.");
    } finally {
      setSaving(false);
    }
  }

  function handleClear() {
    setCustomName("");
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#0E3386]">Profile</h1>
        <p className="text-gray-500 mt-1">Manage your account settings.</p>
      </div>

      {/* Identity card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-5">
        {/* Avatar placeholder */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#0E3386] flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {effectiveName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{effectiveName}</p>
            <p className="text-sm text-gray-400">{currentUser?.email}</p>
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        {/* Custom display name */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            Custom Display Name
          </label>
          <p className="text-xs text-gray-400">
            Overrides your Google account name throughout the app. Leave blank
            to use your Google name (
            <span className="font-medium text-gray-500">
              {currentUser?.displayName}
            </span>
            ).
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={currentUser?.displayName ?? "Your name"}
              maxLength={40}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0E3386] placeholder-gray-300"
            />
            {customName.length > 0 && (
              <button
                onClick={handleClear}
                className="px-3 py-2 text-sm text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="self-start px-5 py-2 bg-[#0E3386] text-white rounded-lg text-sm font-medium hover:bg-[#0E3386]/90 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {saving ? "Saving..." : "Save Name"}
          </button>
        </div>

        <div className="h-px bg-gray-100" />

        {/* Account info */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700">Account</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Signed in with Google</span>
            {currentUser?.isAdmin && (
              <span className="px-2 py-0.5 bg-[#0E3386]/10 text-[#0E3386] text-xs font-semibold rounded-full">
                Admin
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
