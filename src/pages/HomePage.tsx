import { AT_BAT, IN_THE_HOLE, ON_DECK } from "../constants";

import AdminControls from "../components/admin/AdminControls";
import BaseballSlot from "../components/home/BaseballSlot";
import { useAuth } from "../context/AuthContext";
import { useLineup } from "../hooks/useLineup";

export default function HomePage() {
  const { atBat, onDeck, inTheHole, loading } = useLineup();
  const { currentUser } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="text-[#0E3386] text-lg animate-pulse">
          Loading lineup...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#0E3386]">Current Lineup</h1>
        <p className="text-gray-500 mt-1">The club's reading schedule</p>
      </div>

      {/* Lineup slots */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        <BaseballSlot slot={AT_BAT} data={atBat} />
        <BaseballSlot slot={ON_DECK} data={onDeck} />
        <BaseballSlot slot={IN_THE_HOLE} data={inTheHole} />
      </div>

      {/* Admin controls */}
      {currentUser?.isAdmin && (
        <div className="max-w-sm">
          <AdminControls atBat={atBat} onDeck={onDeck} inTheHole={inTheHole} />
        </div>
      )}
    </div>
  );
}
