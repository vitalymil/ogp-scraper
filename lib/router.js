
const express = require('express');
const parser = require('./parser.js');
const scraper = require('./scraper.js');

const router = express.Router();

router.post('/stories', async (req, res) => {
    try {
        const parsedOgpResult = await parser.parseUrlContent(req.query.url);
        const canonicalUrl = parsedOgpResult.url;
        const canonicalUrlId = await scraper.pushScrapeJob(canonicalUrl);

        res.status(200).send(String(canonicalUrlId)).end();
    }
    catch (error) {
        res.sendStatus(400).end();
    }
});

router.get('/stories/:canonicalUrlId', async (req, res) => {
    const scrapeResult = await scraper.getJobResult(req.params.canonicalUrlId);

    if (scrapeResult) {
        res.status(200).send(scrapeResult);
    }
    else {
        res.sendStatus(404);
    }

    res.end();
});

module.exports = router;

