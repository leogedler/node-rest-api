/**
 * Primary file for the API
 */


// Dependencies
const http = require('http'); 
const https = require('https'); 
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

// Instantiate the http server
const httpServer = http.createServer((req, res)=>{
    unifiedServer(req, res);
});

// Start the http server
httpServer.listen(config.httpPort, () =>{
    console.log(`The server is listening on port ${config.httpPort}`);
})

// Instantiate the https server
const httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
};  
const httpsServer = https.createServer(httpsServerOptions, (req, res)=>{
    unifiedServer(req, res);
});

// Start the https server
httpsServer.listen(config.httpsPort, () =>{
    console.log(`The server is listening on port ${config.httpsPort}`);
})

// Unified Serveer for http and https
const unifiedServer = (req, res) =>{
    // Get the url and parse it
    const parsedUrl = url.parse(req.url, true);

    // Get the path
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object
    const queryStringObject = parsedUrl.query;

    // Get the HTTP Method
    const method = req.method.toLowerCase();

    // Get the headers as an object
    const headers = req.headers;

    // Get the payload, if any
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', (data)=>{
        buffer += decoder.write(data);
    });
    req.on('end', () => {
        buffer += decoder.end();

        // Choose the handler
        const chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        // Construct the data object to send to the handler
        const data = {
            trimmedPath,
            queryStringObject,
            method, 
            headers,
            payload: helpers.parseJsonToObject(buffer)
        };

        // Route the request
        chosenHandler(data, (statusCode, payload) => {

            // Define the status code
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            // Define the payload
            payload = typeof(payload) == 'object' ? payload : {};

            // Convert the payload to a string
            const payloadString = JSON.stringify(payload);

            // Return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            // Log response
            console.log('Returning ', statusCode, payloadString);
        })
    });
}

// Define a request router
const router = {
    'ping': handlers.ping,
    'users': handlers.users
}