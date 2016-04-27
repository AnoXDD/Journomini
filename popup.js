
/**
 * For fetching login detail from Microsoft
 */

function odauth() {
    ensureHttps();
    var token = getTokenFromCookie(),
		refresh = getRefreshFromCookie();
    if (token) {
        onAuthenticated(token);
    } else if (refresh) {
        refreshToken();
    } else {
        challengeForAuth();
    }
}

// for added security we require https
function ensureHttps() {
    if (window.location.protocol != "https:") {
        window.location.href = "https:" + window.location.href.substring(window.location.protocol.length);
    }
}

function onAuthCallback() {
    var authInfo = getAuthInfoFromUrl(),
		code = authInfo["code"],
		appinfo = window.opener.getAppInfo();
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
			refresh = data["refresh_token"],
			expiry = parseInt(data["expires_in"]);
        window.opener.setCookie(token, expiry, refresh);
        window.opener.onAuthenticated(token, window);
    }).fail(function() {
        alert("Cannot get the code. Did you enable CORS?");
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
        alert("failed to receive auth token");
    }
}

/**
 * Gets a valid access token then do the callback. This method will guarantee token will be available in the next 5 minutes
 * @param {function} callback - the callback function with optional arguments "token" to process the access token later
 * @returns {}
 */
function getTokenCallback(callback) {
    if (getTokenFromCookie()) {
        var token = getTokenFromCookie();
        callback(token);
    } else if (getRefreshFromCookie()) {
        // Previous session expired
        animation.log(log.AUTH_REFRESH_EXPIRED);
        refreshToken(callback);
    }
}

/**
 * Gets the access token from the cookie
 * @param {function} callback - the callback function after retrieving is done
 * @returns {string} - The token if found, empty string otherwise
 */
function getTokenFromCookie(callback) {
    return getFromCookie("odauth", callback);
}

function getRefreshFromCookie(callback) {
    return getFromCookie("refresh", callback);
}

/**
 * Gets the cookie component specifying the name
 * @param {string} name - the name to be searched
 * @returns {string} the result. Empty string if not found
 */
function getFromCookie(name) {
    name += "=";
    var cookies = document.cookie,
		start = cookies.indexOf(name);
    if (start >= 0) {
        start += name.length;
        var end = cookies.indexOf(";", start);
        if (end < 0) {
            end = cookies.length;
        } else {
            postCookie = cookies.substring(end);
        }

        var value = cookies.substring(start, end);
        return value;
    }

    return "";
}

/**
 * Gets the local storage component of this extension specifying the name
 * @param {string} name - the name to be searched
 * @param {function} callback - the callback function after retrieving is done
 */
function getFromStorage(name, callback) {
    chrome.storage.local.get(name, function(result) {
        callback(result.name);
    });
}

/**
 * Sets the cookie of access token and refresh token to cookie
 * @param {string} token - the access token
 * @param {number} expiresInSeconds - the expire time in seconds of access token
 * @param {string} refreshToken - the refresh token
 */
function setCookie(token, expiresInSeconds, refreshToken) {
    var expiration = new Date();
    // Expiration set up back 5 minutes
    expiration.setTime(expiration.getTime() + expiresInSeconds * 1000 - 300000);
    localStorage["expiration"] = expiration.getTime();
    // Access token
    var cookie = "odauth=" + token + "; path=/; expires=" + expiration.toUTCString();
    console.log("setCookie(): cookie = " + cookie);
    if (document.location.protocol.toLowerCase() == "https") {
        cookie = cookie + ";secure";
    }
    document.cookie = cookie;
    // Refresh token
    // Expire after a year
    expiration.setTime(expiration.getTime() + 31536000000);
    cookie = "refresh=" + refreshToken + "; path=/; expires=" + expiration.toUTCString();
    if (document.location.protocol.toLowerCase() == "https") {
        cookie = cookie + ";secure";
    }
    document.cookie = cookie;
}

/**
 * Toggles auto refresh token, the default is true
 */
function toggleAutoRefreshToken() {
    var func = function() {
        refreshToken();
    };
    if (toggleAutoRefreshToken.id) {
        // Turn off auto refresh
        $("#toggle-refresh-token").fadeOut(300, function() {
            $(this).html("&#xf204");
        }).fadeIn(300);
        animation.log(log.AUTH_REFRESH_AUTO_OFF);
        clearInterval(toggleAutoRefreshToken.id);
        toggleAutoRefreshToken.id = undefined;
    } else {
        // Set to refresh token every 30 minute
        $("#toggle-refresh-token").fadeOut(300, function() {
            $(this).html("&#xf205");
        }).fadeIn(300);
        animation.log(log.AUTH_REFRESH_AUTO_ON);
        //refreshToken();
        toggleAutoRefreshToken.id = setInterval(func, 1800000);
    }
}

/**
 * Refreshes the token to get a new access token, then call the callback
 * @param {function} callback - A callback function that can have a parameter to handle the ACCESS TOKEN passed in. This function will only be called if the token is successfully refreshed
 */
function refreshToken(callback) {
    animation.log(log.AUTH_REFRESH_ACCESS_START, 1);
    var refresh = getRefreshFromCookie(),
		appinfo = getAppInfo();
    if (refresh) {
        $.ajax({
            type: "POST",
            url: "https://login.live.com/oauth20_token.srf",
            contentType: "application/x-www-form-urlencoded",
            data: "client_id=" + appinfo.clientId +
				"&redirect_uri=" + appinfo.redirectUri +
				"&client_secret=" + appinfo.clientSecret +
				"&refresh_token=" + refresh +
				"&grant_type=refresh_token"
        }).done(function(data, status, xhr) {
            var token = data["access_token"],
				refresh = data["refresh_token"],
				expiry = parseInt(data["expires_in"]);
            setCookie(token, expiry, refresh);
            animation.log(log.AUTH_REFRESH_ACCESS_END, -1);
            if (typeof (callback) === "function")
                callback(token);
        }).fail(function(xhr, status, error) {
            animation.error(log.AUTH_REFRESH_ACCESS_FAILED + log.SERVER_RETURNS + status + log.SERVER_RETURNS_END, -1);
        });
    } else {
        // No refresh token, then try to sign in
        challengeForAuth();
    }
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



// Add event listener
var signin = document.getElementById("signin");
signin.addEventListener("click", function() {
    // odauth();
    WL.init({
        client_id: "000000004C14D0D9",
        redirect_uri: "https://login.live.com/oauth20_desktop.srf",
        response_type: "code"
    });
    WL.login({
        scope: ["wl.signin" ,"wl.offline_access", "onedrive.readwrite", "onedrive.appfolder"]
    });
});