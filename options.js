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
                    '<div class="content mdl-layout__content mdl-color--grey-800"> \
                        <div class="card mdl-card mdl-shadow--2dp"> \
                            <div class="title mdl-card__title mdl-color--blue-200"> \
                            <h2 class="mdl-card__title-text mdl-color-text--white">' + name + '</h2> \
                            </div> \
                            <div class="mdl-card__supporting-text"> \
                                <p class="mdl-card__subtitle-text mdl-color-text--blue-400">' + value.match + '</p> \
                            </div> \
                            <div class="mdl-card__supporting-text">' + value.description + '</div> \
                            <div class="menu mdl-card__menu"> \
                            <label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="switch-' + key + '"> \
                                <input type="checkbox" id="switch-' + key + '" class="mdl-switch__input" checked> \
                                <span class="mdl-switch__label"></span> \
                            </label> \
                            </div> \
                            <div class="actions mdl-card__actions mdl-card--border"> \
                                <div class="mdl-textfield mdl-js-textfield"> \
                                    <input class="mdl-textfield__input" type="text" id="command-' + key + '" \
                        placeholder="Command"> \
                                </div> \
                            </div> \
                        </div> \
                    </div>');

                $newElem.find(".mdl-textfield__input").blur(function() {
                    var obj = {},
                        val = $(this).val();
                    obj[name] = val;
                    chrome.storage.local.set(obj);
                });

                $("#content").append($newElem);

                // Get the storage data
                chrome.storage.local.get(name, function(data) {
                    $newElem.find(".mdl-textfield__input").val(data[name]);
                });
            }
        }
    });
}

$(document).ready(function() {
    loadDashboard();
});
