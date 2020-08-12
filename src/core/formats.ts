import { Formats } from 'consts';

import { t } from 'i18n';
// Render the content(Style) of cell

const noop = (v?: string | number) => String(v);

const formats = [
  {
    label: t('format.auto'),
    key: Formats.auto,
    formatter: noop,
  },
  {
    label: t('format.duration'),
    key: Formats.duration,
    formatter: noop,
  },
  {
    label: t('format.plainText'),
    key: Formats.plainText,
    formatter: noop,
  },
  {
    label: t('format.date'),
    key: Formats.date,
    formatter(text: string) {
      const d = new Date(text);

      if (d.getTime()) {
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      }

      return text;
    },
  },
  {
    label: t('format.time'),
    key: Formats.time,
    formatter(text: string) {
      const d = new Date(text);

      if (d.getTime()) {
        return `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
      }

      return text;
    },
  },
  {
    label: t('format.dateTime'),
    key: Formats.dateTime,
    formatter(text: string) {
      const d = new Date(text);

      if (d.getTime()) {
        return `${d.getFullYear()}-${d.getMonth() +
          1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
      }

      return String(text);
    },
  },
  {
    label: t('format.percentage'),
    key: Formats.percentage,
    formatter(text: string, toFixed: number) {
      const _text = parseFloat(text);

      if (isNaN(_text)) {
        return text;
      }

      return `${(_text * 100).toFixed(toFixed)}%`;
    },
  },
  {
    label: t('format.percentage'),
    key: Formats.scientificNotation,
    formatter(text: string) {
      const _text = parseFloat(text);

      if (isNaN(_text)) {
        return text;
      }

      return _text.toExponential();
    },
  },
  {
    label: t('format.number'),
    key: Formats.number,
    formatter(text: string) {
      const _text = parseFloat(text);

      if (isNaN(_text)) {
        return text;
      }

      return text;
    },
  },
];

export function findFormatter(key: Formats) {
  const formatter =
    formats.find(format => format.key === key)?.formatter ?? noop;

  return formatter;
}

export default formats;
