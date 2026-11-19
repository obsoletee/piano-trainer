import { useCallback } from "react";
import { translate, type TranslationKey } from "../lang";
import { useAppLanguage } from "./useAppLanguage";

export function useTranslation() {
  const language = useAppLanguage();
  const t = useCallback((key: TranslationKey) => translate(language, key), [language]);
  return { language, t };
}
