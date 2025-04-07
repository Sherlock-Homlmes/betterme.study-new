const isProd = import.meta.env.PROD;
const devServerLink = "http://server:8080";
const devClientServerLink = "http://local.betterme.study";
const prodServerLink = "https://api.betterme.study";
const fetchLink = isProd ? `${prodServerLink}/api` : `${devServerLink}/api`;
const clientFetchLink = isProd
	? `${prodServerLink}/api`
	: `${devClientServerLink}/api`;
export { fetchLink, clientFetchLink };
