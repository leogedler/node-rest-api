/*
 * Request Handlers
 *
 */

// Dependencies
const _data = require("./data");
const helpers = require("./helpers");
const config = require("../config");

// Define handlers
const handlers = {};

// Users
handlers.users = (data, callback) => {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for users submethods
handlers._users = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional: none
handlers._users.post = (data, callback) => {
  // Check fields
  const firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName
      : false;
  const lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName
      : false;
  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length > 10
      ? data.payload.phone
      : false;
  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password
      : false;
  const tosAgreement =
    typeof data.payload.tosAgreement == "boolean" &&
    data.payload.tosAgreement == true
      ? true
      : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    // Make sure that the users doesnt already exist

    _data.read("users", phone, (err, data) => {
      if (err) {
        // Hash the password
        const hashedPassword = helpers.hash(password);

        if (!hashedPassword) {
          callback(500, { Error: "Could not hash the password" });
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
        _data.create("users", phone, userObject, (err, data) => {
          if (!err) {
            callback(200);
          } else {
            console.log(err);
            callback(500, { Error: "Could not create the new user" });
          }
        });
      } else {
        // User already exist
        callback(400, { Error: "A user with the phone number already exist" });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};

// Tokens
handlers.tokens = (data, callback) => {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the tokens methods
handlers._tokens = {};

// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = (data, callback) => {
  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length > 10
      ? data.payload.phone
      : false;
  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password
      : false;

  if (phone && password) {
    // Lookup the user who matches that phone number
    _data.read("users", phone, (err, userData) => {
      if (!err && userData) {
        // Hash the sent password, and comparate to the password stored

        const hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedPassword) {
          // If valid, create a new token with a radom name. Set expiration date to 1 hour
          let tokenId = helpers.createRandomString(20);
          const expires = Date.now() + 1000 * 60 * 60;
          const tokenObject = {
            phone: phone,
            id: tokenId,
            expires: expires
          };

          // Store the token
          _data.create("tokens", tokenId, tokenObject, err => {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, { Error: "Could not create the new token" });
            }
          });
        } else {
          callback(400, { Error: "Password did not match the specified user" });
        }
      } else {
        callback(400, { Error: "Could not find the specified user" });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};

// Tokens - get
// Required data : id
// Optional data: none
handlers._tokens.get = (data, callback) => {
  // Check that the id is valid
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id
      : false;
  if (id) {
    _data.read("tokens", id, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// Tokens - put
// Required data : id, extend
// Optional data: none
handlers._tokens.put = (data, callback) => {
  const id =
    typeof data.payload.id == "string" && data.payload.id.trim().length == 20
      ? data.payload.id
      : false;
  const extend =
    typeof data.payload.extend == "boolean" && data.payload.extend == true
      ? data.payload.id
      : false;

  if (id && extend) {
    // Lookup the token
    _data.read("tokens", id, (err, tokenData) => {
      if (!err && tokenData) {
        // Check to the make sure the token is not already expired
        if (tokenData.expires > Date.now()) {
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          // Store the new updates
          _data.update("tokens", id, tokenData, err => {
            if (!err) {
              callback(200);
            } else {
              callback(500, { Error: "Could not update the token expiration" });
            }
          });
        } else {
          callback(400, { Error: "Token already expired" });
        }
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Missing required field or invalid field" });
  }
};

// Tokens - delete
// Required data : id
// Optional data: none
handlers._tokens.delete = (data, callback) => {
  // Check that id is valid
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    // Lookup the token
    _data.read("tokens", id, (err, data) => {
      if (!err && data) {
        _data.delete("tokens", id, err => {
          if (!err) {
            callback(200);
          } else {
            callback(500, { Error: "Could not delete the specified token" });
          }
        });
      } else {
        callback(400, { Error: "Could not find the specified token" });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// Users - get
// Required data: Phone
// Optional data: node
handlers._users.get = (data, callback) => {
  // Check that the phone number is valid
  const phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length > 10
      ? data.queryStringObject.phone
      : false;
  if (phone) {
    // Get the token from the headers
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false;
    // Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, tokenIsValid => {
      if (tokenIsValid) {
        _data.read("users", phone, (err, data) => {
          if (!err && data) {
            // Remove the hashed password from the user object before to return it to the requester
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, {
          Error: "Missing required token in header or token is invalid"
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// Users - put
// Required data: Phone
// Optional data: firstName, lastName, password (at least one must specified);
handlers._users.put = (data, callback) => {
  // Check for required field
  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length > 10
      ? data.payload.phone.trim()
      : false;

  // Check for optional fields
  const firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  const lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  // Error if phone is invalid
  if (!phone) {
    callback(400, { Error: "Missing required field." });
    return;
  }

  // Error if nothing is sent to update
  if (firstName || lastName || password) {
    // Get the token from the headers
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false;
    // Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, tokenIsValid => {
      if (tokenIsValid) {
        // Lookup the user
        _data.read("users", phone, (err, userData) => {
          if (!err && userData) {
            // Update the fields if necessary
            if (firstName) {
              userData.firstName = firstName;
            }
            if (lastName) {
              userData.lastName = lastName;
            }
            if (password) {
              userData.hashedPassword = helpers.hash(password);
            }
            // Store the new updates
            _data.update("users", phone, userData, err => {
              if (!err) {
                callback(200);
              } else {
                console.log(err);
                callback(500, { Error: "Could not update the user." });
              }
            });
          } else {
            callback(400, { Error: "Specified user does not exist." });
          }
        });
      } else {
        callback(403, {
          Error: "Missing required token in header or token is invalid"
        });
      }
    });
  }
};

// Users - delete
// Required data: phone
handlers._users.delete = (data, callback) => {
  // Check that phone number is valid
  const phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length > 10
      ? data.queryStringObject.phone.trim()
      : false;
  if (phone) {
    // Get the token from the headers
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false;
    // Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, tokenIsValid => {
      if (tokenIsValid) {
        // Lookup the user
        _data.read("users", phone, (err, userData) => {
          if (!err && userData) {
            _data.delete("users", phone, err => {
              if (!err) {
								
								// Delete earch of the check associated with the user
								const userChecks =
								typeof userData.checks == "object" &&
								userData.checks instanceof Array
									? userData.checks
									: [];
								const checksToDelete = userChecks.length;
								
								if(checksToDelete > 0){
									let checksDeleted = 0;
									const deletionErrors = false;
									
									// Loop through the checks
									userChecks.forEach(checkId => {
										// Delete the check
										_data.delete('checks', checkId, (err)=>{
											if(err){
												deletionErrors = true;
											}
											checksDeleted++;
											if(checksDeleted == checksToDelete){
												if(!deletionErrors){
													callback(200);
												}else{
													callback(500, {Error: 'Errors encountered while attempting to delete all user checks'})
												}
											}
										})
									});

								}else{
									callback(200);
								}
              } else {
                callback(500, { Error: "Could not delete the specified user" });
              }
            });
          } else {
            callback(400, { Error: "Could not find the specified user." });
          }
        });
      } else {
        callback(403, {
          Error: "Missing required token in header or token is invalid"
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// Verify if a given token id is current valid for a given user
handlers._tokens.verifyToken = (id, phone, callback) => {
  //Lookup the token
  _data.read("tokens", id, (err, tokenData) => {
    if (id && tokenData) {
      // Check that the token is for the given user and has not expired
      if (tokenData.phone == phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

// Checks
handlers.checks = (data, callback) => {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the checks methods
handlers._checks = {};

// Checks - post
// Required data: protocol, url, method, successCodes, timeoutSeconds
// Optional data: none
handlers._checks.post = (data, callback) => {
  // Validate inputs
  const protocol =
    typeof data.payload.protocol == "string" &&
    ["http", "https"].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;
  const url =
    typeof data.payload.url == "string" && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;
  const method =
    typeof data.payload.method == "string" &&
    ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;
  const successCodes =
    typeof data.payload.successCodes == "object" &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;
  const timeoutSeconds =
    typeof data.payload.timeoutSeconds == "number" &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;

  if (protocol && url && method && successCodes && timeoutSeconds) {
    // Get the token from the headers
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false;

    // Lookup the user by reading the token
    _data.read("tokens", token, (err, tokenData) => {
      if (!err && tokenData) {
        const userPhone = tokenData.phone;

        // Lookup the user data
        _data.read("users", userPhone, (err, userData) => {
          if ((!err, userData)) {
            const userChecks =
              typeof userData.checks == "object" &&
              userData.checks instanceof Array
                ? userData.checks
                : [];
            // Verify that the user has less that the max numbers of checks
            if (userChecks.length < config.maxChecks) {
              // Create a radom id for the check
              const checkId = helpers.createRandomString(20);

              // Create the check object and include the user's phone
              const checkObject = {
                id: checkId,
                userPhone: userPhone,
                protocol,
                url,
                method,
                successCodes,
                timeoutSeconds
              };

              // Save the object
              _data.create("checks", checkId, checkObject, err => {
                if (!err) {
                  // Add the check id to the user's object
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  // Save the new user data
                  _data.update("users", userPhone, userData, err => {
                    if (!err) {
                      // Return new check data
                      callback(200, checkObject);
                    } else {
                      callback(500, {
                        Error: "Could not update the user with the new check"
                      });
                    }
                  });
                } else {
                  callback(500, { Error: "Could not create the new check" });
                }
              });
            } else {
              callback(400, {
                Error: `The user already has the maxinum number of checks (${
                  config.maxChecks
                })`
              });
            }
          } else {
            callback(403);
          }
        });
      } else {
        callback(403);
      }
    });
  } else {
    callback(400, {
      Error: "Missing required inputs or inputs invalid"
    });
  }
};

// Checks - get
// Required data: id
// Optional data: none
handlers._checks.get = (data, callback) => {
  // Check that the id is valid
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length === 20
      ? data.queryStringObject.id
      : false;
  if (id) {
    // Lookup the check
    _data.read("checks", id, (err, checkData) => {
      if ((!err, checkData)) {
        // Get the token from the headers
        const token =
          typeof data.headers.token == "string" ? data.headers.token : false;
        // Verify that the given token is valid an belong to the user
        handlers._tokens.verifyToken(
          token,
          checkData.userPhone,
          tokenIsValid => {
            if (tokenIsValid) {
              // Return the check data
              callback(200, checkData);
            } else {
              callback(403);
            }
          }
        );
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// Checks - put
// Required data: id
// Optional data: protocol, url, method, successCodes, timeoutSeconds (One must be set)
handlers._checks.put = (data, callback) => {
  // Check for required field
  const id =
    typeof data.payload.id == "string" && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;

  // Validate inputs
  const protocol =
    typeof data.payload.protocol == "string" &&
    ["http", "https"].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;
  const url =
    typeof data.payload.url == "string" && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;
  const method =
    typeof data.payload.method == "string" &&
    ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;
  const successCodes =
    typeof data.payload.successCodes == "object" &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;
  const timeoutSeconds =
    typeof data.payload.timeoutSeconds == "number" &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;

  // Check to make sure id is valid
  if (id) {
    // Check to make sure one of optional fields was sent
    if (protocol || url || method || successCodes || timeoutSeconds) {
      _data.read("checks", id, (err, checkData) => {
        if (!err && checkData) {
          // Get the token from the headers
          const token =
            typeof data.headers.token == "string" ? data.headers.token : false;
          // Verify that the given token is valid an belong to the user
          handlers._tokens.verifyToken(
            token,
            checkData.userPhone,
            tokenIsValid => {
              if (tokenIsValid) {
                // Update the check
                if (protocol) {
                  checkData.protocol = protocol;
                }
                if (url) {
                  checkData.url = url;
                }
                if (method) {
                  checkData.method = method;
                }
                if (successCodes) {
                  checkData.successCodes = successCodes;
                }
                if (timeoutSeconds) {
                  checkData.timeoutSeconds = timeoutSeconds;
                }
                _data.update("checks", id, checkData, err => {
                  if (!err) {
                    callback(200);
                  } else {
                    callback(500, { Erro: "Could not update the check" });
                  }
                });
              } else {
                callback(403);
              }
            }
          );
        } else {
          callback(400, { Error: "Check id don't exists" });
        }
      });
    } else {
      callback(400, { Error: "Missing required field to update" });
    }
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// Checks - delete
// Required data : id
// Optional data: none
handlers._checks.delete = (data, callback) => {
  // Check that phone number is valid
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    // Lookup the check
    _data.read("checks", id, (err, checkData) => {
      if (!err && checkData) {
        // Get the token from the headers
        const token =
          typeof data.headers.token == "string" ? data.headers.token : false;
        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(
          token,
          checkData.userPhone,
          tokenIsValid => {
            if (tokenIsValid) {
              // Delete check
              _data.delete("checks", id, err => {
                if (!err) {

                  // Lookup the user
                  _data.read("users", checkData.userPhone, (err, userData) => {
                    if (!err && userData) {

											const userChecks =
											typeof userData.checks == "object" &&
											userData.checks instanceof Array
												? userData.checks
												: [];

												// Remove the deleted check from user check array
												const checkPosition = userChecks.indexOf(id);
												if(checkPosition > -1){
													userChecks.splice(checkPosition,1);
													// Re-save user data
													_data.update("users", checkData.userPhone, userData,  err => {
														if (!err) {
															callback(200);
														} else {
															callback(500, {
																Error: "Could not update the specified user"
															});
														}
													});
												}else{
													callback(500)
												}
                    } else {
                      callback(500, {
                        Error: "Could not find user who created the check, so could not removed the check from the user object"
                      });
                    }
                  });
                } else {
                  callback(500, { Error: "Could not delete the check data" });
                }
              });
            } else {
              callback(403, {
                Error: "Missing required token in header or token is invalid"
              });
            }
          }
        );
      } else {
        callback(400, { Error: "Specified check does not exits" });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
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
