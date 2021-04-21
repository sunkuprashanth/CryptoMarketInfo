const fetch = require("node-fetch");
l_aarr = []
async function getCoinInfo(coin) {
	url="https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?CMC_PRO_API_KEY=2293dae0-336c-45b1-8ae7-aa9e34eddfdd&slug="+coin+"&convert=inr";
	const res = await fetch(url);
	const json = await res.json();
	var value;
	Object.keys(json.data).forEach(function(key) {
		value = json.data[key];
		l_aarr.push({
			id: value['id'],
			name: value['name'],
			symbol: value['symbol'],
			price: value['quote']['INR']['price'],
			market_supply: value['circulating_supply']
		});
	});
	console.log(l_aarr);
	return l_aarr;
}
arr = ['bitcoin', 'dogecoin'].map((coin)=>{
	return getCoinInfo(coin);
});