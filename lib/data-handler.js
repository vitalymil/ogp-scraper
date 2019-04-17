
const sqlite = require('sqlite3');
const util = require('util');

let _db = new sqlite.Database('./local.db');

async function init() {
    const dbRun = util.promisify(_db.run.bind(_db));
    
    await dbRun('CREATE TABLE IF NOT EXISTS scrape_jobs(url text, status text, result , update_time text)');
    await dbRun('CREATE UNIQUE INDEX IF NOT EXISTS scrape_jobs_url_idx ON scrape_jobs(url)');
}

function _getDbSingleResult(sql, parameter) {
    return new Promise((resolve, reject) => {
        _db.get(sql, [parameter], (error, row) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(row);
            }
        })
    });
}

async function getCanonicalUrlId(canonicalUrl) {
    const canonicalUrlIdRow = await _getDbSingleResult(
        `SELECT rowid id FROM scrape_jobs WHERE url = ?`, 
        canonicalUrl);
    
    return canonicalUrlIdRow.id;
}

async function getScrapeResult(canonicalUrlId) {
    const resultRow = await _getDbSingleResult(
        `SELECT rowid id, status, update_time, result FROM scrape_jobs WHERE rowid = ?`, 
        canonicalUrlId);
    
    if (!resultRow) {
        return null;
    }

    const result = resultRow.result ? 
        JSON.parse(resultRow.result) :
        {};

    result['updated_time'] = resultRow['update_time'];
    result['scrape_status'] = resultRow['status'];
    result['id'] = resultRow['id'];

    return result;
}

function insertScrapeJob(canonicalUrl) {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO scrape_jobs(url, status, update_time) VALUES(?, 'pending', datetime('now'))
                     ON CONFLICT(url) DO UPDATE SET status = 'pending'`;
        const params = [canonicalUrl];

        _db.run(sql, params, (error) => {
            if (error) {
                reject(error);
            }
            else {
                getCanonicalUrlId(canonicalUrl).then(resolve);
            }
        })
    });
}

function updateScrapeResult(canonicalUrlId, status, parsedOgpResult) {
    return new Promise((resolve, reject) => {
        const stringResult = parsedOgpResult ? JSON.stringify(parsedOgpResult, null, 2) : null;
        const sql = `UPDATE scrape_jobs SET status = ?, result = ?, 
                        update_time = datetime('now') WHERE rowid = ?`
        const params = [status, stringResult, canonicalUrlId];

        _db.run(sql, params, (error) => {
            if (error) {
                reject(error);
            }
            else {
                resolve();
            }
        })
    });
}

function getPending() {
    return new Promise((resolve, reject) => {
        const sql = `SELECT rowid id, url FROM scrape_jobs WHERE status = 'pending'`;

        _db.all(sql, [], (error, rows) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(rows);
            }
        });
    });
}

module.exports = {
    init,
    getCanonicalUrlId,
    getScrapeResult,
    updateScrapeResult,
    insertScrapeJob,
    getPending
}