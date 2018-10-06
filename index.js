/**
 * Primary file for the API
 */

// Dependencies
const server = require("./lib/server");
const workers = require("./lib/workers");

// Declare the app
const app = {};

// Init function
app.init = () => {
  // Start the server
  server.init();

  // Star the workiers
  workers.init();
};

// Execute
app.init();

module.exports = app;
