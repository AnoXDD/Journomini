// Watches for the Live Login Popup to store token and closes the wnidow.
window.addEventListener("load", function() {

    chrome.storage.local.get("enable", function(result) {
        if (result.enable == "enable") {
            if (window.location.origin + window.location.pathname == "http://anoxic.me/journal/callback.html") {
                var search = window.location.search;
                // Get refresh token
                var prefix = "?code=";

                var start = search.indexOf(prefix);
                if (start >= 0) {
                    start = start + prefix.length;

                    var code = search.substring(start);

                    // Store it
                    chrome.storage.local.set({"code": code});

                    // Close the window
                    window.close();
                }
            }
        }

    });

});

// Send messages for closing the tabs
console.log("here");
document.onkeydown = function(e) {
    if (e.ctrlKey && e.altKey) {
        console.log("ctrl+alt!");
        if (e.keyCode == 65) {
            chrome.runtime.sendMessage({task: "closeLeftTabs"});
        } else if (e.keyCode == 68) {
            chrome.runtime.sendMessage({task: "closeRightTabs"});
        }
    }
};
