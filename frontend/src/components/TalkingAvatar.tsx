/**
 * TalkingAvatar - animated character avatar.
 *
 * Logic:
 *   - isSpeaking=false -> show {id}_idle.png
 *   - isSpeaking=true  -> rapidly switch idle <-> speak
 *
 * If the avatar frames are missing, show a fallback with initials.
 * Images are loaded from frontend/public/avatars/.
 */
import { useEffect, useRef, useState } from "react";

interface TalkingAvatarProps {
  characterId: string;
  characterName: string;
  isSpeaking: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASS = {
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-16 h-16 text-2xl",
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

const AVATAR_BASE = `${import.meta.env.BASE_URL}avatars/`.replace(/([^:]\/)\/+/g, "$1");

function avatarPath(id: string, state: "idle" | "speak"): string {
  return `${AVATAR_BASE}${id}_${state}.png`;
}

export function TalkingAvatar({
  characterId,
  characterName,
  isSpeaking,
  size = "md",
  className = "",
}: TalkingAvatarProps) {
  const [frame, setFrame] = useState<"idle" | "speak">("idle");
  const [hasImage, setHasImage] = useState<boolean | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    setHasImage(null);
    setFrame("idle");

    const preload = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load ${src}`));
        img.src = src;
      });

    void Promise.all([
      preload(avatarPath(characterId, "idle")),
      preload(avatarPath(characterId, "speak")),
    ])
      .then(() => {
        if (!cancelled) {
          setHasImage(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasImage(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [characterId]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isSpeaking && hasImage) {
      intervalRef.current = setInterval(() => {
        setFrame((current) => (current === "idle" ? "speak" : "idle"));
      }, 160);
    } else {
      setFrame("idle");
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isSpeaking, hasImage]);

  const sizeClass = SIZE_CLASS[size];
  const initial = INITIALS[characterId] ?? characterName[0] ?? "?";

  if (hasImage !== true) {
    return (
      <div
        className={`
          ${sizeClass} rounded-full shrink-0
          bg-soviet-dark-3 border-2 border-soviet-red/40
          flex items-center justify-center
          ${isSpeaking ? "border-soviet-red animate-pulse" : ""}
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
        ${sizeClass} rounded-full shrink-0 overflow-hidden
        border-2 transition-all duration-100
        ${isSpeaking ? "border-soviet-red shadow-lg shadow-soviet-red/30" : "border-soviet-red/40"}
        ${className}
      `}
    >
      <img
        src={avatarPath(characterId, frame)}
        alt={characterName}
        className="w-full h-full object-cover"
        draggable={false}
      />
    </div>
  );
}
