import { METHOD_LABEL } from "../../constants";
import { type ReaderInfo } from "../../types";
import { ABANDONED } from "../../constants";

const STATUS_STYLE: Record<string, string> = {
  reading: "bg-blue-100 text-blue-800",
  finished: "bg-green-100 text-green-800",
  abandoned: "bg-gray-100 text-gray-500 line-through",
};

interface ReaderBadgeProps {
  reader: ReaderInfo;
}

export default function ReaderBadge({ reader }: ReaderBadgeProps) {
  const statusStyle =
    STATUS_STYLE[reader.status] ?? "bg-gray-100 text-gray-600";
  const methodLabel = reader.readingMethod
    ? METHOD_LABEL[reader.readingMethod]
    : null;

  return (
    <div
      className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-sm ${statusStyle}`}
    >
      <span className="font-medium">
        {reader.status === ABANDONED ? (
          <s>{reader.displayName}</s>
        ) : (
          reader.displayName
        )}
      </span>
      {methodLabel && (
        <span className="text-xs ml-2 opacity-75">{methodLabel}</span>
      )}
    </div>
  );
}
