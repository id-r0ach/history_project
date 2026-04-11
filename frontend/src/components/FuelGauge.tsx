import type { BalanceInfo, ServiceBalance } from "../types";

interface FuelGaugeProps {
  balance: BalanceInfo | null;
  isLoading: boolean;
  onOpenSettings: () => void;
}

function getLevel(pct: number): "critical" | "warning" | "ok" {
  if (pct < 10) return "critical";
  if (pct < 50) return "warning";
  return "ok";
}

const BAR_COLOR   = { critical: "bg-red-500",    warning: "bg-yellow-500",  ok: "bg-green-500" };
const TEXT_COLOR  = { critical: "text-red-400",  warning: "text-yellow-400", ok: "text-green-400" };

function MiniBar({ b, label }: { b: ServiceBalance; label: string }) {
  const pct   = Math.max(0, Math.min(100, b.percent));
  const level = getLevel(pct);
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[9px] font-body uppercase tracking-wider text-soviet-gray-light/70">
          {label}
        </span>
        <span className={`text-[9px] font-body font-semibold tabular-nums ${TEXT_COLOR[level]} ${level === "critical" ? "animate-pulse" : ""}`}>
          {b.current.toFixed(2)} ₽
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-soviet-dark overflow-hidden border border-soviet-gray/15">
        <div
          className={`h-full rounded-full transition-all duration-700 ${BAR_COLOR[level]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function FuelGauge({ balance, isLoading, onOpenSettings }: FuelGaugeProps) {
  return (
    <div className="px-4 py-3 border-t border-soviet-gray/20">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[9px] font-body tracking-widest uppercase text-soviet-gray-light/60">
          Топливо системы
        </span>
        <button
          onClick={onOpenSettings}
          title="Настройки"
          className="text-soviet-gray-light/50 hover:text-soviet-beige transition-colors duration-150 text-xs px-1"
        >
          ⚙︎
        </button>
      </div>

      {isLoading || !balance ? (
        <div className="space-y-2">
          <div className="h-1.5 rounded-full bg-soviet-dark-3 animate-pulse" />
          <div className="h-1.5 rounded-full bg-soviet-dark-3 animate-pulse" />
        </div>
      ) : (
        <div className="space-y-2">
          <MiniBar b={balance.llm} label="LLM" />
          <MiniBar b={balance.tts} label="TTS" />
        </div>
      )}
    </div>
  );
}
