document.getElementById("fill").addEventListener("click", async function () {
  var status = document.getElementById("status");
  status.textContent = "Filling...";
  try {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    var tab = tabs[0];
    if (!tab || !/^https?:|^file:/.test(tab.url || "")) {
      status.textContent = "This page cannot be filled (not a web page).";
      return;
    }
    var results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: function () {
        return window.jfaFillAll ? window.jfaFillAll() : null;
      }
    });
    var filled = [];
    var sawWorld = false;
    (results || []).forEach(function (r) {
      if (r && r.result) {
        sawWorld = true;
        if (r.result.filled) filled = filled.concat(r.result.filled);
      }
    });
    if (!sawWorld) {
      status.textContent = "Could not reach this page. If this is a file:// page, enable 'Allow access to file URLs' for this extension on chrome://extensions, then reload the page.";
      return;
    }
    if (filled.length === 0) {
      status.textContent = "No matching empty fields found on this page.\nFields that were already filled, passwords, OTPs and checkboxes were left alone.";
      return;
    }
    var lines = ["Filled " + filled.length + " field" + (filled.length > 1 ? "s" : "") + ":"];
    filled.forEach(function (f) { lines.push("- " + f.field + "  ->  " + f.value); });
    lines.push("\nPlease review everything before submitting.");
    status.textContent = lines.join("\n");
  } catch (e) {
    status.textContent = "Error: " + (e && e.message ? e.message : e);
  }
});
