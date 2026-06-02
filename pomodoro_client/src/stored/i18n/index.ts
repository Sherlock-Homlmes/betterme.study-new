import { createI18n } from 'vue-i18n';
import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import hr from './hr.json';
import hu from './hu.json';
import pt from './pt.json';
import vi from './vi.json';
import zh from './zh.json';

const messages = {
	en,
	es,
	fr,
	hr,
	hu,
	pt,
	vi,
	zh,
};

const i18n = createI18n({
	legacy: false,
	locale: 'en',
	fallbackLocale: 'en',
	messages,
});

export default i18n;
