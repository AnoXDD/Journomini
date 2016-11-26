"use strict";

// What to show up in the final result, case SENSITIVE
var filter = ["eBay"];
const STATUS_RED_CLASS = "mdl-color-text--red-600";
const STATUS_GREEN_CLASS = "mdl-color-text--green-500";

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

/**
 * Add a passcode entry to the whole history
 * @param passcode - The passcode that fetched
 * @param transactionID - the ID of this transaction
 * @param total - the total of this transaction ($34, e.g.)
 */
function addEntryToPasscodeHistory(passcode, transactionID, total) {
    $("#passcode-history").find("tbody").prepend(
        '<tr class="passcode-history-row">\
                    <td class="mdl-data-table__cell--non-numeric">' + new Date().toTimeString()
            .substr(0, 8) + '</td>\
                            <td class="mdl-data-table__cell--non-numeric passcode-col">' + passcode + '</td>\
                            <td class="mdl-data-table__cell--non-numeric transaction-id-col">' + transactionID + '</td>\
                            <td>' + total + '</td>\
                            </tr>\
                            ');
}

/**
 * For debug only. Push a new entry to the history table
 */
function debug__addEntryToPasscodeHistory(lineOfPasscode) {
    lineOfPasscode = lineOfPasscode || 1;

    var passcode = [];
    for (var i = 0; i !== lineOfPasscode; ++i) {
        passcode.push("Passcode PASSCODELONGENOUGH");
    }

    addEntryToPasscodeHistory(passcode.join('\n'), "00000000000000000", parseInt(Math.random() * 1000) / 100);
}

function updateTableInformation() {

    /**
     * Get eligible cards from passcode sheet
     * @param passcodeSheet
     */
    function getEligibleCards(passcodeSheet) {
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

        return eligibleCards;
    }

    /**
     * Append the action bar in the table tab
     */
    function appendActionBar() {
        if (!$("#passcode-actions").length) {
            var $list = $(
                '<div id="passcode-actions" class="mdl-card__actions mdl-card--border" style="min-height: 0;">\
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
    }

    /**
     * Get sorted cards from eligible cards, by the card type
     * @param eligibleCards
     * @returns {Array}
     */
    function getSortedCards(eligibleCards) {
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
        return sortedCards;
    }

    /**
     * Construct the passcode table
     * @param sortedCards - the data to be translated into table
     */
    function constructPasscodeTable(sortedCards) {
        $("#passcode-table").remove();
        var $list = '<table id="passcode-table" class="mdl-data-table mdl-shadow--2dp">\
                    <thead><tr>\
                    <th class="checkbox-col"></th>\
                    <th class="mdl-data-table__cell--non-numeric type-col">Type</th>\
                    <th>Quantity</th>\
                    </tr></thead>\
                    <tbody>';

        for (var i = 0; i !== sortedCards.length; ++i) {
            var type = sortedCards[i].type;
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
    }

    /**
     * Get recent redemption history
     * @param passcodeSheet - the passcode sheet
     * @param num - the limit of number to be shown on the table
     */
    function getRecentHistory(passcodeSheet, num) {
        num = num || 10;

        var recentHistory = passcodeSheet.sort((lhs, rhs) => {
            return (Date.parse(lhs || 1000000000000000) || 1000000000000000) - (Date.parse(rhs || 1000000000000000) || 1000000000000000);
        });

        // Remove element shown as redeemed
        for (var i = 0; i !== num; ++i) {
            if (!Date.parse(recentHistory[i][4])) {
                break;
            }
        }

        return recentHistory.slice(0, i);
    }

    /**
     * Append the history to the table
     * @param recentHistory - the recent history
     */
    function appendHistoryToTable(recentHistory) {
        for (var i = 0; i !== recentHistory.length; ++i) {
            addEntryToPasscodeHistory(recentHistory[i][2], recentHistory[i][6], recentHistory[i][5]);
        }
    }


    var passcodeSheet;

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

        // Update the history
        var recentHistory = getRecentHistory(passcodeSheet);
        appendHistoryToTable(recentHistory);

        // Process the cards to be shown in the dialog
        var eligibleCards = getEligibleCards(passcodeSheet),
            sortedCards = getSortedCards(eligibleCards);

        // Construct DOMs
        constructPasscodeTable(sortedCards);

        // Append the action bar
        appendActionBar();

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
                passcodeSheet[index][5] = (total / indexToBeProcessed.length).toFixed(2);
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
                    $passcodeStatus.addClass(STATUS_RED_CLASS).text("Not found");
                } else if (index === -2) {
                    // Multiple found
                    $passcodeStatus.removeClass(STATUS_RED_CLASS).text("Multiple found");
                } else {
                    // Found a single one
                    $passcodeStatus.removeClass(STATUS_RED_CLASS).text("Found");
                }

                // Display the result
                var result = passcodeSheet[index] || [];

                $("#passcode-query-result").find("td:nth-child(2)").each(function(index) {
                    var text = result[index],
                        elemClass;


                    if (text === undefined) {
                        text = "N/A";
                        elemClass = STATUS_RED_CLASS;
                    } else if (text === "") {
                        text = "[Empty]";
                        elemClass = STATUS_RED_CLASS;
                    }

                    $(this).removeClass().addClass(elemClass).text(text);

                    // Render the class if hit certain word
                    if (text === "eBay" ||
                        !$(this).hasClass(STATUS_RED_CLASS) && $(this).prev().text() === "Redeemed at") {
                        $(this).addClass(STATUS_GREEN_CLASS);
                    }
                });

            }
        });
    });

    $("#passcode-fetcher").fadeIn();
}

$(document).ready(() => {
    updateTableInformation();
});
