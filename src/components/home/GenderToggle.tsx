"use client";

type Gender = "female" | "male";

interface GenderToggleProps {
  value: Gender;
  onChange: (gender: Gender) => void;
}

export function GenderToggle({ value, onChange }: GenderToggleProps) {
  return (
    <div className="flex rounded-full border p-1 gap-1 bg-background shadow-sm">
      <button
        type="button"
        onClick={() => onChange("female")}
        className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
          value === "female"
            ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-pressed={value === "female"}
      >
        {/* Venus symbol */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="9" r="5" />
          <line x1="12" y1="14" x2="12" y2="22" />
          <line x1="9" y1="19" x2="15" y2="19" />
        </svg>
        Frau
      </button>
      <button
        type="button"
        onClick={() => onChange("male")}
        className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
          value === "male"
            ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-pressed={value === "male"}
      >
        {/* Mars symbol */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="10" cy="14" r="5" />
          <line x1="21" y1="3" x2="15" y2="9" />
          <polyline points="16 3 21 3 21 8" />
        </svg>
        Mann
      </button>
    </div>
  );
}
