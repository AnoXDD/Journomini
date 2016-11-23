// Watches for the Live Login Popup to store token and closes the window.
window.addEventListener("load", function() {
    console.log("Loading my scripts");

    chrome.storage.local.get("enable", function(result) {
        if (result.enable == "enable") {
            if (window.location.origin + window.location.pathname == "http://anoxic.me/journal/callbackJournomini.html") {
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

function eBayPreProcessor() {
    "use strict";

    $(document).ready(function() {
        var $process = $(
            '<a style="padding: 0 10px 10px;display: block;" href="javacript:;">Process!</a>');

        $process.click(function() {
            // Surround the area
            var __decode = function(str) {
                var ret = "";
                for (var i = 0; i !== str.length; ++i) {
                    ret += String.fromCharCode(str.charCodeAt(i) ^ 3);
                }
                return ret;
            };
            $("#msg_cnt_cnt")
                .val(__decode("Wkbmhp#elq#zlvq#jmwfqfpw-#Kfqf$p#zlvq#`lgf9#		") + $("#msg_cnt_cnt")
                        .val() + __decode("		Sofbpf#ofbuf#nf#b#slpjwjuf#effgab`h#je#zlv#fmilz-#Kbuf#b#dqfbw#gbz#9*"));
        }).prependTo($("#CUSubmitForm .tas"));

        // Make the item price changable
        $("#itemPrice")
            .replaceWith('$<input onclick="this.select()" id="itemPrice" value="' + $("#itemPrice")
                    .text()
                    .substr(1) + '">');
    });
}

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
    const STATUS_RED_CLASS = "mdl-color-text--red-600";

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
        var groups = data.replace(/\r/g, "").split('\n');

        for (var i = 0; i !== groups.length; ++i) {
            if (groups[i].length) {
                groups[i] = groups[i].split(',');
            } else {
                groups.splice(i--, 1);
            }
        }

        return groups;
    }

    /**
     * Get the transaction ID and total from PayPal
     * @returns {{transactionID: *, total: string}}
     */
    function getTransactionIDandTotalFromPayPal() {
        var $panels = $(".transactionRow .highlightTransactionPanel:not(.hide)"),
            text = "";
        if ($panels.length) {
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
        return {
            transactionID: transactionID,
            total        : total
        };
    }

    /**
     * Get the transaction ID and total from eBay
     * @returns {{transactionID: *, total: *}}
     */
    function getTransactionIDandTotalFromeBay() {
        var userName = $("#CUSubmitForm .greet-user").text().substr(3, 4),
            total = parseInt($("#itemPrice").val() || $("#itemPrice").text().substr(1)) * 0.87 - 0.03;

        if (total) {
            total = total.toFixed(2);
        } else {
            total = undefined;
        }

        var transactionID = ($("#itemDetailsBody .fnt_14px").eq(1).text() || "") + " " + userName;

        return {
            transactionID: transactionID,
            total        : total
        };
    }

    /**
     * Get the transaction ID and total from webpage. The bahavior is different depending on if it's eBay or PayPal
     * @returns {{transactionID: *, total: string}}
     */
    function getTransactionIDandTotalFromPage() {
        if (window.location.origin == "http://contact.ebay.com") {
            return getTransactionIDandTotalFromeBay();
        } else {
            return getTransactionIDandTotalFromPayPal();
        }
    }

    // Todo remove loaddependicies when this script is ready to go
    loadScriptDependencies(["static/js/lib/jquery.min.js", "static/js/lib/material.min.js"], ()=> {
        // Create a button on the page
        var $button = $(
            '<button style="position: fixed; bottom: 25px; right: 20px; z-index: 999;" id="passcode-start" href="#" class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-color--accent mdl-color-text--accent-contrast ">Fetch</button>');
        $button.appendTo("html");
        componentHandler.upgradeDom();

        var passcodeSheet;

        $button.click(()=> {
            // Test if the dialog has been initialized
            if (!$("#passcode-fetcher").length) {
                var $dialog = $(
                    '<div style="position: fixed; right: 20px; bottom: 20px; z-index: 999; font-family: Roboto;" id="passcode-fetcher">\
                        <div class="mdl-card mdl-shadow--2dp" style="width: 480px; margin-right: 10px; display: inline-block; min-height: 0px;">\
                            <table id="passcode-history" class="mdl-data-table mdl-shadow--2dp" style="width: calc(100% + 17px); max-height: 500px; overflow-y: visible; overflow-x: hidden; display: block;">\
                            <thead><tr>\
                                <th class="mdl-data-table__cell--non-numeric">Time</th>\
                                <th class="mdl-data-table__cell--non-numeric">Passcode</th>\
                                <th class="mdl-data-table__cell--non-numeric">Transaction ID</th>\
                                <th>Total</th>\
                            </tr></thead><tbody></tbody>\
                            </table>\
                        </div>\
                        <div class="mdl-card mdl-shadow--2dp" style="min-height: 0; display: inline-block;">\
                            <div class="mdl-tabs mdl-js-tabs mdl-js-ripple-effect">\
                                <div id="passcode-status" class="mdl-card__supporting-text" style="text-align: center; align-self: center; width: 100%;"></div>\
                                <div class="mdl-tabs__tab-bar">\
                                    <a href="#passcode-table-panel" style="text-decoration: initial; font-family: inherit; outline: none; outline-offset: initial;" class="mdl-tabs__tab is-active">Table</a>\
                                    <a href="#query-panel" style="text-decoration: initial; font-family: inherit; outline: none; outline-offset: initial;" class="mdl-tabs__tab">Query</a>\
                                </div>\
                                <div class="mdl-tabs__panel is-active" id="passcode-table-panel"></div>\
                                <div class="mdl-tabs__panel" id="query-panel">\
                                    <div id="passcode-query-result"></div>\
                                    <div class="mdl-textfield mdl-js-textfield">\
                                        <input class="mdl-textfield__input" type="text" id="passcode-query">\
                                        <label class="mdl-textfield__label" for="passcode-query">Query</label>\
                                    </div>\
                                </div>\
                            </div>\
                            <div id="passcode-progress" class="mdl-progress mdl-js-progress mdl-progress__indeterminate" style="position: absolute; top: 0;"></div>\
                        </div>\
                    </div>');

                $dialog.hide().appendTo("html");
                $("#passcode-history").parent().hide();
                componentHandler.upgradeDom();
            }

            setProgressBarVisibility(true);

            $("#passcode-status").removeClass(STATUS_RED_CLASS).text("Fetching ...");

            chrome.runtime.sendMessage({task: "passcodeFetch"}, (response)=> {
                setProgressBarVisibility(false);

                // Test if fetching is successful
                if (response.fail) {
                    $("#passcode-status").addClass(STATUS_RED_CLASS).text(response.data);
                    return;
                }

                passcodeSheet = processRawData(response.data);

                // Process the cards to be shown in the dialog
                var eligibleCards = {};
                for (var i = 0; i !== passcodeSheet.length; ++i) {
                    for (var j = 0; j !== filter.length; ++j) {
                        if (passcodeSheet[i].indexOf(filter[j]) !== -1 && !passcodeSheet[i][5].length) {
                            // Eligible for a code to be given
                            var entry = passcodeSheet[i];
                            var type = entry[1] === "Card" ?
                            entry[0] + " card" :
                                (entry[0] === "Loadout" ? " Loadout (" + entry[1] + ")" : entry[1]);

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

                sortedCards = sortedCards.sort((lhs, rhs) => {
                    return lhs.type.localeCompare(rhs.type);
                });

                // Construct DOMs
                $("#passcode-table").remove();
                var $list = '<table id="passcode-table" class="mdl-data-table mdl-shadow--2dp" style="width: 347px; max-height: 500px; overflow-y: visible; overflow-x: hidden; display: block;">\
                    <thead><tr>\
                    <th style="width: 60px;"></th>\
                    <th style="width: 180px;" class="mdl-data-table__cell--non-numeric">Type</th>\
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
                        <td>' + sortedCards[i].data.length + '</td></tr>';
                }

                $list += '</tbody></table>';

                $list = $($list);
                $list.prependTo("#passcode-table-panel");

                // Append the action bar
                if (!$("#passcode-actions").length) {
                    $list = $(
                        '<div class="mdl-card__menu" style="right: 5px; top: 10px;">\
                        <button id="passcode-close" class="mdl-button mdl-js-button mdl-button--icon">\
                            <i class="material-icons">close</i>\
                        </button>\
                        </div>\
                        <div id="passcode-actions" class="mdl-card__actions mdl-card--border" style="min-height: 0;">\
                        <button id="passcode-get" class="mdl-button mdl-js-button mdl-button--icon">\
                            <i class="material-icons">file_download</i>\
                        </button>\
                        <button class="mdl-button mdl-js-button mdl-button--icon">\
                            <i class="material-icons">delete</i>\
                        </button>\
                        <button id="passcode-copy" class="mdl-button mdl-js-button mdl-button--icon" disabled>\
                            <i class="material-icons">content_copy</i>\
                        </button>\
                        <div class="mdl-textfield mdl-js-textfield" style="position: absolute; right: 3px; bottom: -9px; width: 200px; resize: none; " readonly>\
                            <textarea class="mdl-textfield__input" type="text" rows= "1" id="passcode-result" style="resize: none; font-family: Roboto; font-size: 12px; " readonly></textarea>\
                            <label class="mdl-textfield__label" for="passcode-result" style="font-family: Roboto"></label>\
                        </div>\
                        </div>');

                    $list.insertAfter("#passcode-table");
                }

                // Update message
                var $passcodeStatus = $("#passcode-status");
                $passcodeStatus.text("Fetched");

                componentHandler.upgradeDom();

                // These can only be done when all the components are loaded
                setProgressBarVisibility(false);
                $("#passcode-table").find("td:nth-child(1)").width(0);

                // Add event listener: save the data
                $("#passcode-get").unbind("click").click(() => {
                    setProgressBarVisibility(true);
                    $passcodeStatus.removeClass(STATUS_RED_CLASS).text("Updating passcode ...");

                    // Get the transantion ID and amount of money
                    var __ret = getTransactionIDandTotalFromPage();
                    var transactionID = __ret.transactionID;
                    var total = __ret.total;

                    // Abort if no transaction ID and total is fetched
                    if (!transactionID || !total) {
                        $passcodeStatus
                            .addClass(STATUS_RED_CLASS)
                            .text("No transaction ID or total found");
                        setProgressBarVisibility(false);
                        return;
                    }

                    // Get the types of passcode to be fetched
                    $("#passcode-table").find("input").each(function(index) {
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

                    // Abort if nothing is selected
                    if (!indexToBeProcessed.length) {
                        $passcodeStatus
                            .addClass(STATUS_RED_CLASS)
                            .text("Nothing is selected");
                        setProgressBarVisibility(false);
                        return;
                    }

                    // Update the passcode sheet
                    $.each(indexToBeProcessed, (i, index) => { // `index` is what we want
                        passcodeSheet[index][4] = new Date().toISOString();
                        passcodeSheet[index][5] = total;
                        passcodeSheet[index][6] = transactionID;
                    });

                    // Finally, upload it
                    chrome.runtime.sendMessage({
                        task: "passcodeSave",
                        data: passcodeSheet.join("\n")
                    }, (response) => {
                        if (response.fail) {
                            $passcodeStatus.addClass(STATUS_RED_CLASS)
                                .text(response.data);
                            setProgressBarVisibility(false);
                            return;
                        }

                        // Success!
                        passcodeResult = passcodeResult.substr(0, passcodeResult.length - 1);
                        $("#passcode-result").val(passcodeResult);
                        $("#passcode-copy").prop("disabled", false);

                        // Add to history
                        $("#passcode-history").parent().fadeIn();
                        $("#passcode-history").find("tbody").prepend(
                            '<tr class="passcode-history-row">\
                            <td class="mdl-data-table__cell--non-numeric" style="white-space: pre; width: 64px;">' + new Date().toTimeString()
                                .substr(0, 8) + '</td>\
                            <td class="mdl-data-table__cell--non-numeric" style="white-space: pre; max-width: 220px;">' + passcodeResult + '</td>\
                            <td class="mdl-data-table__cell--non-numeric" style="font-family: monospace;">' + transactionID + '</td>\
                            <td>' + total + '</td>\
                            </tr>\
                            ');

                        // Refresh the table because something was just changed
                        $("#passcode-start").click();
                    });
                });

                // Add event listener for copy
                $("#passcode-copy").unbind("click").click(() => {
                    // Copy to the clipboard
                    var result = document.getElementById("passcode-result");
                    result.focus();
                    result.setSelectionRange(0, result.value.length);

                    document.execCommand("copy");
                });

                // Add event listener to close the dialog
                $("#passcode-close").unbind("click").click(() => {
                    $("#passcode-fetcher").fadeOut();
                });

                // Add event listener for querying the passcode
                $("#passcode-query").unbind("input").on("input", () => {
                    var query = $("#passcode-query").val().toUpperCase(),
                        index = -1;

                    if (query.length >= 3) {
                        // Do a linear search
                        for (var i = 0; i !== passcodeSheet.length; ++i) {
                            if (passcodeSheet[i][2].startsWith(query)) {
                                if (index !== -1) {
                                    // Multiple entries found
                                    index = -2;
                                    break;
                                }

                                index = i;
                            }
                        }

                        if (index === -1) {
                            // Nothing found
                            var result = "404";
                        } else if (index === -2) {
                            // Multiple found
                            result = "Multiple found";
                        } else {
                            result = passcodeSheet[index];
                        }

                        // Render the result
                        $("#passcode-query-result").html(result);
                    }
                });
            });

            $("#passcode-fetcher").fadeIn();
        });
    });

    loadCssDependencies(["https://code.getmdl.io/1.2.1/material.light_blue-blue.min.css", chrome.extension.getURL(
        "static/css/lib/material_icons.css")]);
}
