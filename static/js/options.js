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
          `<div id=${name} class="content"> 
            <div class="mdl-card mdl-shadow--2dp"> 
                <div class="mdl-card__title"> 
                    <h2 class="mdl-card__title-text">${name}</h2> 
                </div> 
                <div class="mdl-card__supporting-text">
                    <p class="match mdl-card__subtitle-text">
                        ${value.match.join(", ")}
                    </p> 
                    ${value.description} 
                </div> 
              
          ${value.command ?
            `<div class="mdl-card__actions mdl-card--border"> 
              <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
                  <input class="mdl-textfield__input" type="text" id="command-${key}"/>
                  <label class="mdl-textfield__label" for="command-${key}">Command</label>
              </div>` :
            ''}
          
            <div class="mdl-card__menu"> 
                <input type="checkbox" id="switch-${key}" class="switch-input" hidden="hidden" checked> 
                <label class="switch" for="switch-${key}"></label> 
            </div>
          </div> 
      </div>`);

        $("#content").append($newElem);
      }

    }

    // Add listener for changing the values
    $(".content").each(function() {
      var name = $(this).prop("id");
      // Update the command
      $(this).find(".mdl-textfield__input").blur(function() {
        var obj = {};
        obj[name] = $(this).val();
        chrome.storage.local.set(obj);
      });

      $(this).find(".switch-input").change(function() {
        if (this.checked) {
          chrome.storage.local.remove(name + "Disabled");
        } else {
          var obj = {};
          obj[name + "Disabled"] = true;
          chrome.storage.local.set(obj);
        }
      });
    });

    // Get all the querying keys
    var keys = Object.keys(scripts);
    for (var i = 0; i !== keys.length; ++i) {
      keys[i] += "Disabled";
    }
    keys.push.apply(keys, Object.keys(scripts));

    // With that, get the storage data
    chrome.storage.local.get(keys, function(data) {
      for (var key in scripts) {
        if (scripts.hasOwnProperty(key)) {
          $("#" + key + " .mdl-textfield__input").val(data[key]);
          $("#" + key + " .switch-input")
            .prop("checked", !data[key + "Disabled"]);
        }
      }

      // Upgrade DOM
      componentHandler.upgradeDom();
    });


  });
}

$(document).ready(function() {
  loadDashboard();
});
