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

    // What to show up in the final result, case SENSITIVE
    var filter = ["eBay"];

    /**
     * Set the visitiblity of the progress bar
     * @param isVisible
     */
    function setProgressBarVisibility(isVisible) {
        if (isVisible) {
            $("#passcode-progress").fadeIn();
        } else {
            $("#passcode-progress").fadeOut();
        }
    }

    /**
     * Process the raw fetched data from the server
     * @param data - raw plain csv fetched from server
     */
    function processRawData(data) {
        // Split the data into groups
        data.replace(/\r\n/g, "\n");
        var groups = data.split('\n');

        for (var i = 0; i !== groups.length; ++i) {
            groups[i] = groups[i].split(',');
        }

        return groups;
    }

    // Load necessary lib files
// Todo remove loaddependicies when this script is ready to go
    loadScriptDependencies(["jquery.min.js", "material.min.js"], ()=> {
        // Create a button on the page
        var $button = $(
            '<button style="position: fixed; bottom: 20px; right: 20px; z-index: 999;" href="#" class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-color--accent mdl-color-text--accent-contrast ">Fetch</button>');
        $button.appendTo("html");
        componentHandler.upgradeDom();

        var passcodeSheet;

        $button.click(()=> {
            // Test if the dialog has been initialized
            if (!$("#passcode-fetcher").length) {
                var $dialog = $(
                    '<div style="position: fixed; right: 20px; bottom: 60px; z-index: 999;" id="passcode-fetcher">\
                        <div class="mdl-card mdl-shadow--2dp">\
                            <div id="passcode-status" class="mdl-card__supporting-text"></div>\
                            <div id="passcode-progress" class="mdl-progress mdl-js-progress mdl-progress__indeterminate" style="position: absolute; top: 0;"></div>\
                        </div>\
                    </div>');

                $dialog.hide().appendTo("html");
            }

            setProgressBarVisibility(true);
            $("#passcode-status").removeClass("mdl-color-text--red-600").text("Fetching ...");

            chrome.runtime.sendMessage({task: "passcodeFetch"}, (response)=> {
                setProgressBarVisibility(false);

                // Test if fetching is successful
                if (response.fail) {
                    $("#passcode-status").addClass("mdl-color-text--red-600").text(response.data);
                    return;
                }

                passcodeSheet = processRawData(response.data);

                // Process the cards to be shown in the dialog
                var eligibleCards = {};
                for (var i = 0; i !== passcodeSheet.length; ++i) {
                    for (var j = 0; j !== filter.length; ++j) {
                        if (passcodeSheet[i].indexOf(filter[j]) !== -1) {
                            // Eligible for a code to be given
                            var entry = passcodeSheet[i];
                            var type = entry[1] === "Card" ?
                            entry[0] + " card" :
                                (entry[0] === "Loadout" ? "_Loadout (" + entry[1] + ")" : entry[1]);

                            eligibleCards[type] = eligibleCards[type] || [];

                            eligibleCards[type].push(i);
                        }
                    }
                }

                // Sort them based on the card type
                var sortedCards = [];
                for (var card in eligibleCards) {
                    if (eligibleCards.hasOwnProperty(card)) {
                        sortedCards.push({
                            type: card,
                            data: eligibleCards[card]
                        });
                    }
                }
                eligibleCards.sort((lhs, rhs) => {
                    return lhs.type < rhs.type;
                });

                // Construct DOMs
                $("#passcode-table").remove();
                var $list = '<table id="passcode-table" class="mdl-data-table mdl-shadow--2dp">\
                    <thead><tr>\
                    <th></th>\
                    <th class="mdl-data-table__cell--non-numeric">Type</th>\
                    <th>Quantity</th>\
                    </tr></thead>\
                    <tbody>';

                for (i = 0; i !== sortedCards.length; ++i) {
                    type = sortedCards[i].type;
                    var idName = "passcode" + type.replace(/ /g, "-");

                    $list +=
                        '<tr>\
                        <td>\
                            <label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect mdl-data-table__select" for="' + idName + '">\
                            <input type="checkbox" id="' + idName + '" class="mdl-checkbox__input" />\
                            </label>\
                        </td>\
                        <td class="mdl-data-table__cell--non-numeric">' + type + '</td>\
                        <td>' + sortedCards[i].length + '</td></tr>';
                }

                $list += '</tbody></table>\
                    <div class="mdl-card__actions mdl-card--border">\
                    <button id="passcode-table" class="mdl-button mdl-js-button mdl-button--icon">\
                        <i class="material-icons">file_download</i>\
                    </button>\
                    <button class="mdl-button mdl-js-button mdl-button--icon" style="float:right">\
                        <i class="material-icons">delete</i>\
                    </button>\
                    <button id="passcode-copy" class="mdl-button mdl-js-button mdl-button--icon" disabled>\
                        <i class="material-icons">content_copy</i>\
                    </button>\
                    <div class="mdl-textfield mdl-js-textfield" style="position: absolute; left: 85px; bottom: -9px; width: 200px; resize: none; " readonly>\
                        <textarea class="mdl-textfield__input" type="text" rows= "1" id="passcode-result" ></textarea>\
                        <label class="mdl-textfield__label" for="passcode-result">Passcode will appear here</label>\
                    </div>\
                    </div>';

                $list = $($list);
                $list.insertAfter("#passcode-status");

                componentHandler.upgradeDom();

                // Add event listener: save the data
                $("#passcode-get").click(() => {

                    // Get the transantion ID and amount of money
                    var $panels = $(".transactionRow .highlightTransactionPanel:not(.hide)"),
                        text = "";
                    if (!$panels.length) {
                        text = $panels[0].innerText;
                    }

                    text = text.split("\n");
                    for (var i = 0; i !== text.length; ++i) {
                        if (text[i] === "Transaction ID") {
                            var transactionID = text[i + 1];
                        } else if (text[i].startsWith("Total")) {
                            var total = text[i].substr(6);
                        }
                    }

                    // Get the types of passcode to be fetched
                    $("#passcode-table").find("input").each((index)=> {
                        if ($(this).prop("checked")) {
                            // This is selected
                            sortedCards[index].selected = true;
                        }
                    });

                    // Get the indices of passcode to be fetched
                    var indexToBeProcessed = [],
                        passcodeResult = "";
                    $.each(sortedCards, (index, data)=> {
                        if (data.selected) {
                            // Yes this is a type of which we want code
                            var index = data.data[0];

                            indexToBeProcessed.push(index); // 0 for fetching the first element
                            passcodeResult += data.type + " " + passcodeSheet[index][2] + "\n";

                            // Todo what to do if I want multiple codes?
                        }
                    });

                    var $passcodeStatus = $("#passcode-status");

                    // Abort if no transaction ID and total is fetched
                    if (!transactionID || !total) {
                        $passcodeStatus
                            .addClass("mdl-color-text--red-600")
                            .text("No transaction ID or total found");
                        return;
                    }

                    // Update the passcode sheet
                    $.each(indexToBeProcessed, (i, index) => { // `index` is what we want
                        passcodeSheet[index][5] = total;
                        passcodeSheet[index][6] = transactionID;
                    });

                    // Finally, upload it
                    chrome.runtime.sendMessage({
                        task: "passcodeSave",
                        data: passcodeSheet.join("\n")
                    }, (response) => {
                        if (response.fail) {
                            $passcodeStatus.addClass("mdl-color-text--red-600")
                                .text(response.data);
                            return;
                        }

                        // Success!
                        $passcodeStatus.text("Passcode uploaded");

                        $("#passcode-copy").prop("disabled", false).click();
                    })
                });

                // Add event listener for copy
                $("#passcode-copy").click(() => {
                    // Copy to the clipboard
                    $("#passcode-result").focus().setSelectionRange(0, target.value.length);
                    document.execCommand("copy");
                });
            });

            // Todo Add event listener to close the dialog

        });
    });

    loadCssDependencies(["https://code.getmdl.io/1.2.1/material.light_blue-blue.min.css", "https://fonts.googleapis.com/css?family=Roboto:regular,bold,italic,thin,light,bolditalic,black,medium&amp;lang=en", "https://fonts.googleapis.com/icon?family=Material+Icons"]);
}
