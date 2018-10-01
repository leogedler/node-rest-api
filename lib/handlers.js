/*
 * Request Handlers
 *
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

// Define handlers
const handlers = {};

// Users
handlers.users = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._users[data.method](data, callback);
    }else{
        callback(405)
    }
};

// Container for users submethods
handlers._users = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional: none
handlers._users.post = (data, callback) => {
    // Check fields
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName : false;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName : false;
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length > 10 ? data.payload.phone : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0  ? data.payload.password : false;
    const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if(firstName && lastName && phone && password && tosAgreement){
        // Make sure that the users doesnt already exist

        _data.read('users', phone, (err, data) => {
            if(err){
                // Hash the password
                const hashedPassword = helpers.hash(password);

                if(!hashedPassword){
                    callback(500, {Error: 'Could not hash the password'});
                    return;
                }

                // Create the user object
                const userObject = {
                    firstName,
                    lastName,
                    phone,
                    hashedPassword,
                    tosAgreement
                };

                // Store the user
                _data.create('users', phone, userObject, (err, data)=>{
                    if(!err){
                        callback(200);
                    }else{
                        console.log(err);
                        callback(500, {Error: 'Could not create the new user'});
                    }
                })

            }else{
                // User already exist
                callback(400, {Error: 'A user with the phone number already exist'})
            }
        })
    }else{
        callback(400, {Error: 'Missing required fields'})
    }
};

// Tokens
handlers.tokens = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._tokens[data.method](data, callback);
    }else{
        callback(405)
    }
};

// Container for all the tokens methods
handlers._tokens = {};

// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = (data, callback) => {
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length > 10 ? data.payload.phone : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0  ? data.payload.password : false;

    if(phone && password){
        // Lookup the user who matches that phone number
        _data.read('users', phone, (err, userData)=>{
            if(!err && userData){
                // Hash the sent password, and comparate to the password stored

                const hashedPassword = helpers.hash(password);
                if(hashedPassword == userData.hashedPassword){
                    // If valid, create a new token with a radom name. Set expiration date to 1 hour
                    let tokenId = helpers.createRandomString(20);
                    const expires = Date.now() + 1000 * 60 * 60;
                    const tokenObject = {
                        'phone': phone,
                        'id': tokenId,
                        'expires': expires
                    };

                    // Store the token
                    _data.create('tokens',tokenId,tokenObject, (err)=>{
                        if(!err){
                            callback(200, tokenObject);
                        }else{
                            callback(500, {'Error':'Could not create the new token'});
                        }
                    })
                }else{
                    callback(400, {'Error': 'Password did not match the specified user'})
                }
            }else{
                callback(400,{'Error': 'Could not find the specified user'});
            }
        })
    }else{
        callback(400,{'Error': 'Missing required fields'});
    }
}

// Tokens - get
handlers._tokens.get = (data, callback) => {
    
}

// Tokens - put
handlers._tokens.put = (data, callback) => {
    
}

// Tokens - delete
handlers._tokens.delete = (data, callback) => {
    
}

// Users - get
// Required data: Phone
// Optional data: node
// @TODO only let an authenticated user access their object
handlers._users.get = (data, callback) => {
    // Check that the phone number is valid
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length > 10 ? data.queryStringObject.phone : false;
    if(phone){
        _data.read('users', phone, (err, data)=>{
            if(!err && data){
                // Remove the hashed password from the user object before to return it to the requester
                delete data.hashedPassword;
                callback(200, data);
            } else{
                callback(404);
            }
        });
    }else{
        callback(400, {Error: 'Missing required field'});
    }

};

// Users - put
// Required data: Phone
// Optional data: firstName, lastName, password (at least one must specified);
// @TODO Only let an authenticated user up their object. Dont let them access update elses.
handlers._users.put = (data, callback) => {
    // Check for required field
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length > 10 ? data.payload.phone.trim() : false;

    // Check for optional fields
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    // Error if phone is invalid
    if(!phone){
        callback(400,{Error : 'Missing required field.'});  
        return;
    }

    // Error if nothing is sent to update
    if(firstName || lastName || password){
        // Lookup the user
        _data.read('users',phone, (err,userData) => {
        if(!err && userData){
            // Update the fields if necessary
            if(firstName){
                userData.firstName = firstName;
            }
            if(lastName){
                userData.lastName = lastName;
            }
            if(password){
                userData.hashedPassword = helpers.hash(password);
            }
            // Store the new updates
            _data.update('users',phone,userData, (err) => {
            if(!err){
                callback(200);
            } else {
              console.log(err);
              callback(500,{Error : 'Could not update the user.'});
            }
        });
        } else {
          callback(400,{Error : 'Specified user does not exist.'});
        }
      });
    }

};

// Users - delete
// Required data: phone
// @TODO Only let an authenticated user delete their object. Dont let them delete update elses.
// @TODO Cleanup (delete) any other data files associated with the user
handlers._users.delete = (data, callback) => {
    // Check that phone number is valid
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length > 10 ? data.queryStringObject.phone.trim() : false;
    if(phone){
    // Lookup the user
    _data.read('users',phone, (err,data) => {
        if(!err && data){
            _data.delete('users',phone,(err) => {
            if(!err){
                callback(200);
            }else {
                callback(500,{Error : 'Could not delete the specified user'});
            }
        });
        }else {
        callback(400,{Error : 'Could not find the specified user.'});
        }
    });
    } else {
    callback(400,{Error : 'Missing required field'})
    }
};

// Ping handler
handlers.ping = (data, callback) => {
    callback(200);
};

// Not found handler
handlers.notFound = (data, callback) => {
    callback(404);
};

// Export the module
module.exports = handlers;