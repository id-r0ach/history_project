import { useEffect, useMemo, useState } from "react";

interface TalkingAvatarProps {
  characterId: string;
  characterName: string;
  isSpeaking: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASS = {
  sm: "h-14 w-14 text-lg",
  md: "h-20 w-20 text-2xl",
  lg: "h-28 w-28 text-4xl",
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

const AVATAR_EXTENSIONS = ["JPG", "jpg", "JPEG", "jpeg", "png", "PNG"];

function publicAsset(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  return `${normalizedBase}${path}`.replace(/([^:]\/)\/+/g, "$1");
}

function buildAvatarSources(characterId: string, state: "idle" | "speak"): string[] {
  return AVATAR_EXTENSIONS.map((ext) => publicAsset(`avatars/${characterId}_${state}.${ext}`));
}

export function TalkingAvatar({
  characterId,
  characterName,
  isSpeaking,
  size = "md",
  className = "",
}: TalkingAvatarProps) {
  const [idleIndex, setIdleIndex] = useState(0);
  const [speakIndex, setSpeakIndex] = useState(0);
  const [idleOk, setIdleOk] = useState(true);
  const [speakOk, setSpeakOk] = useState(true);
  const [frame, setFrame] = useState<"idle" | "speak">("idle");

  const idleSources = useMemo(() => buildAvatarSources(characterId, "idle"), [characterId]);
  const speakSources = useMemo(() => buildAvatarSources(characterId, "speak"), [characterId]);

  useEffect(() => {
    setIdleIndex(0);
    setSpeakIndex(0);
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
  const canRenderImages =
    Boolean(characterId) &&
    idleOk &&
    speakOk &&
    idleIndex < idleSources.length &&
    speakIndex < speakSources.length;

  const handleIdleError = () => {
    setIdleIndex((current) => {
      const next = current + 1;
      if (next >= idleSources.length) {
        setIdleOk(false);
        return current;
      }
      return next;
    });
  };

  const handleSpeakError = () => {
    setSpeakIndex((current) => {
      const next = current + 1;
      if (next >= speakSources.length) {
        setSpeakOk(false);
        return current;
      }
      return next;
    });
  };

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
        key={idleSources[idleIndex]}
        src={idleSources[idleIndex]}
        alt={characterName}
        draggable={false}
        onError={handleIdleError}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-75 ${
          frame === "idle" || !isSpeaking ? "opacity-100" : "opacity-0"
        }`}
      />
      <img
        key={speakSources[speakIndex]}
        src={speakSources[speakIndex]}
        alt={characterName}
        draggable={false}
        onError={handleSpeakError}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-75 ${
          frame === "speak" && isSpeaking ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
