import { formatExtensionTitle } from "./capitalize-word-initials.mjs";

export const CANONICAL_EXT_NAME =
  "YouTube™ Playback Speed Premium11: Faster Videos, Custom Speed Control";

export const CANONICAL_EXT_DESCRIPTION =
  "Adds quick playback speed, seek, quality, captions, and style controls to the YouTube player.";

/** Localized Chrome Web Store titles (max 75 characters). Always use YouTube™. */
export const LOCALIZED_EXT_NAMES = {
  am: "YouTube™ Playback Speed Premium11: ፈጣን ቪዲዮ፣ ብጁ ፍጥነት",
  ar: "YouTube™ Playback Speed Premium11: فيديو أسرع وتحكم مخصص بالسرعة",
  bg: "YouTube™ Playback Speed Premium11: По-Бързи Видеа, Контрол На Скоростта",
  bn: "YouTube™ Playback Speed Premium11: দ্রুত ভিডিও, কাস্টম স্পিড",
  ca: "YouTube™ Playback Speed Premium11: Vídeos Més Ràpids, Velocitat A Mida",
  cs: "YouTube™ Playback Speed Premium11: Rychlejší Videa, Vlastní Rychlost",
  da: "YouTube™ Playback Speed Premium11: Hurtigere Videoer, Tilpasset Hastighed",
  de: "YouTube™ Playback Speed Premium11: Schnellere Videos, Tempo Anpassen",
  el: "YouTube™ Playback Speed Premium11: Γρηγορότερα Βίντεο, Έλεγχος Ταχύτητας",
  en_AU: "YouTube™ Playback Speed Premium11: Faster Videos, Custom Speed Control",
  en_GB: "YouTube™ Playback Speed Premium11: Faster Videos, Custom Speed Control",
  en_US: "YouTube™ Playback Speed Premium11: Faster Videos, Custom Speed Control",
  es: "YouTube™ Playback Speed Premium11: Videos Más Rápidos, Velocidad A Medida",
  es_419: "YouTube™ Playback Speed Premium11: Videos Más Rápidos, Velocidad A Medida",
  et: "YouTube™ Playback Speed Premium11: Kiiremad Videod, Kohandatud Kiirus",
  fa: "YouTube™ Playback Speed Premium11: ویدیوی سریع‌تر، کنترل سرعت سفارشی",
  fi: "YouTube™ Playback Speed Premium11: Nopeammat Videot, Mukautettu Nopeus"
};

export function resolveExtName(locale) {
  const raw = LOCALIZED_EXT_NAMES[locale] ?? CANONICAL_EXT_NAME;
  return formatExtensionTitle(locale, raw);
}

for (const [locale, name] of Object.entries({ en: CANONICAL_EXT_NAME, ...LOCALIZED_EXT_NAMES })) {
  if (name.length > 75) {
    throw new Error(`manifest-store-copy: [${locale}] extName exceeds 75 (${name.length}).`);
  }
}

if (CANONICAL_EXT_DESCRIPTION.length > 132) {
  throw new Error(
    `manifest-store-copy: canonical extDescription exceeds 132 (${CANONICAL_EXT_DESCRIPTION.length}).`
  );
}
