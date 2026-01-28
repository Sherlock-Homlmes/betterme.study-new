import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import i18nPlugin from './plugins/i18n';
import router from './router';
import "./assets/css/tailwind.css";
import "./assets/css/transitions.css";
import "./assets/css/disable_tap_highlight.css";


const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(i18nPlugin);
app.use(router);
app.mount("#app");
