import ru from './ru.json' with { type: 'json' };
import en from './en.json' with { type: 'json' };
import db from '../database/index.js';

const translations: any = { ru, en };

export function getTranslation(guildId: string, key: string, params: Record<string, string> = {}): string {
    const settings = db.prepare('SELECT language FROM guild_settings WHERE guild_id = ?').get(guildId) as { language: string } | undefined;
    const lang = settings?.language || process.env.DEFAULT_LANGUAGE || 'ru';

    const keys = key.split('.');
    let result = translations[lang];

    for (const k of keys) {
        if (result[k]) {
            result = result[k];
        } else {
            return key;
        }
    }

    if (typeof result !== 'string') return key;

    let translated = result;
    for (const [pKey, pValue] of Object.entries(params)) {
        translated = translated.replace(`{${pKey}}`, pValue);
    }

    return translated;
}
