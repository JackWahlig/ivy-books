import { useState } from "react";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASS = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

export default function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const display = hovered ?? value;
  const sizeClass = SIZE_CLASS[size];

  // Each star is split into two halves — left half = .5, right half = full
  function getValueForPosition(
    starIndex: number,
    isRightHalf: boolean,
  ): number {
    return isRightHalf ? starIndex : starIndex - 0.5;
  }

  function isFilled(starIndex: number): "full" | "half" | "empty" {
    if (display >= starIndex) return "full";
    if (display >= starIndex - 0.5) return "half";
    return "empty";
  }

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = isFilled(star);
        return (
          <div
            key={star}
            className={`relative ${sizeClass} ${!readonly ? "cursor-pointer" : ""}`}
            onMouseLeave={() => !readonly && setHovered(null)}
          >
            {/* Background (empty) star */}
            <svg
              viewBox="0 0 24 24"
              className={`absolute inset-0 ${sizeClass} text-gray-200`}
              fill="currentColor"
            >
              <path d={STAR_PATH} />
            </svg>

            {/* Filled portion */}
            {fill !== "empty" && (
              <svg
                viewBox="0 0 24 24"
                className={`absolute inset-0 ${sizeClass} text-[#C4A35A]`}
                fill="currentColor"
                style={
                  fill === "half" ? { clipPath: "inset(0 50% 0 0)" } : undefined
                }
              >
                <path d={STAR_PATH} />
              </svg>
            )}

            {/* Two invisible halves for hover/click detection */}
            {!readonly && (
              <>
                <div
                  className="absolute inset-y-0 left-0 w-1/2"
                  onMouseEnter={() =>
                    setHovered(getValueForPosition(star, false))
                  }
                  onClick={() => onChange?.(getValueForPosition(star, false))}
                />
                <div
                  className="absolute inset-y-0 right-0 w-1/2"
                  onMouseEnter={() =>
                    setHovered(getValueForPosition(star, true))
                  }
                  onClick={() => onChange?.(getValueForPosition(star, true))}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
