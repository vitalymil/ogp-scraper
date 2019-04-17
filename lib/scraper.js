
const dataHandler = require('./data-handler.js');
const parser = require('./parser.js');

const _jobsQueue = [];
let _scrapeRunning = false;

function _startScrapingCycle() {
    if (false) {
        _scrapeRunning = true;
        _runScraping();
    }
}

async function _runScraping() {
    while (_jobsQueue.length > 0) {
        const curJob = _jobsQueue.shift();

        try {
            const ogpResult = await parser.parseUrlContent(curJob.url);
            await dataHandler.updateScrapeResult(curJob.id, 'done', ogpResult);
        }
        catch (error) {
            await dataHandler.updateScrapeResult(curJob.id, 'error');
        }
    }

    _scrapeRunning = false;
}

async function init() {
    await dataHandler.init();
    for (job in await dataHandler.getPending()) {
        _jobsQueue.push(job);
    }

    _startScrapingCycle();
}

async function pushScrapeJob(canonicalUrl) {
    const canonicalUrlId = await dataHandler.insertScrapeJob(canonicalUrl);
    _jobsQueue.push({
        url: canonicalUrl,
        id: canonicalUrlId
    });

    _startScrapingCycle();

    return canonicalUrlId;
}

async function getJobResult(canonicalUrlId) {
    return dataHandler.getScrapeResult(canonicalUrlId);
}

module.exports = {
    init,
    pushScrapeJob,
    getJobResult
}