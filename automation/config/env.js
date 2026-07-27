require('dotenv').config();

module.exports = {
    BASE_URL: process.env.BASE_URL || 'https://www-mauve-one.vercel.app',
    BROWSER: process.env.BROWSER || 'chrome',
    HEADLESS: process.env.HEADLESS !== 'false',
    TIMEOUT: parseInt(process.env.TIMEOUT) || 10000,
};
