
const express = require('express');
const router = require('./lib/router.js');
const scraper = require('./lib/scraper.js');

const app = express();

async function main() {
    await scraper.init();

    app.use(router);
    app.listen(80);
}

main();
