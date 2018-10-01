/*
 * Helpers for various tasks
 *
 */

// Dependencies
const config = require('../config');
const crypto = require('crypto');

// Container for all the helpers
const helpers = {};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = (str) => {
  try{
    const obj = JSON.parse(str);
    return obj;
  } catch(e){
    return {};
  }
};

// Create a SHA256 hash
helpers.hash = (str) => {
  if(typeof(str) == 'string' && str.length > 0){
    const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};


// Create a string of radom alphanumeric characters
helpers.createRandomString = (stringLength) => {
  stringLength = typeof(stringLength) == 'number' && stringLength > 0 ? stringLength : false;

  if(stringLength){
    //Define all the possible characters
    const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    // Start the final string
    let str = '';
    for (let index = 0; index < stringLength; index++) {
      // Get a random character
      let randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length)); 
      // Append this character to the final string
      str+=randomCharacter;
    }
    return str;

  }else{
    return false;
  }
}

// Export the module
module.exports = helpers;