const axios = require('axios');

const BASE_URL = 'https://api.coingecko.com/api/v3';

async function getCoinPrice(coinId) {
  try {
    const res = await axios.get(`${BASE_URL}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        ids: coinId,
        price_change_percentage: '24h'
      }
    });
    return res.data[0];
  } catch (error) {
    console.error("CoinGecko Error:", error.message);
    return null;
  }
}

async function getTrendingCoins() {
  try {
    const res = await axios.get(`${BASE_URL}/search/trending`);
    return res.data.coins.slice(0, 5);
  } catch (error) {
    console.error("Trending Fetch Error:", error.message);
    return [];
  }
}

async function getGlobalMarket() {
  try {
    const res = await axios.get(`${BASE_URL}/global`);
    return res.data.data;
  } catch (error) {
    console.error("Global Data Error:", error.message);
    return null;
  }
}

module.exports = { getCoinPrice, getTrendingCoins, getGlobalMarket };
