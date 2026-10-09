import { createContext, useContext, useEffect, useState } from 'react';
import { TRANSLATIONS, Lang, TranslationKey } from './translations';

type Params = Record<string, string | number>;

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey, fallbackOrParams?: string | Params) => string;
}

const Ctx = createContext<LangCtx>({
  lang: 'az',
  setLang: () => {},
  t: (k) => k
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem('lang') as Lang | null;
    if (stored && ['az', 'ru', 'en'].includes(stored)) return stored;
    return 'az';
  });

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem('lang', lang);
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);

  const t = (key: TranslationKey, fallbackOrParams?: string | Params): string => {
    const fallback = typeof fallbackOrParams === 'string' ? fallbackOrParams : undefined;
    const params = typeof fallbackOrParams === 'object' ? fallbackOrParams : undefined;

    const dict = TRANSLATIONS[lang] as Record<string, string>;
    let text =
      dict[key] || (TRANSLATIONS.az as Record<string, string>)[key] || fallback || key;

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.split(`{{${k}}}`).join(String(v));
      }
    }
    return text;
  };

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
};

export const useLang = () => useContext(Ctx);