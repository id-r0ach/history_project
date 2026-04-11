import type { BalanceInfo } from "../types";

interface FuelGaugeProps {
  balance: BalanceInfo | null;
  isLoading: boolean;
}

function getLevel(percent: number): "critical" | "warning" | "ok" {
  if (percent < 10) return "critical";
  if (percent < 50) return "warning";
  return "ok";
}

function getLevelLabel(percent: number): string {
  if (percent < 10) return "Критический уровень";
  if (percent < 50) return "Требуется пополнение";
  return "Система готова";
}

export function FuelGauge({ balance, isLoading }: FuelGaugeProps) {
  if (isLoading || !balance) {
    return (
      <div className="px-5 py-4 border-t border-soviet-gray/20">
        <div className="h-3 rounded-full bg-soviet-dark-3 animate-pulse" />
      </div>
    );
  }

  const percent = Math.max(0, Math.min(100, balance.percent));
  const level = getLevel(percent);

  const barColor =
    level === "critical" ? "bg-red-500" :
    level === "warning"  ? "bg-yellow-500" :
                           "bg-green-500";

  const textColor =
    level === "critical" ? "text-red-400" :
    level === "warning"  ? "text-yellow-400" :
                           "text-green-400";

  const glowColor =
    level === "critical" ? "shadow-red-500/50" :
    level === "warning"  ? "shadow-yellow-500/30" :
                           "shadow-green-500/30";

  return (
    <div className="px-5 py-4 border-t border-soviet-gray/20">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-body tracking-widest uppercase text-soviet-gray-light">
          Топливо системы
        </span>
        <span className={`text-[10px] font-body font-semibold ${textColor} ${level === "critical" ? "animate-pulse" : ""}`}>
          {percent.toFixed(1)}%
        </span>
      </div>

      {/* Прогресс-бар */}
      <div className="relative h-2.5 rounded-full bg-soviet-dark overflow-hidden border border-soviet-gray/20">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor} shadow-sm ${glowColor}`}
          style={{ width: `${percent}%` }}
        />
        {/* Засечки */}
        {[25, 50, 75].map((mark) => (
          <div
            key={mark}
            className="absolute top-0 bottom-0 w-px bg-soviet-dark/60"
            style={{ left: `${mark}%` }}
          />
        ))}
      </div>

      {/* Статус + сумма */}
      <div className="flex items-center justify-between mt-1.5">
        <span className={`text-[10px] font-body italic ${textColor} ${level === "critical" ? "animate-pulse" : ""}`}>
          {getLevelLabel(percent)}
        </span>
        <span className="text-[10px] font-body text-soviet-gray-light tabular-nums">
          {balance.current.toFixed(2)} ₽
        </span>
      </div>

      {/* Детали — видны при наведении */}
      <div className="mt-1.5 text-[9px] font-body text-soviet-gray-light/50 flex justify-between">
        <span>Запросов: {balance.requests}</span>
        <span>Потрачено: {balance.spent.toFixed(2)} ₽</span>
      </div>
    </div>
  );
}
