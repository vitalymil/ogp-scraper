
curl usage examples:
    - curl -X POST http://vitaly.melnitchuk.hiring.keywee.io/stories?url=http://ogp.me/ 
        * response is the id of the canonical URL
    - curl http://vitaly.melnitchuk.hiring.keywee.io/stories/:ID
        * :ID should be replaced by an id returend from the POST request
        * response is a JSON object including scraping status and result

design overview:
    - parser.js
        exposes a single method that gets a url,
        make an http get request to the url and parses the http response
        building an object with the relevant ogp meta tags.
        the module uses streams to read the http response,
        and parse the html.
    - data-handler.js
        all scraping jobs given by the POST request to the server
        are saved with their status in a local sqlite database
        the module initialized the database (creates it and the needed table if not exists)
        and exposes method for geting scrape jobs and inserting/updating existing jobs
    - scraper.js
        handles the scraping loop, saves all the scrape jobs in a queue
        and runs over the queue with it is not empty
        once it empties, the loop stops and will start only when a scrape job is pushed.
        on initialization, it fetches all the pending jobs in the database (using data-handler)
        and starts the scraping loop. (to handle cases if the process crashes)
    - router.js:
        creates a router object with the 2 relevant http routes
        on a POST request, parses the given url response (to get the canonical URL)
        and then pushes a job to the scraper

