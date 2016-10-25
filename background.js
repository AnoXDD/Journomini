/**
 * Omnibox plugin for my own use. 
 * Author Anoxic
 * Created 042516
 */

// TODOs
/**
 * - Not allowing login if not enabled
 * - Copy what's pushed to the clipboard
 */

var lastItemID;

/**
 * Scripts from an extension. Thank you so much
 * https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi
 */
'use strict';

var DefaultSettings = {
    'active': true,
    /////////////////// If the login url changes, update this url
    'urls': ['*://login.live.com/*'],
    'exposedHeaders': '',
    'Origin': 'http://evil.com/'
},
  accessControlRequests = {};

var exposedHeaders;

var requestRules = [{
    'data': {
        'name': 'Origin',
        'value': 'http://evil.com/'
    },
    'mandatory': true,
    'fn': null
}, {
    'data': {
        'name': 'Access-Control-Request-Headers',
        'value': null
    },
    'mandatory': false,
    'fn': function(rule, header, details) {
        if (accessControlRequests[details.requestId] === void 0) {
            accessControlRequests[details.requestId] = {};
        }
        accessControlRequests[details.requestId].headers = header.value;
    }
}];


var responseRules = [{
    'data': {
        'name': 'Access-Control-Allow-Origin',
        'value': '*'
    },
    'mandatory': true,
    'fn': null
}, {
    'data': {
        'name': 'Access-Control-Allow-Headers',
        'value': null
    },
    'mandatory': true,
    'fn': function(rule, header, details) {
        if (accessControlRequests[details.requestId] !== void 0) {
            header.value = accessControlRequests[details.requestId].headers;
        }

    }
}, {
    'data': {
        'name': 'Access-Control-Allow-Credentials',
        'value': 'true'
    },
    'mandatory': false,
    'fn': null
}, {
    'data': {
        'name': 'Access-Control-Allow-Methods',
        'value': 'POST, GET, OPTIONS, PUT, DELETE'
    },
    'mandatory': true,
    'fn': null
},
  {
      'data': {
          'name': 'Allow',
          'value': 'POST, GET, OPTIONS, PUT, DELETE'
      },
      'mandatory': true,
      'fn': null
  }];

var requestListener = function(details) {
    // console.info('request details', details);
    requestRules.forEach(function(rule) {
        var flag = false;

        details.requestHeaders.forEach(function(header) {
            if (header.name === rule.data.name) {
                flag = true;
                if (rule.fn) {
                    rule.fn.call(null, rule, header, details);
                } else {
                    header.value = rule.data.value;
                }
            }
        });

        //add this rule anyway if it's not present in request headers
        if (!flag && rule.mandatory) {
            if (rule.data.value) {
                details.requestHeaders.push(rule.data);
            }
        }
    });

    //////@todo REMOVE test
    ////console.groupCollapsed("%cRequest", "color:red;");
    ////console.log(JSON.stringify(details, null, 2));
    ////console.groupEnd('Request');

    return {
        requestHeaders: details.requestHeaders
    };
};

var responseListener = function(details) {
    // console.info('response details', details);
    /*  var headers = responseRules.filter(function (rule) {
        console.info('rule filter', rule);
        return rule.value !== void 0 && rule.value !== null;
      });*/

    responseRules.forEach(function(rule) {
        var flag = false;

        details.responseHeaders.forEach(function(header) {
            // if rule exist in response - rewrite value
            if (header.name === rule.data.name) {
                flag = true;
                if (rule.fn) {
                    rule.fn.call(null, rule.data, header, details);
                } else {
                    if (rule.data.value) {
                        header.value = rule.data.value;
                    } else {
                        //@TODO DELETE this header
                    }
                }
            }
        });

        //add this rule anyway if it's not present in request headers
        if (!flag && rule.mandatory) {
            if (rule.fn) {
                rule.fn.call(null, rule.data, rule.data, details);
            }

            if (rule.data.value) {
                details.responseHeaders.push(rule.data);
            }
        }
    });

    //details.responseHeaders = details.responseHeaders.concat(headers);


    //////@todo REMOVE test
    ////console.groupCollapsed('Response');
    ////console.log(JSON.stringify(details, null, 2));
    ////console.groupEnd('Response');
    return {
        responseHeaders: details.responseHeaders
    };
};

/*Reload settings*/
var reload = function() {
    console.info("reload");
    chrome.storage.local.get(DefaultSettings,
      function(result) {
          exposedHeaders = result.exposedHeaders;
          console.info("get localStorage", result);

          /*Remove Listeners*/
          chrome.webRequest.onHeadersReceived.removeListener(responseListener);
          chrome.webRequest.onBeforeSendHeaders.removeListener(requestListener);

          if (result.active) {
              if (result.urls.length) {
                  /*Add Listeners*/
                  chrome.webRequest.onHeadersReceived.addListener(responseListener, {
                      urls: result.urls
                  }, ['blocking', 'responseHeaders']);

                  chrome.webRequest.onBeforeSendHeaders.addListener(requestListener, {
                      urls: result.urls
                  }, ['blocking', 'requestHeaders']);
              }
          }
      });
};

/*On install*/
chrome.runtime.onInstalled.addListener(function(details) {
    console.log('previousVersion', JSON.stringify(details, null, 2));

    chrome.storage.local.set({
        'active': true
    });
    chrome.storage.local.set({
        'urls': ['*://login.live.com/*']
    });
    chrome.storage.local.set({
        'exposedHeaders': ''
    });
    reload();
});

/**
 * For fetching login detail from Microsoft
 */

function onAuthCallback(code) {
    var appinfo = getAppInfo();
    // Redeem the code: post to get authentication token
    $.ajax({
        type: "POST",
        url: "https://login.live.com/oauth20_token.srf",
        contentType: "application/x-www-form-urlencoded",
        data: "client_id=" + appinfo.clientId +
			"&redirect_uri=" + appinfo.redirectUri +
			"&client_secret=" + appinfo.clientSecret +
			"&code=" + code +
			"&grant_type=authorization_code"
    }).done(function(data, status, xhr) {
        // Try to get the access token and expiry
        var token = data["access_token"],
            refresh = data["refresh_token"];
        chrome.storage.local.set({
            token: token,
            refresh: refresh
        });
    }).fail(function() {
        sendNotification("Error", "Cannot get the `refresh_token`");
    });
}

function getAuthInfoFromUrl() {
    if (window.location.search) {
        var authResponse = window.location.search.substring(1);
        var authInfo = JSON.parse(
		  "{\"" + authResponse.replace(/&/g, "\",\"").replace(/=/g, "\":\"") + "\"}",
		  function(key, value) { return key === "" ? value : decodeURIComponent(value); });
        return authInfo;
    } else {
        sendNotification("Error", "failed to receive auth token");
    }
}

/**
 * Gets the local storage component of this extension specifying the name
 * @param {string} name - the name to be searched
 * @param {function} callback - the callback function after retrieving is done, taking a paramter which is not undefined if the key is valid
 */
function getFromStorage(name, callback) {
    chrome.storage.local.get(name, function(result) {
        callback(result[name]);
    });
}

/**
 * Refreshes the token to get a new access token, then call the callback
 * @param {function} callback - A callback function that can have a parameter to handle the ACCESS TOKEN passed in. This function will only be called if the token is successfully refreshed
 */
function refreshToken(callback) {
    getFromStorage("refresh", function(refresh) {
        var appinfo = getAppInfo();
        if (refresh) {
            $.ajax({
                type: "POST",
                url: "https://login.live.com/oauth20_token.srf",
                contentType: "application/x-www-form-urlencoded",
                data: "client_id=" +
                    appinfo.clientId +
                    "&redirect_uri=" +
                    appinfo.redirectUri +
                    "&client_secret=" +
                    appinfo.clientSecret +
                    "&refresh_token=" +
                    refresh +
                    "&grant_type=refresh_token"
            })
                .done(function(data, status, xhr) {
                    var token = data["access_token"],
                        refresh = data["refresh_token"],
                        expiry = parseInt(data["expires_in"]);
                    chrome.storage.local.set({
                        token: token,
                        refresh: refresh
                    });
                    if (typeof (callback) === "function")
                        callback(token);
                })
                .fail(function() {
                    sendNotification("Error", "Unable to get `access_token`, try again.")
                });
        } else {
            sendNotification("Error", "Unable to get `refresh`, try re-signin");
        }
    })

}

function getAppInfo() {
    var appInfo = {
        clientId: "000000004C14D0D9",
        clientSecret: "ywGrXJMufpTJxa5AsQCd3ovdMasZSnxf",
        scopes: "wl.signin wl.offline_access onedrive.readwrite onedrive.appfolder",
        redirectUri: "https://anoxdd.github.io/journal/callback.html"
    };

    return appInfo;
}

function challengeForAuth() {
    var appInfo = getAppInfo();
    var url =
	  "https://login.live.com/oauth20_authorize.srf" +
	  "?client_id=" + appInfo.clientId +
	  "&scope=" + encodeURIComponent(appInfo.scopes) +
	  "&response_type=code" +
	  "&redirect_uri=" + encodeURIComponent(appInfo.redirectUri);
    console.log(url);
    popup(url);
}

function popup(url) {
    var width = 525,
		height = 525,
		screenX = window.screenX,
		screenY = window.screenY,
		outerWidth = window.outerWidth,
		outerHeight = window.outerHeight;

    var left = screenX + Math.max(outerWidth - width, 0) / 2;
    var top = screenY + Math.max(outerHeight - height, 0) / 2;

    var features = [
				"width=" + width,
				"height=" + height,
				"top=" + top,
				"left=" + left,
				"status=no",
				"resizable=yes",
				"toolbar=no",
				"menubar=no",
				"scrollbars=yes"];
    var popup = window.open(url, "oauth", features.join(","));
    if (!popup) {
        alert("failed to pop up auth window");
    }

    popup.focus();
}

function onAuthenticated(token, authWindow) {
    if (token) {
        if (authWindow) {
            authWindow.close();
        }
    }
}


// My original code

// This event is fired each time the user updates the text in the omnibox,
// as long as the extension's keyword mode is still active.
chrome.omnibox.onInputChanged.addListener(
  function(text, suggest) {
      suggest([
        { content: text + " @" + window.location.href, description: "Add this website" },
      ////  { content: text + " number two", description: "the second entry" }
      ]);
  });

// This event is fired with the user accepts the input in the omnibox.
chrome.omnibox.onInputEntered.addListener(
  function(text) {
      if (text.startsWith("`")) {
          // This is a command
          processCommand(text.substr(1));
      } else {
          saveChanges(text);
      }
  });


/**
 * Processes a command
 * @param {string} cmd - a command to be processed, without $
 */
function processCommand(cmd) {
    if (cmd == "e" || cmd === "enable") {
        // Enable sign-in to get the code
        chrome.storage.local.set({ "enable": "enable" });
        sendNotification("Command", "Auto-close Microsoft Login menu enabled");
    } else if (cmd == "d" || cmd === "disable") {
        // Disable automatically closing anoxic.me/journal/callback.html
        chrome.storage.local.set({ "enable": "" });
        sendNotification("Command", "Auto-close Microsoft Login menu disabled");
    } else if (cmd == "c" || cmd === "clear") {
        chrome.storage.local.clear();
        sendNotification("Command", "All local data memory is cleared");
    } else if (cmd == "u" || cmd === "undo") {
        undoBulb();
    } else {
        sendNotification("Command", "Unknown command");
    }
}

/**
 * Saves the changes and upload it to onedrive folder
 * @param {string} value - The content to be uploaded
 */
function saveChanges(value) {
    // Check if we have refresh_token
    var initiated = false;
    var checkInterval = setInterval(function() {
        getFromStorage("refresh",
            function(refresh) {
                if (refresh) {
                    // Stop checking refresh token
                    clearInterval(checkInterval);
                    // Get the token
                    refreshToken(function(token) {
                        // Create a new file and upload it
                        uploadFile(value, token);
                    })
                } else {
                    if (!initiated) {
                        challengeForAuth();
                        initiated = true;
                        var checkIntervalCode = setInterval(function() {
                            getFromStorage("code", function(code) {
                                if (code) {
                                    clearInterval(checkIntervalCode);
                                    onAuthCallback(code);
                                }
                            })
                        }, 1000);
                    }
                }
            });
    }, 1000);
}

/**
 * Uploads journal.archive.data to OneDrive and creates a backup
 * @param {string} data - The data to be uploaded
 * @param {string} token - a valid token 
 * @param {function()} callback - what to do after everything is done
 */
function uploadFile(data, token, callback) {
    var d = new Date(),
        month = d.getMonth() + 1,
        day = d.getDate(),
        year = d.getFullYear() % 100,
        hour = d.getHours(),
        minute = d.getMinutes(),
        second = d.getSeconds();
    month = month < 10 ? "0" + month : month;
    day = day < 10 ? "0" + day : day;
    year = year < 10 ? "0" + year : year;
    hour = hour < 10 ? "0" + hour : hour;
    minute = minute < 10 ? "0" + minute : minute;
    second = second < 10 ? "0" + second : second;
    var fileName = "" + month + day + year + "_" + hour + minute + second;

    $.ajax({
        type: "PUT",
        url: "https://api.onedrive.com/v1.0/drive/root:/Apps/Journal/bulb/" + fileName + ":/content?access_token=" + token,
        contentType: "text/plain",
        data: data
    })
        .done(function(d) {
            if (d && d["id"]) {
                lastItemID = d["id"];
            }

            sendNotification("Bulb Pushed", data);
        })
        .fail(function(xhr, status, error) {
            alert("Error", "Unable to upload the file. The server returns \"" + error + "");
        })
    .always(function() {
        if (typeof callback === "function") {
            callback();
        }
    });
}

/**
 * Sends a notification to tell user what is going on
 * @param {string} title - The title of the notification
 * @param {string} body - The body of the notification
 */
function sendNotification(title, body) {
    var notification = new Notification(title, {
        icon: 'icon.png',
        body: body,
    });

    var sound = title == "Error" ? new Audio("fail.ogg") : new Audio("success.ogg");
    sound.play();
}

/**
 * Undoes the last bulb just pushed. Should only work on bulb just pushed
 * @param {function()} callback - the callback function after everything is done
 */
function undoBulb(callback) {
    if (lastItemID) {
        getFromStorage("token", function(token) {
            $.ajax({
                    type: "DELETE",
                    url: "https://api.onedrive.com/v1.0/drive/items/" + lastItemID + "?access_token=" + token
                })
                .done(function(d, status, xhr) {
                    if (xhr.status == 204) {
                        sendNotification("Bulb removed", "The last bulb is removed");
                    } else {
                        sendNotification("Error", "Unable to remove the bulb");
                        console.log(d);
                        console.log(status);
                        console.log(xhr);
                    }
                    lastItemID = undefined;
                })
                .fail(function(xhr, status, error) {
                    sendNotification("Error", "Unable to remove the bulb. The server returns \"" + error + "");
                })
                .always(function() {
                    if (typeof callback === "function") {
                        callback();
                    }
                });
        })
    } else {
        sendNotification("Error", "Track to the last bulb lost");
    }
}