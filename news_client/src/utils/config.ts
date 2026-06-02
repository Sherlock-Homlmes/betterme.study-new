const isProd = import.meta.env.PROD;
const devServerLink = "http://server:8080";
const devClientServerLink = "http://local.betterme.page";
const prodServerLink = "https://api.betterme.page";
const fetchLink = isProd ? `${prodServerLink}/api/v2` : `${devServerLink}/api/v2`;
const clientFetchLink = isProd
	? `${prodServerLink}/api/v2`
	: `${devClientServerLink}/api/v2`;
export { fetchLink, clientFetchLink };
