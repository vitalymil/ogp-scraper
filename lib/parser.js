
const http = require('http');
const htmlParser = require('htmlparser2');

function _addOgpProperty(ogpObject, splittedProperty, content) {
    let prevContent;
    let currentContent = ogpObject;

    for (let i = 1; i < splittedProperty.length; i++) {
        const isLastPart = i === splittedProperty.length - 1;
        const currentPropertyPart = splittedProperty[i];

        prevContent = currentContent;
        currentContent = currentContent[currentPropertyPart];

        if (currentContent) {
            if (!Array.isArray(currentContent)) {
                prevContent[currentPropertyPart] = [{ url: currentContent }];
            }

            if (isLastPart) {
                prevContent[currentPropertyPart].push({ url: content });
            }
        }
        else {
            if (isLastPart) {
                prevContent[currentPropertyPart] = content;
            }
            else {
                prevContent[currentPropertyPart] = [{}];
            }
        }

        if (!isLastPart) {
            currentContent = prevContent[currentPropertyPart][0];
        }
    }
}

function parseUrlContent(url) {
    return new Promise((resolve, reject) => {
        const ogpResult = {};
        const parser = new htmlParser.Parser({
            onopentag: (name, attrs) => {
                if (name === 'meta') {
                    if (attrs.property && 
                        attrs.property.startsWith('og:') && 
                        attrs.content) {
                            _addOgpProperty(ogpResult, 
                                attrs.property.split(':'),
                                attrs.content);
                    }
                }
            }
        }, { decodeEntities: true });

        http.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(parser);
                
                res.on('end', () => {
                    parser.end();
                    resolve(ogpResult);
                });

                res.on('error', reject);
                parser.on('error', reject);
            }
            else {
                reject(res.statusCode);
            }
        }).on('error', (error) => {
            reject(error);
        });
    });
}

module.exports = {
    parseUrlContent
}