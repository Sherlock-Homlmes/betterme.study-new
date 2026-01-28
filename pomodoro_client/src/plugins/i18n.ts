import { createI18n } from "vue-i18n";
import { watch, type App } from "vue";
import {useAuthStore } from "@/stores/auth";
import enMessages from "@/i18n/en.json";

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

  // match ISO first
  const matchingIsoCodes = Object.keys(languages).filter(
    (key) => languages[key].iso.toLowerCase() === navigatorLocale.toLowerCase(),
  );

  if (matchingIsoCodes.length > 0) {
    return matchingIsoCodes[0];
  }

  // then match on language keys
  const looselyMatchingLanguages = Object.keys(languages).filter((key) =>
    navigatorLocale.toLowerCase().startsWith(key),
  );

  if (looselyMatchingLanguages.length > 0) {
    return looselyMatchingLanguages[0];
  }

  return "en";
};

export default function setupI18n(app: App) {
  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: "en",
    messages: { en: enMessages }
  });

  const changeLocaleDynamic = async (newLocale: string) => {
    if (Object.keys(languages).includes(newLocale)) {
      if (!i18n.global.availableLocales.includes(newLocale)) {
        const newLocaleMessages = await import(`@/i18n/${newLocale}.json`);
        i18n.global.setLocaleMessage(newLocale, newLocaleMessages.default);
      }
      i18n.global.locale.value = newLocale;
    }
  };

  // Install i18n vào app
  app.use(i18n);

  // Đăng ký biến toàn cục (để dùng trong template hoặc script setup thông qua inject nếu cần)
  app.config.globalProperties.$setLocale = changeLocaleDynamic;
  app.config.globalProperties.$languages = (Object.keys(languages) as Array<keyof typeof languages>).reduce(
    (prev, lang) => {
      prev[lang] = languages[lang].name;
      return prev;
    },
    {} as Record<keyof typeof languages, string>,
  );

  // Logic đồng bộ với Store của VueUse
  // VueUse composable chạy tốt mà không cần inject pinia
  const installI18nPlugin = () => {
    const { userSettings } = useAuthStore(); // <--- Gọi thẳng như này

    // Khởi tạo ngôn ngữ nếu chưa có
    if (userSettings.value.language === undefined) {
      userSettings.value.language = getClientLocale();
    }

    // Load ngôn ngữ ban đầu
    changeLocaleDynamic(userSettings.value.language);

    // Watch thay đổi
    watch(
      () => userSettings.value.language,
      (newValue) => {
        if (newValue) changeLocaleDynamic(newValue);
      },
      { immediate: true },
    );
  };

  // Chạy logic khởi tạo
  installI18nPlugin();
}
