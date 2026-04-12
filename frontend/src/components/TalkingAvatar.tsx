/**
 * TalkingAvatar — анимированный аватар персонажа.
 *
 * Логика:
 *   - isSpeaking=false → показываем {id}_idle.png
 *   - isSpeaking=true  → циклично переключаем idle↔speak каждые 150мс
 *
 * Если картинки ещё не загружены (файлы не добавлены) —
 * показываем красивый fallback с инициалами, идентичный текущим аватарам.
 *
 * Картинки ищутся в /avatars/{id}_idle.png и /avatars/{id}_speak.png
 * (папка frontend/public/avatars/).
 */
import { useEffect, useRef, useState } from "react";

interface TalkingAvatarProps {
  characterId: string;
  characterName: string;
  isSpeaking: boolean;
  size?: "sm" | "md" | "lg";   // sm=32px, md=40px, lg=64px
  className?: string;
}

const SIZE_CLASS = {
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-16 h-16 text-2xl",
};

const INITIALS: Record<string, string> = {
  rurik: "Р", vladimir: "Вл", yaroslav: "Я",
  ivan3: "И³", ivan4: "И⁴",
  peter1: "П", catherine2: "Е", nicholas2: "Н",
  lenin: "Л", stalin: "С", khrushchev: "Х",
  brezhnev: "Б", gorbachev: "Г",
};

function avatarPath(id: string, state: "idle" | "speak"): string {
  return `/avatars/${id}_${state}.png`;
}

export function TalkingAvatar({
  characterId,
  characterName,
  isSpeaking,
  size = "md",
  className = "",
}: TalkingAvatarProps) {
  const [frame, setFrame]       = useState<"idle" | "speak">("idle");
  const [hasImage, setHasImage] = useState<boolean | null>(null); // null=загружаем
  const intervalRef             = useRef<ReturnType<typeof setInterval> | null>(null);

  // Проверяем наличие картинки один раз при монтировании
  useEffect(() => {
    const img = new Image();
    img.onload  = () => setHasImage(true);
    img.onerror = () => setHasImage(false);
    img.src = avatarPath(characterId, "idle");
  }, [characterId]);

  // Анимация: запускаем интервал когда говорит, останавливаем когда нет
  useEffect(() => {
    if (isSpeaking && hasImage) {
      intervalRef.current = setInterval(() => {
        setFrame(f => f === "idle" ? "speak" : "idle");
      }, 160); // 160мс — ~6 кадров в секунду, органично
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setFrame("idle");
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSpeaking, hasImage]);

  const sizeClass = SIZE_CLASS[size];
  const initial   = INITIALS[characterId] ?? characterName[0];

  // Fallback — инициалы (пока нет картинок)
  if (hasImage === false || hasImage === null) {
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

  // Аватар с картинкой
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
