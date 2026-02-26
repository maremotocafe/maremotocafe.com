import { useRef, useEffect } from "react";

interface FilterOption {
  value: string;
  label: string;
  icon?: string;
  color?: string;
}

interface MenuFilterBarProps {
  level: number;
  message: string;
  options: FilterOption[];
  activeValue: string;
  visible: boolean;
  resetOption?: FilterOption;
  onSelect: (value: string) => void;
}

export default function MenuFilterBar({
  level,
  message,
  options,
  activeValue,
  visible,
  resetOption,
  onSelect,
}: MenuFilterBarProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Auto-scroll to this bar when it becomes visible (levels 2+)
  useEffect(() => {
    if (visible && level > 1 && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [visible, level]);

  // Colorize the first word of the message
  const words = message.split(" ");
  const firstWord = words[0];
  const restWords = words.slice(1).join(" ");

  return (
    <div
      ref={ref}
      className="overflow-hidden transition-all duration-300 ease-out"
      style={{
        maxHeight: visible ? "200px" : "0",
        opacity: visible ? 1 : 0,
        marginBottom: visible ? "1rem" : "0",
      }}
    >
      <h3 className="mb-3 text-center text-base font-normal italic">
        <span className="font-semibold text-accent">{firstWord}</span>{" "}
        {restWords}
      </h3>

      <div className="flex flex-wrap justify-center gap-2">
        {/* Reset/"Todo" button (shown on levels 2+) */}
        {resetOption && (
          <button
            onClick={() => onSelect(resetOption.value)}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.97]"
            style={{
              backgroundColor:
                activeValue === resetOption.value
                  ? resetOption.color
                  : `${resetOption.color}66`,
              color: activeValue === resetOption.value ? "#2e343b" : "#c4cdd5",
            }}
          >
            {resetOption.icon && <i className={resetOption.icon} />}
            <span>Todo</span>
          </button>
        )}

        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.97]"
            style={{
              backgroundColor:
                activeValue === opt.value ? opt.color : `${opt.color}66`,
              color: activeValue === opt.value ? "#2e343b" : "#c4cdd5",
            }}
          >
            {opt.icon && <i className={opt.icon} />}
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
