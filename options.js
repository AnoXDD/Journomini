"use strict";


function loadDashboard() {
    // Load the data from chrome.storage
    chrome.storage.local.get("scripts", function(data) {
        var scripts = data.scripts;

        for (var key in scripts) {
            if (scripts.hasOwnProperty(key)) {
                var value = scripts[key];
                var name = value.name;
                var $newElem = $(
                    '<div class="content mdl-grid mdl-layout__content mdl-color--grey-100"> \
                        <div class="card mdl-cell mdl-cell--4-col mdl-cell--4-col-offset mdl-card mdl-shadow--2dp"> \
                            <div class="mdl-card__title mdl-color--blue-900"> \
                                <h2 class="title mdl-card__title-text mdl-color-text--white">' + name + '</h2> \
                                <p class="match mdl-card__subtitle-text mdl-color-text--white">' + value.match + '</p> \
                            </div> \
                            <div class="support mdl-card__supporting-text">' + value.description + '</div> \
                            <div class="menu mdl-card__menu"> \
                                <input type="checkbox" id="switch-' + key + '" class="switch-input" hidden="hidden" checked> \
                                <label class="switch" for="switch-' + key + '"></label> \
                            </div>'+ (value.command ?
                            '<div class="actions mdl-card__actions mdl-card--border"> \
                                <div class="mdl-textfield mdl-js-textfield"> \
                                    <input class="mdl-textfield__input" type="text" id="command-' + key + '" \
                        placeholder="Command"> \
                                </div> \
                            </div>' : '') +
                        '</div> \
                    </div>');

                // Update the command
                $newElem.find(".mdl-textfield__input").blur(function() {
                    var obj = {};
                    obj[name] = $(this).val();
                    chrome.storage.local.set(obj);
                });

                $newElem.find(".switch-input").change(function() {
                    if (this.checked) {
                        chrome.storage.local.remove(name + "Disabled");
                    } else {
                        var obj = {};
                        obj[name + "Disabled"] = true;
                        chrome.storage.local.set(obj);
                    }
                });

                $("#content").append($newElem);

                // Get the storage data
                chrome.storage.local.get([name, name + "Disabled"], function(data) {
                    $newElem.find(".mdl-textfield__input").val(data[name]);
                    $newElem.find(".switch-input").prop("checked", !data[name + "Disabled"]);
                });
            }
        }
    });
}

$(document).ready(function() {
    loadDashboard();
});
