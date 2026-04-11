import { useState, useEffect } from "react";
import type { BalanceInfo } from "../types";
import { apiClient } from "../services/api";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: BalanceInfo | null;
  onBalanceUpdate: (b: BalanceInfo) => void;
}

export function SettingsModal({ isOpen, onClose, balance, onBalanceUpdate }: SettingsModalProps) {
  const [llmCurrent, setLlmCurrent] = useState("");
  const [llmInitial, setLlmInitial] = useState("");
  const [ttsCurrent, setTtsCurrent] = useState("");
  const [ttsInitial, setTtsInitial] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Заполняем поля текущими значениями при открытии
  useEffect(() => {
    if (isOpen && balance) {
      setLlmCurrent(balance.llm.current.toFixed(2));
      setLlmInitial(balance.llm.initial.toFixed(2));
      setTtsCurrent(balance.tts.current.toFixed(2));
      setTtsInitial(balance.tts.initial.toFixed(2));
    }
  }, [isOpen, balance]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await apiClient.updateBalanceSettings({
        llm_current: parseFloat(llmCurrent) || undefined,
        llm_initial: parseFloat(llmInitial) || undefined,
        tts_current: parseFloat(ttsCurrent) || undefined,
        tts_initial: parseFloat(ttsInitial) || undefined,
      });
      onBalanceUpdate(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-soviet-dark border border-soviet-gray/30 rounded-2xl w-full max-w-md mx-4 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-soviet-gray/20">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-soviet-red/20 border border-soviet-red/30 rounded-lg flex items-center justify-center">
              <span className="text-soviet-red-light text-sm">⚙</span>
            </div>
            <h2 className="font-display text-soviet-cream font-semibold text-base">
              Настройки системы
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-soviet-gray-light hover:text-soviet-beige transition-colors text-lg w-7 h-7 flex items-center justify-center rounded-lg hover:bg-soviet-dark-3"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-6 overflow-y-auto max-h-[70vh]">

          {/* LLM секция */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <h3 className="text-soviet-cream font-body font-semibold text-sm">
                RouterAI — языковая модель
              </h3>
            </div>
            <div className="bg-soviet-dark-3 border border-soviet-gray/20 rounded-xl px-4 py-3 mb-3">
              <p className="text-soviet-gray-light text-xs font-body">
                Модель: <span className="text-soviet-beige">qwen/qwen3-max</span>
              </p>
              <p className="text-soviet-gray-light text-xs font-body mt-1">
                Тариф: <span className="text-soviet-beige">230 ₽ / 1М вх. токенов · 1152 ₽ / 1М исх. токенов</span>
              </p>
              {balance && (
                <p className="text-soviet-gray-light text-xs font-body mt-1">
                  Запросов: <span className="text-soviet-beige">{balance.llm.requests}</span>
                  {" · "}Потрачено: <span className="text-soviet-beige">{balance.llm.spent.toFixed(4)} ₽</span>
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[10px] font-body text-soviet-gray-light uppercase tracking-wider mb-1 block">
                  Текущий остаток (₽)
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={llmCurrent}
                  onChange={e => setLlmCurrent(e.target.value)}
                  className="w-full bg-soviet-dark border border-soviet-gray/30 rounded-lg px-3 py-2 text-soviet-cream text-sm font-body
                    focus:outline-none focus:border-soviet-red/40 transition-colors"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-body text-soviet-gray-light uppercase tracking-wider mb-1 block">
                  Начальный депозит (₽)
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={llmInitial}
                  onChange={e => setLlmInitial(e.target.value)}
                  className="w-full bg-soviet-dark border border-soviet-gray/30 rounded-lg px-3 py-2 text-soviet-cream text-sm font-body
                    focus:outline-none focus:border-soviet-red/40 transition-colors"
                />
              </label>
            </div>
          </section>

          <div className="border-t border-soviet-gray/15" />

          {/* TTS секция */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <h3 className="text-soviet-cream font-body font-semibold text-sm">
                Yandex SpeechKit — синтез речи
              </h3>
            </div>
            <div className="bg-soviet-dark-3 border border-soviet-gray/20 rounded-xl px-4 py-3 mb-3">
              <p className="text-soviet-gray-light text-xs font-body">
                Голоса: <span className="text-soviet-beige">ermil · filipp · madirus · alena</span>
              </p>
              <p className="text-soviet-gray-light text-xs font-body mt-1">
                Тариф: <span className="text-soviet-beige">180 ₽ / 1М символов</span>
              </p>
              {balance && (
                <p className="text-soviet-gray-light text-xs font-body mt-1">
                  Запросов: <span className="text-soviet-beige">{balance.tts.requests}</span>
                  {" · "}Потрачено: <span className="text-soviet-beige">{balance.tts.spent.toFixed(4)} ₽</span>
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[10px] font-body text-soviet-gray-light uppercase tracking-wider mb-1 block">
                  Текущий остаток (₽)
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={ttsCurrent}
                  onChange={e => setTtsCurrent(e.target.value)}
                  className="w-full bg-soviet-dark border border-soviet-gray/30 rounded-lg px-3 py-2 text-soviet-cream text-sm font-body
                    focus:outline-none focus:border-soviet-red/40 transition-colors"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-body text-soviet-gray-light uppercase tracking-wider mb-1 block">
                  Начальный депозит (₽)
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={ttsInitial}
                  onChange={e => setTtsInitial(e.target.value)}
                  className="w-full bg-soviet-dark border border-soviet-gray/30 rounded-lg px-3 py-2 text-soviet-cream text-sm font-body
                    focus:outline-none focus:border-soviet-red/40 transition-colors"
                />
              </label>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-soviet-gray/20 flex items-center justify-between">
          <p className="text-[10px] font-body text-soviet-gray-light/50 italic">
            Изменения сохраняются на сервере
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-body text-soviet-gray-light
                border border-soviet-gray/20 hover:bg-soviet-dark-3 transition-all"
            >
              Закрыть
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className={`px-4 py-2 rounded-lg text-sm font-body font-medium transition-all
                ${saved
                  ? "bg-green-600 text-white border border-green-500"
                  : "bg-soviet-red hover:bg-soviet-red-bright text-white shadow-lg shadow-soviet-red/20"
                }
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {saving ? "Сохраняю…" : saved ? "✓ Сохранено" : "Сохранить"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
