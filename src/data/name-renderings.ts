/**
 * The name as it cycles during the opening sequence.
 *
 * Transliterations, not translations: a name does not change meaning between
 * scripts, it changes letters. Only the given name is rendered in other
 * scripts, because "Sai" and "Krishna" are standard enough to write with
 * confidence while "Tammali" is not, and a surname spelled wrong in someone's
 * own script is worse than a surname left in Latin. The full name is what the
 * sequence resolves to.
 *
 * If any rendering here is wrong, fix it in this list; nothing else needs to
 * change. Scripts are ordered to open close to home and travel outward.
 */
export interface NameRendering {
  /** BCP 47 tag, so the browser picks the right font and screen readers the
   *  right voice. */
  lang: string;
  text: string;
  /** Script name, used only as a React key. */
  script: string;
}

export const nameRenderings: NameRendering[] = [
  { script: "latin", lang: "en", text: "Sai Krishna" },
  { script: "telugu", lang: "te", text: "సాయి కృష్ణ" },
  { script: "devanagari", lang: "hi", text: "साई कृष्ण" },
  { script: "kannada", lang: "kn", text: "ಸಾಯಿ ಕೃಷ್ಣ" },
  { script: "tamil", lang: "ta", text: "சாய் கிருஷ்ணா" },
  { script: "malayalam", lang: "ml", text: "സായി കൃഷ്ണ" },
  { script: "bengali", lang: "bn", text: "সাই কৃষ্ণ" },
  { script: "gujarati", lang: "gu", text: "સાઈ કૃષ્ણ" },
  { script: "japanese", lang: "ja", text: "サイ・クリシュナ" },
  { script: "korean", lang: "ko", text: "사이 크리슈나" },
  { script: "cyrillic", lang: "ru", text: "Саи Кришна" },
  { script: "arabic", lang: "ar", text: "ساي كريشنا" },
  { script: "greek", lang: "el", text: "Σάι Κρίσνα" },
];
