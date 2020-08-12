import LanguageDetector from 'i18next-browser-languagedetector';
import fallbackLanguageData from './locales/en.json';

const languageDetector = new LanguageDetector();
languageDetector.init();

const allLanguages = [
  {
    lng: 'zh-CN',
    label: '简体中文',
    data: 'zh-CN.json',
  },
];

export const languages = [{ lng: 'en', label: 'English', data: 'en.json' }]
  .concat(allLanguages)
  .sort((left, right) => (left.label > right.label ? 1 : -1));

let currentLng = languages[0];
const fallbackLng = languages[0];
let currentLanguageData = {};

export const setLanguage = (newLng?: string) => {
  currentLng =
    languages.find(language => language.lng === newLng) || fallbackLng;
  return new Promise(resolve => {
    import(`./locales/${currentLng.data}`).then(data => {
      resolve(data);
      languageDetector.cacheUserLanguage(currentLng.lng);
    });
  });
};

export const setLanguageOnFirstTime = () => {
  const newLng = languageDetector.detect();
  setLanguage(newLng);
};

const findDataPart = (data: any, paths: string[]) => {
  let key;
  for (let i = 0; i < paths.length; i++) {
    key = paths[i];
    if (data[key] === undefined) {
      return undefined;
    }
    data = data[key];
  }
  if (typeof data !== 'string') return undefined;
  return data;
};

export const getCurrentLng = () => currentLng;

export const t = (paths: string) => {
  const p = paths.split('.');
  const translation =
    findDataPart(currentLanguageData, p) ||
    findDataPart(fallbackLanguageData, p);
  return translation;
};
