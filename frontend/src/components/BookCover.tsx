// Same logic as booksApi.ts: empty string in Docker means relative URL → nginx proxies /images/* to API.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5128";

type Props = {
  imagePath?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE: Record<NonNullable<Props["size"]>, string> = {
  sm: "w-12 h-16",
  md: "w-20 h-28",
  lg: "w-32 h-44",
};

export default function BookCover({ imagePath, size = "sm", className = "" }: Props) {
  const cls = `${SIZE[size]} rounded object-cover shrink-0 ${className}`;

  if (imagePath) {
    return (
      <img
        src={`${API_BASE}${imagePath}`}
        alt="Book cover"
        className={cls}
      />
    );
  }

  return (
    <div
      className={`${SIZE[size]} rounded shrink-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}
    >
      <span className="text-gray-400 dark:text-gray-500 text-xl font-bold select-none">?</span>
    </div>
  );
}
