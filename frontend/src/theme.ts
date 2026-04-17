export interface EraTheme {
  key: "ussr" | "romanovs" | "tsardom" | "rurikids";
  era: string;
  title: string;
  subtitle: string;
  crest: string;
  shellClass: string;
  accentClass: string;
  badgeClass: string;
  dividerClass: string;
  panelClass: string;
}

export const ERA_ORDER = ["СССР", "Романовы", "Московское царство", "Рюриковичи"];

export const ERA_THEMES: Record<string, EraTheme> = {
  СССР: {
    key: "ussr",
    era: "СССР",
    title: "Красный проект",
    subtitle: "Плакатная мощь, индустриальный ритм и государственный масштаб",
    crest: "★",
    shellClass: "theme-ussr",
    accentClass: "text-[var(--theme-accent)]",
    badgeClass: "border-[color:var(--theme-accent-soft)] bg-[var(--theme-badge)] text-[var(--theme-badge-text)]",
    dividerClass: "from-[var(--theme-accent-soft)] via-[var(--theme-accent)]/60 to-transparent",
    panelClass: "bg-[var(--theme-panel)]/88",
  },
  Романовы: {
    key: "romanovs",
    era: "Романовы",
    title: "Имперский зал",
    subtitle: "Чёрный лак, золото регалий и парадная дворцовая строгость",
    crest: "✦",
    shellClass: "theme-romanovs",
    accentClass: "text-[var(--theme-accent)]",
    badgeClass: "border-[color:var(--theme-accent-soft)] bg-[var(--theme-badge)] text-[var(--theme-badge-text)]",
    dividerClass: "from-[var(--theme-accent)]/70 via-[var(--theme-accent-2)]/50 to-transparent",
    panelClass: "bg-[var(--theme-panel)]/90",
  },
  "Московское царство": {
    key: "tsardom",
    era: "Московское царство",
    title: "Царские палаты",
    subtitle: "Тёплое дерево, медные отблески и густая древнерусская торжественность",
    crest: "✠",
    shellClass: "theme-tsardom",
    accentClass: "text-[var(--theme-accent)]",
    badgeClass: "border-[color:var(--theme-accent-soft)] bg-[var(--theme-badge)] text-[var(--theme-badge-text)]",
    dividerClass: "from-[var(--theme-accent)]/75 via-[var(--theme-accent-2)]/45 to-transparent",
    panelClass: "bg-[var(--theme-panel)]/92",
  },
  Рюриковичи: {
    key: "rurikids",
    era: "Рюриковичи",
    title: "Летописный стан",
    subtitle: "Знамёна, щиты, копоть костров и суровый блеск дружины",
    crest: "⛨",
    shellClass: "theme-rurikids",
    accentClass: "text-[var(--theme-accent)]",
    badgeClass: "border-[color:var(--theme-accent-soft)] bg-[var(--theme-badge)] text-[var(--theme-badge-text)]",
    dividerClass: "from-[var(--theme-accent-soft)] via-[var(--theme-accent)]/60 to-transparent",
    panelClass: "bg-[var(--theme-panel)]/88",
  },
};

export function getThemeByEra(era?: string | null): EraTheme {
  if (era && ERA_THEMES[era]) {
    return ERA_THEMES[era];
  }

  return ERA_THEMES["СССР"];
}
