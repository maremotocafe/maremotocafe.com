interface FilterOption {
  value: string;
  label: string;
  icon?: string;
  color?: string;
}

interface MenuFilterBarProps {
  message: string;
  options: FilterOption[];
  activeValue: string;
  visible: boolean;
  resetOption?: FilterOption;
  onSelect: (value: string) => void;
}

export default function MenuFilterBar({
  message,
  options,
  activeValue,
  visible,
  resetOption,
  onSelect,
}: MenuFilterBarProps) {
  if (!visible) return null;

  // Colorize the first word of the message
  const words = message.split(" ");
  const firstWord = words[0];
  const restWords = words.slice(1).join(" ");

  return (
    <div className="animate-fade-in mb-4">
      <h3 className="mb-4 text-center text-2xl font-bold">
        <span className="text-accent">{firstWord}</span>{" "}
        {restWords}
      </h3>

      <div className="flex flex-wrap justify-center gap-3">
        {/* Reset/"Todo" button */}
        {resetOption && (
          <button
            onClick={() => onSelect(resetOption.value)}
            className="flex items-center gap-2 rounded-lg border-2 px-5 py-2.5 text-sm font-normal transition-[border-color,transform] duration-150 active:scale-[0.97]"
            style={{
              backgroundColor: resetOption.color,
              color: "#2e343b",
              borderColor: activeValue === resetOption.value ? "#ffffff" : "transparent",
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
            className="flex items-center gap-2 rounded-lg border-2 px-5 py-2.5 text-sm font-normal transition-[border-color,transform] duration-150 active:scale-[0.97]"
            style={{
              backgroundColor: opt.color,
              color: "#2e343b",
              borderColor: activeValue === opt.value ? "#ffffff" : "transparent",
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
