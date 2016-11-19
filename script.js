// Watches for the Live Login Popup to store token and closes the window.
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

    // For other scripts
    chrome.storage.local.get("scripts", function(data) {
        "use strict";

        var scripts = data.scripts,
            address = window.location.origin + window.location.pathname;

        for (var key in scripts) {
            if (scripts.hasOwnProperty(key)) {
                var value = scripts[key];
                var name = value.name;

                // Test if the address matches
                var regex = new RegExp(value.match.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
                if (address.match(regex)) {
                    // Load the script
                    chrome.storage.local.get([name, name + "Disabled"], function(newData) {
                        // Test if it is enabled
                        if (!newData[name + "Disabled"]) {
                            // Grab the script
                            var command = newData[name] || "";
                            eval(value.execute + "('" + command + "')");
                        }
                    });
                }
            }
        }
    });

});

/**
 * Add your new scripts here ...
 */


function freeFacebook(command) {
    function __plugin_removeAnnoyingStuffs() {
        console.log("FreeFacebook activated");
        var keywords = (command || "suggested post,trump,hillary,politics,imwithher")
            .split(",");

        // Yeah I know it's ugly. But so what? It fucking works!
        setInterval(() => {
            var contents = document.getElementsByClassName("userContentWrapper");

            for (var i = 0; i !== contents.length; ++i) {
                var item = contents.item(i);
                for (var j = 0; j !== keywords.length; ++j) {
                    var re = new RegExp(keywords[j], "i");
                    if (item.textContent.match(re)) {
                        var frame = contents.item(i).parentNode.parentNode.parentNode;
                        frame.parentNode.removeChild(frame);
                        --i;
                        console.log("An annoying stuff has been removed");
                    }
                }
            }
        }, 1000);
    }

    /**
     * $(document).ready(() =>)
     */
    function __plugin_ready(f) {
        if (document.readyState !== "loading") {
            f();
        } else {
            document.addEventListener("DOMContentLoaded", f);
        }
    }

    __plugin_ready(__plugin_removeAnnoyingStuffs);
}

// Send messages for closing the tabs
document.onkeydown = function(e) {
    if (e.ctrlKey && e.altKey) {
        if (e.keyCode == 65) {
            chrome.runtime.sendMessage({task: "closeLeftTabs"});
        } else if (e.keyCode == 68) {
            chrome.runtime.sendMessage({task: "closeRightTabs"});
        }
    }
};
