/**
 * Primary file for the API
 */


// Dependencies
const http = require('http'); 
const url = require('url');

const server = http.createServer((req, res)=>{

    // Get the url and parse it
    const parsedUrl = url.parse(req.url, true);

    // Get the path
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Send the response
    res.end('Hello world\n');

    // Log the request path
    console.log('Request received on path: ', trimmedPath);
});

server.listen(3000, () =>{
    console.log('The server is listening on port 3000');
})