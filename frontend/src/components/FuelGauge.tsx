import type { BalanceInfo, ServiceBalance } from "../types";

interface FuelGaugeProps {
  balance: BalanceInfo | null;
  isLoading: boolean;
  onOpenSettings: () => void;
}

function getLevel(percent: number): "critical" | "warning" | "ok" {
  if (percent < 10) return "critical";
  if (percent < 50) return "warning";
  return "ok";
}

const BAR_COLOR = {
  critical: "bg-red-500",
  warning: "bg-yellow-500",
  ok: "bg-green-500",
};

const TEXT_COLOR = {
  critical: "text-red-400",
  warning: "text-yellow-400",
  ok: "text-green-400",
};

function MiniBar({ balance, label }: { balance: ServiceBalance; label: string }) {
  const percent = Math.max(0, Math.min(100, balance.percent));
  const level = getLevel(percent);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--theme-muted)]">{label}</span>
        <span className={`text-[10px] font-semibold tabular-nums ${TEXT_COLOR[level]} ${level === "critical" ? "animate-pulse" : ""}`}>
          {balance.current.toFixed(2)} ₽
        </span>
      </div>

      <div className="h-2 rounded-full border border-white/10 bg-black/20">
        <div className={`h-full rounded-full transition-all duration-700 ${BAR_COLOR[level]}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function FuelGauge({ balance, isLoading, onOpenSettings }: FuelGaugeProps) {
  return (
    <div className="border-t border-white/10 px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.28em] text-[var(--theme-muted)]">Топливо системы</span>
        <button
          onClick={onOpenSettings}
          title="Настройки"
          className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-[var(--theme-text-soft)] transition-colors hover:text-[var(--theme-text)]"
        >
          ⚙
        </button>
      </div>

      {isLoading || !balance ? (
        <div className="space-y-2">
          <div className="h-2 animate-pulse rounded-full bg-white/[0.06]" />
          <div className="h-2 animate-pulse rounded-full bg-white/[0.06]" />
        </div>
      ) : (
        <div className="space-y-3">
          <MiniBar balance={balance.llm} label="LLM" />
          <MiniBar balance={balance.tts} label="TTS" />
        </div>
      )}
    </div>
  );
}
