import ko from './locales/ko.json';

const locale = 'ko';
const resources: Record<string, any> = {
  ko,
};

export function t(path: string, vars?: Record<string, string | number>) {
  const parts = path.split('.');
  let cur: any = resources[locale] || {};
  for (const p of parts) {
    cur = cur?.[p];
    if (cur === undefined) return path;
  }
  let str = String(cur);
  if (vars) {
    for (const k of Object.keys(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]));
    }
  }
  return str;
}
