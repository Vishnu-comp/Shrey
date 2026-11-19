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
    var logs = [];
    var sawWorld = false;
    (results || []).forEach(function (r) {
      if (r && r.result) {
        sawWorld = true;
        if (r.result.filled) filled = filled.concat(r.result.filled);
        if (r.result.log) logs = logs.concat(r.result.log);
      }
    });
    if (!sawWorld) {
      status.textContent = "Could not reach this page. If this is a file:// page, enable 'Allow access to file URLs' for this extension on chrome://extensions, then reload the page.";
      return;
    }
    var lines = [];
    if (logs.length) {
      logs.forEach(function (l) { lines.push("* " + l); });
      lines.push("");
    }
    if (filled.length === 0) {
      lines.push("No matching empty fields found on this page.");
      lines.push("Fields that were already filled, passwords, OTPs and checkboxes were left alone.");
    } else {
      lines.push("Filled " + filled.length + " field" + (filled.length > 1 ? "s" : "") + ":");
      filled.forEach(function (f) { lines.push("- " + f.field + "  ->  " + f.value); });
      lines.push("\nPlease review everything before submitting.");
    }
    status.textContent = lines.join("\n");
  } catch (e) {
    status.textContent = "Error: " + (e && e.message ? e.message : e);
  }
});
