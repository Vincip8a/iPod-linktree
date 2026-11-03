// Languages of the site (settings.languages in config.json, e.g. ["de", "en"]). Any text in config.json is
// either a plain string (the same in every language) or an object with one entry per language,
// { "de": "Über mich", "en": "About me" }; localize() turns the config into the plain config of one
// language, which is what the window, the iPod and the build read. No DOM here: the build imports it too.

/** the site's languages, in the order of settings.languages (lower-case codes); ['de'] when unset */
export function languagesOf(config) {
  const list = Array.isArray(config?.settings?.languages) ? config.settings.languages : [];
  const langs = [...new Set(list.map((l) => String(l ?? '').trim().toLowerCase()).filter((l) => /^[a-z]{2,3}$/.test(l)))];
  return langs.length ? langs : ['de'];
}

/** The config in language `lang`: every object whose keys are all languages of the site becomes its
 *  entry for `lang`, else for the first language that has one. */
export function localize(config, lang, langs = languagesOf(config)) {
  const pick = (v) => {
    if (Array.isArray(v)) return v.map(pick);
    if (!v || typeof v !== 'object') return v;
    const keys = Object.keys(v);
    if (keys.length && keys.every((k) => langs.includes(k))) {
      const k = Object.hasOwn(v, lang) ? lang : langs.find((l) => Object.hasOwn(v, l));
      return pick(v[k]);
    }
    return Object.fromEntries(keys.map((k) => [k, pick(v[k])]));
  };
  return pick(config);
}

/** UI texts of the code itself: `table` has one entry per language; `lang` falls back to German, then to
 *  the first entry */
export const uiText = (table, lang) => table[lang] ?? table.de ?? Object.values(table)[0];
