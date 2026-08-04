import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import zhCN from './locales/zh-CN.json'
import en from './locales/en.json'

// 中文优先（简体），英文次之；架构预留马来文——加一个 locales/ms.json + resources 条目即可
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': { translation: zhCN },
      en: { translation: en },
    },
    fallbackLng: 'zh-CN',
    supportedLngs: ['zh-CN', 'en'],
    interpolation: { escapeValue: false },
  })

export default i18n
