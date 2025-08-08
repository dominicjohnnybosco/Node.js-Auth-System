const axios = require('axios');

const FLW_BASE_URL = "https://api.flutterwave.com/v3";
const FLW_SECRETE_KEY = process.env.FLW_SECRETE_KEY;

const flwApi = axios.create({
    baseURL: FLW_BASE_URL,
    headers: {
        Authorization: `Bearer ${FLW_SECRETE_KEY}`,
        'Content-Type': 'application/json',
    },
});

module.exports = flwApi;