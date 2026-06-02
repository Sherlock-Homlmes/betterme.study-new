import { createI18n } from "vue-i18n";
import { watch, type App } from "vue";
import { useAuthStore } from "@/stores/auth";

interface Language {
  name: string;
  iso: string;
}

declare type LanguageStore = Record<string, Language>;

export const languages: LanguageStore = {
  en: {
    name: "English",
    iso: "en-US",
  },
  vi: {
    name: "Tiếng Việt",
    iso: "vi-VI",
  },
};

const getClientLocale = (): string => {
  if (typeof navigator === "undefined") {
    return "en";
  }
  const navigatorLocale = navigator.language;

  const matchingIsoCodes = Object.keys(languages).filter(
    (key) => languages[key].iso.toLowerCase() === navigatorLocale.toLowerCase(),
  );
  if (matchingIsoCodes.length > 0) {
    return matchingIsoCodes[0];
  }

  const looselyMatchingLanguages = Object.keys(languages).filter((key) =>
    navigatorLocale.toLowerCase().startsWith(key),
  );
  if (looselyMatchingLanguages.length > 0) {
    return looselyMatchingLanguages[0];
  }

  return "en";
};

export default async function setupI18n(app: App) {
  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: "en",
    messages: {},
  });

  const changeLocaleDynamic = async (newLocale: string) => {
    if (!Object.keys(languages).includes(newLocale)) return;
    if (!i18n.global.availableLocales.includes(newLocale)) {
      const newLocaleMessages = await import(`@/i18n/${newLocale}.json`);
      i18n.global.setLocaleMessage(newLocale, newLocaleMessages.default);
    }
    i18n.global.locale.value = newLocale;
  };

  app.use(i18n);

  app.config.globalProperties.$setLocale = changeLocaleDynamic;
  app.config.globalProperties.$languages = (
    Object.keys(languages) as Array<keyof typeof languages>
  ).reduce(
    (prev, lang) => {
      prev[lang] = languages[lang].name;
      return prev;
    },
    {} as Record<keyof typeof languages, string>,
  );

  const { userSettings } = useAuthStore();

  if (userSettings.value.language === undefined) {
    userSettings.value.language = getClientLocale();
  }

  await changeLocaleDynamic(userSettings.value.language);

  watch(
    () => userSettings.value.language,
    (newValue) => {
      if (newValue) changeLocaleDynamic(newValue);
    },
  );
}