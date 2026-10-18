// i18next setup. Keys mirror design/ui_kits/identity/strings.js; placeholders use single braces ({email}).
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import bg from "@/locales/bg.json";

void i18n.use(initReactI18next).init({
  resources: { bg: { translation: bg } },
  lng: "bg",
  fallbackLng: "bg",
  interpolation: { escapeValue: false, prefix: "{", suffix: "}" },
  returnNull: false,
});

export default i18n;
