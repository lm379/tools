import { cn } from "@/lib/utils";

interface TabItem<T extends string> {
  value: T;
  label: string;
}

interface TabGroupProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function TabGroup<T extends string>({
  items,
  value,
  onChange,
  className,
}: TabGroupProps<T>) {
  return (
    <div className={cn("flex gap-2 bg-muted/30 p-1.5 rounded-xl border border-border/50 backdrop-blur-sm overflow-x-auto", className)}>
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            "flex-1 min-w-[120px] py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 capitalize whitespace-nowrap",
            value === item.value
              ? "bg-primary text-primary-foreground shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:scale-[1.02] hover:bg-primary/90 active:scale-[0.98]"
              : "text-muted-foreground hover:text-foreground hover:bg-background/40"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
