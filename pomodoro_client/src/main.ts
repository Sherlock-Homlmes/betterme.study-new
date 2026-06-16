import { createApp } from "vue";
import App from "./App.vue";
import setupI18n from "./plugins/i18n";
import { createHead } from "@vueuse/head"
import router from './router';
import "./assets/css/tailwind.css";
import "./assets/css/fonts.css";
import "./assets/css/transitions.css";
import "./assets/css/disable_tap_highlight.css";

const app = createApp(App);
const head = createHead();

app.use(head);
app.use(router);
setupI18n(app).then(() => {
    app.mount("#app");
});