import { useEffect, useMemo, useState } from "react";

interface TalkingAvatarProps {
  characterId: string;
  characterName: string;
  isSpeaking: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASS = {
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-16 w-16 text-2xl",
};

const INITIALS: Record<string, string> = {
  rurik: "Р",
  vladimir: "Вл",
  yaroslav: "Я",
  ivan3: "ИIII",
  ivan4: "ИIV",
  peter1: "П",
  catherine2: "Е",
  nicholas2: "Н",
  lenin: "Л",
  stalin: "С",
  khrushchev: "Х",
  brezhnev: "Б",
  gorbachev: "Г",
};

function publicAsset(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  return `${normalizedBase}${path}`.replace(/([^:]\/)\/+/g, "$1");
}

export function TalkingAvatar({
  characterId,
  characterName,
  isSpeaking,
  size = "md",
  className = "",
}: TalkingAvatarProps) {
  const [idleOk, setIdleOk] = useState(true);
  const [speakOk, setSpeakOk] = useState(true);
  const [frame, setFrame] = useState<"idle" | "speak">("idle");

  const idleSrc = useMemo(() => publicAsset(`avatars/${characterId}_idle.png`), [characterId]);
  const speakSrc = useMemo(() => publicAsset(`avatars/${characterId}_speak.png`), [characterId]);

  useEffect(() => {
    setIdleOk(true);
    setSpeakOk(true);
    setFrame("idle");
  }, [characterId]);

  useEffect(() => {
    if (!isSpeaking || !idleOk || !speakOk) {
      setFrame("idle");
      return;
    }

    const timer = setInterval(() => {
      setFrame((current) => (current === "idle" ? "speak" : "idle"));
    }, 140);

    return () => clearInterval(timer);
  }, [idleOk, isSpeaking, speakOk]);

  const sizeClass = SIZE_CLASS[size];
  const initial = INITIALS[characterId] ?? characterName[0] ?? "?";
  const canRenderImages = Boolean(characterId) && idleOk && speakOk;

  if (!canRenderImages) {
    return (
      <div
        className={`
          ${sizeClass} flex shrink-0 items-center justify-center rounded-full
          border-2 border-soviet-red/40 bg-soviet-dark-3
          ${isSpeaking ? "animate-pulse border-soviet-red" : ""}
          ${className}
        `}
      >
        <span className="font-display font-bold text-soviet-beige">
          {initial}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`
        ${sizeClass} relative shrink-0 overflow-hidden rounded-full border-2 transition-all duration-100
        ${isSpeaking ? "border-soviet-red shadow-lg shadow-soviet-red/30" : "border-soviet-red/40"}
        ${className}
      `}
    >
      <img
        src={idleSrc}
        alt={characterName}
        draggable={false}
        onError={() => setIdleOk(false)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-75 ${
          frame === "idle" || !isSpeaking ? "opacity-100" : "opacity-0"
        }`}
      />
      <img
        src={speakSrc}
        alt={characterName}
        draggable={false}
        onError={() => setSpeakOk(false)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-75 ${
          frame === "speak" && isSpeaking ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
