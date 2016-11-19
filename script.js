// Watches for the Live Login Popup to store token and closes the window.
window.addEventListener("load", function() {
    console.log("Loading my scripts");

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
            address = window.location.origin + window.location.pathname,
            matchedNames = [];

        for (var key in scripts) {
            if (scripts.hasOwnProperty(key)) {
                var value = scripts[key];
                var name = value.name;

                // Test if the address matches
                for (var i = 0; i !== value.match.length; ++i) {
                    var match = value.match[i];
                    var regex = new RegExp(match.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
                    if (address.match(regex)) {
                        // Add to the queue
                        matchedNames.push(name);
                        break;
                    }
                }
            }
        }

        // Do a little processing here
        var copy = matchedNames.slice();
        for (i = 0; i !== copy.length; ++i) {
            copy[i] += "Disabled";
        }
        copy.push.apply(copy, matchedNames);
        copy.push("scripts");

        // Load the script
        chrome.storage.local.get(copy, function(newData) {
            // Iterate thru each matched name
            for (i = 0; i !== matchedNames.length; ++i) {
                var name = matchedNames[i];
                // Test if it is enabled
                if (!newData[name + "Disabled"]) {
                    // Grab the script
                    var command = newData[name] || "";
                    eval(scripts[name].execute + "('" + command + "')");
                }
            }
        });
    });
});

/**
 * Load the dependencies
 * @param dependencies - a list of file names of dependencies
 * @param callback - the callback function after everything is loaded
 */
function loadScriptDependencies(dependencies, callback) {
    "use strict";
    var leftUnloaded = dependencies.length;

    for (var i = 0; i !== dependencies.length; ++i) {
        var s = document.createElement("script");
        s.src = chrome.extension.getURL(dependencies[i]);
        s.onload = () => {
            if (--leftUnloaded === 0) {
                callback();
            }
        };

        (document.head || document.documentElement).appendChild(s);
    }
}

/**
 * Load CSS dependencies
 * @param dependencies - a list of file names of css dependencies
 */
function loadCssDependencies(dependencies) {
    "use strict";

    for (var i = 0; i !== dependencies.length; ++i) {
        var head = document.getElementsByTagName('head')[0];
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = dependencies[i];
        link.media = 'all';
        head.appendChild(link);
    }
}

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
function closeTabs() {
    document.onkeydown = function(e) {
        if (e.ctrlKey && e.altKey) {
            if (e.keyCode == 65) {
                chrome.runtime.sendMessage({task: "closeLeftTabs"});
            } else if (e.keyCode == 68) {
                chrome.runtime.sendMessage({task: "closeRightTabs"});
            }
        }
    };
}

function passcodeFetcher() {
    "use strict";
    // Load necessary lib files
// Todo remove loaddependicies when this script is ready to go
    loadScriptDependencies(["jquery.min.js", "material.min.js"], ()=> {
        // Create a button on the page
        var $button = $(
            '<button style="position: fixed; bottom: 20px; right: 20px; z-index: 999;" href="#" class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-color--accent mdl-color-text--accent-contrast ">Fetch</button>');
        $button.appendTo("html");
        componentHandler.upgradeDom();

        $button.click(()=> {
            var $dialog = $(
                '<div style="position: fixed; right: 20px; bottom: 60px; z-index: 999;" id="passcode-fetcher">\
                    <div class="mdl-card mdl-shadow--2dp">\
                        <div id="passcode-staus" class="mdl-card__supporting-text"> Backing up...</div>\
                        <div id="passcode-progress" class="mdl-progress mdl-js-progress mdl-progress__indeterminate" style="position: absolute; top: 0;"></div>\
                    </div>\
                </div>'
            );
        });
    });

    loadCssDependencies(["https://code.getmdl.io/1.2.1/material.light_blue-blue.min.css", "https://fonts.googleapis.com/css?family=Roboto:regular,bold,italic,thin,light,bolditalic,black,medium&amp;lang=en"]);
}
