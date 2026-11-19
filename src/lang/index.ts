import type { AppLanguage } from "../types/profile";
import { en } from "./en";
import { ru, type TranslationKey } from "./ru";

export type { TranslationKey };

export function translate(language: AppLanguage, key: TranslationKey): string {
  return language === "en" ? en[key] : ru[key];
}
