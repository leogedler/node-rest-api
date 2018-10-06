/*
 * Helpers for various tasks
 *
 */

// Dependencies
const config = require('../config');
const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

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

// Send a SMS message via Twilio
helpers.sendTwilioSms = (phone, msg, callback) => {
  // Validate params
  phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
  msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;

  if(phone, msg){
    // Configure the request payload
    const payload  = {
      From: config.twilio.fromPhone,
      To: '+1'+phone,
      Body: msg
    };

    // Stringify the payload
    const stringPayload = querystring.stringify(payload);

    // Configure the request details
    const requestDetails = {
      protocol : 'https:',
      hostname: 'api.twilio.com',
      method: 'POST',
      path: `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
      auth: `${config.twilio.accountSid}:${config.twilio.authToken}`,
      headers: {
        'Content-Type':'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload)
      }
    };

    // Instantiate the request object
    const req = https.request(requestDetails, (res)=>{
      // Grab the status of the sent request
      const status = res.statusCode;
      // Callback successfully if the request went through
      if(status == 200 || status == 201){
        callback(false);
      }else{
        callback(`Status code returned was ${status}`);
      }
    });

    // Bind to the error event so it doesn't get thrown
    req.on('error', (e)=>{
      callback(e);
    });

    // Add the payload
    req.write(stringPayload);

    // End the request
    req.end();

  }else{
    callback('Given params were missing or invalid');
  }

}

// Export the module
module.exports = helpers;