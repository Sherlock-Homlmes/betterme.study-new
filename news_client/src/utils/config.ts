const isProd = import.meta.env.PROD;
const devServerLink = "http://server:8080";
const devClientServerLink = "http://local.betterme.news";
const prodServerLink = "https://api.betterme.news";
const fetchLink = isProd ? `${prodServerLink}/api` : `${devServerLink}/api`;
const clientFetchLink = isProd
	? `${prodServerLink}/api`
	: `${devClientServerLink}/api`;
export { fetchLink, clientFetchLink };
