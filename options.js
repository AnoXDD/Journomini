"use strict";

/**
 * Load the scripts here, strictly follow other examples
 * @type {Array}
 */
var scripts = {
    "FreeFacebook": {
        name       : "FreeFacebook",
        match      : "http://www.facebook.com/*",
        description: "To remove annoying words on Facebook",
        command    : "commands",
        execute    : ""
    },
};

// function freeFacebook() {
//     chrome.storage.local.get("FreeFacebook", function(command) {
//
//         function __plugin_prepFirstTimeSetup() {
//             var version = "1.0.6";
//             if (!localStorage["annoyingStuffsSetupAlready"]) {
//                 var conf = confirm(
//                     "It appears that it is the first time you are using FreeFacebook, so here's something you should know before you start:\n\n1) This plugin uses Cookie. If you don't want it, click CANCEL and uninstall this plugin immediately.\n2) To start with, after the page is loaded, move your cursor to the left bottom of the page. Click the white little square to set up the keywords to be filtered.\n3) If you wish to save the change, click OK on the pop-up window. This change will be saved as long as you don't clear the Cookie on Facebook. If you removed any keyword, you need to refresh the webpage\n\nMade w <3 by Anoxic 2016");
//
//                 if (conf) {
//                     if (localStorage["annoyingStuffsSetupAlready"] !== version) {
//                         console.log("FreeFacebook has been updated to " + version);
//                     }
//                     localStorage["annoyingStuffsSetupAlready"] = version;
//                 }
//
//                 return conf;
//             }
//
//             return true;
//         }
//
//         function __plugin_removeAnnoyingStuffs() {
//             if (!__plugin_prepFirstTimeSetup()) {
//                 return;
//             }
//             console.log("FreeFacebook activated");
//             var keywords = (command || "suggested post,trump,hillary,politics,imwithher")
//                 .split(",");
//
//             // Create a setting stylesheet
//             var css = "#anoxic-plugin-settings{width:10px;height:10px;position:fixed;bottom:0px;left:0px} #anoxic-plugin-settings:hover{background:white}";
//             var style = document.createElement("style");
//
//             if (style.styleSheet) {
//                 style.styleSheet.cssText = css;
//             } else {
//                 style.appendChild(document.createTextNode(css));
//             }
//
//             // Create the interface
//             var div = document.createElement("div");
//             div.id = "anoxic-plugin-settings";
//             div.onclick = () => {
//                 var newKeyword = prompt("Keywords (WHICH CANNOT BE EMPTY), separated using comma (,):", keywords);
//
//                 if (newKeyword) {
//                     localStorage["annoyingStuffsKeyword"] = newKeyword;
//                     keywords = newKeyword.split(",");
//                 }
//             }
//             ;
//
//             // Add to DOM
//             document.getElementsByTagName('head')[0].appendChild(style);
//             document.body.appendChild(div);
//
//             // Yeah I know it's ugly. But so what? It fucking works!
//             setInterval(() => {
//                     var contents = document.getElementsByClassName("userContentWrapper");
//
//                     for (var i = 0; i !== contents.length; ++i) {
//                         var item = contents.item(i);
//                         for (var j = 0; j !== keywords.length; ++j) {
//                             var re = new RegExp(keywords[j], "i");
//                             if (item.textContent.match(re)) {
//                                 var frame = contents.item(i).parentNode.parentNode.parentNode;
//                                 frame.parentNode.removeChild(frame);
//                                 --i;
//                                 console.log("An annoying stuff has been removed");
//                             }
//                         }
//                     }
//                 },
//                 1000
//             )
//             ;
//         }
//
//         /**
//          * $(document).ready(() =>)
//          */
//         function __plugin_ready(f) {
//             if (document.readyState !== "loading") {
//                 f();
//             } else {
//                 document.addEventListener("DOMContentLoaded", f);
//             }
//         }
//
//         __plugin_ready(__plugin_removeAnnoyingStuffs);
//     });
// }

function loadDashboard() {
    for (var key in scripts) {
        if (scripts.hasOwnProperty(key)) {
            var value = scripts[key];
            $("#content").append(
                '<div class="content mdl-layout__content mdl-color--grey-800"> \
                    <div class="card mdl-card mdl-shadow--2dp"> \
                    <div class="title mdl-card__title mdl-color--blue-200"> \
                        <h2 class="mdl-card__title-text mdl-color-text--white">' + value.name + '</h2> \
                    </div> \
                    <div class="mdl-card__supporting-text"> \
                        <p class="mdl-card__subtitle-text mdl-color-text--blue-400">' + value.match + '</p> \
                    </div> \
                    <div class="mdl-card__supporting-text">' + value.description + '</div> \
                        <div class="menu mdl-card__menu"> \
                            <label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="switch-'+ key +'"> \
                                <input type="checkbox" id="switch-'+ key +'" class="mdl-switch__input" checked> \
                                <span class="mdl-switch__label"></span> \
                            </label> \
                        </div> \
                    <div class="actions mdl-card__actions mdl-card--border"> \
                        <div class="mdl-textfield mdl-js-textfield"> \
                        <input class="mdl-textfield__input" type="text" id="command-'+ key +'" placeholder="Command"> \
                        </div> \
                    </div> \
                    </div> \
                </div>'
            );
        }
    }
}

$(document).ready(function() {
    loadDashboard();
});
