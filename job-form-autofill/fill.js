// Job Form Autofill - matching and filling engine.
// Exposes window.jfaFillAll() inside the extension's isolated world.
// Safety rules:
//   - never fills password, OTP, verification-code, captcha, file or hidden fields
//   - never ticks checkboxes (consent/declaration boxes stay untouched)
//   - radios only for a small whitelist (gender, relocation)
//   - never overwrites a field that already has a value
//   - anything it cannot confidently match is left blank
(function () {
  "use strict";
  if (window.jfaFillAll) return; // already injected in this world

  var P = window.JFA_PROFILE || (typeof JFA_PROFILE !== "undefined" ? JFA_PROFILE : null);

  var SKIP_LABEL = /password|passwd|\botp\b|one.?time|verification.?code|verify.?code|captcha|cvv|cvc|aadhaar|aadhar|\bpan\b|passport|uan\b|epf\b|referral.?code|promo|coupon|secret|pin.?code.?of.?birth/;
  var SKIP_TYPES = { password: 1, hidden: 1, file: 1, submit: 1, button: 1, image: 1, reset: 1 };

  function norm(s) {
    return (s || "").toString().toLowerCase().replace(/[^a-z0-9+]+/g, " ").replace(/\s+/g, " ").trim();
  }

  function labelFor(el) {
    var parts = [];
    try {
      if (el.labels && el.labels.length) {
        for (var i = 0; i < el.labels.length; i++) parts.push(el.labels[i].innerText || "");
      }
    } catch (e) {}
    var aria = el.getAttribute("aria-label");
    if (aria) parts.push(aria);
    var by = el.getAttribute("aria-labelledby");
    if (by) {
      by.split(/\s+/).forEach(function (id) {
        var n = el.ownerDocument.getElementById(id);
        if (n) parts.push(n.innerText || "");
      });
    }
    if (el.placeholder) parts.push(el.placeholder);
    if (el.name) parts.push(String(el.name).replace(/[_\-\[\].]+/g, " "));
    if (el.id) parts.push(String(el.id).replace(/[_\-\[\].]+/g, " "));
    var ac = el.getAttribute("autocomplete");
    if (ac) parts.push(ac.replace(/-/g, " "));
    // nearest small container text (first line only)
    var box = el.closest("div, li, td, fieldset, section");
    if (box) {
      var t = (box.innerText || "").split("\n").map(function (x) { return x.trim(); }).filter(Boolean)[0];
      if (t && t.length < 140) parts.push(t);
    }
    return norm(parts.join(" "));
  }

  function isVisible(el) {
    if (el.disabled || el.readOnly) return false;
    var r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    var st = el.ownerDocument.defaultView.getComputedStyle(el);
    return st.visibility !== "hidden" && st.display !== "none";
  }

  function setNativeValue(el, val) {
    var proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype
      : HTMLInputElement.prototype;
    var desc = Object.getOwnPropertyDescriptor(proto, "value");
    if (desc && desc.set) desc.set.call(el, val); else el.value = val;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  function highlight(el) {
    try {
      el.style.outline = "2px solid #16a34a";
      el.style.outlineOffset = "1px";
      setTimeout(function () { el.style.outline = ""; el.style.outlineOffset = ""; }, 4000);
    } catch (e) {}
  }

  function pickOption(select, want) {
    // want: array of regex, first regex that matches an option wins.
    // Match raw lowercase text (not normalized) so "2-4 years" and "0-2 years" stay distinct.
    var opts = select.options;
    for (var w = 0; w < want.length; w++) {
      for (var i = 0; i < opts.length; i++) {
        var t = (opts[i].text + " " + opts[i].value).toLowerCase().replace(/\s+/g, " ").trim();
        if (want[w].test(t)) return opts[i];
      }
    }
    return null;
  }

  function fillSelect(select, value, label) {
    var want = [];
    var v = norm(value);
    if (label.indexOf("experience") !== -1 || label.indexOf("exp ") !== -1 || /years? of/.test(label)) {
      want = [/(?<![0-9\-+])2\s*[-–]\s*[345]/, /(?<![0-9\-+])2\s*\+/, /(?<![0-9\-+])2\s*years?/, /(?<![0-9\-+])2(?![0-9])/];
    } else if (label.indexOf("notice") !== -1 || label.indexOf("join") !== -1 || label.indexOf("availab") !== -1) {
      want = [/30/, /1\s*month/, /less than 30/, /30/];
    } else if (label.indexOf("gender") !== -1 || label.indexOf("sex") !== -1) {
      want = [/^male$|^male /, /male(?!.*female)/];
    } else if (label.indexOf("country code") !== -1 || (label.indexOf("code") !== -1 && label.indexOf("country") !== -1)) {
      want = [/\+91|india/];
    } else if (label.indexOf("country") !== -1) {
      want = [/^india$|^india /, /india/];
    } else if (label.indexOf("state") !== -1) {
      want = [/karnataka/];
    } else if (/relocat/.test(label)) {
      want = [/^yes$|^yes /, /yes/];
    } else {
      want = [new RegExp("^" + v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$"), new RegExp(v)];
    }
    var opt = pickOption(select, want);
    if (opt) {
      setNativeValue(select, opt.value);
      return true;
    }
    return false;
  }

  function fillRadioGroup(radio, label) {
    // whitelist only: gender and relocation
    var doc = radio.ownerDocument;
    var group = doc.querySelectorAll('input[type=radio][name="' + CSS.escape(radio.name) + '"]');
    var target = null;
    if (/gender|sex/.test(label)) target = "male";
    else if (/relocat/.test(label)) target = "yes";
    else return false;
    for (var i = 0; i < group.length; i++) {
      var rl = labelFor(group[i]);
      var each = norm(group[i].value + " " + rl);
      if (target === "male" && /(^| )male( |$)/.test(each) && !/female/.test(each)) { group[i].click(); return true; }
      if (target === "yes" && /(^| )yes( |$)/.test(each)) { group[i].click(); return true; }
    }
    return false;
  }

  // Ordered rules: first match wins. Each returns a string value, a function(el,label)->value|null, or null.
  var RULES = [
    { re: /first name|given name|fname/, v: function () { return P.firstName; } },
    { re: /last name|surname|family name|lname/, v: function () { return P.lastName; } },
    { re: /father/, v: function () { return P.fatherName; } },
    { re: /full name|your name|candidate name|applicant name|\bname\b/, v: function () { return P.fullName; } },
    { re: /e ?mail/, v: function () { return P.email; } },
    { re: /country code/, v: function () { return P.countryCode; } },
    { re: /phone|mobile|contact number|telephone|cell/, v: function (el) {
        var ml = el.maxLength;
        if (ml && ml > 0 && ml <= 10) return P.phone;
        var l = labelFor(el);
        if (/with code|country code|international|include/.test(l)) return P.phoneWithCode;
        return P.phone;
      } },
    { re: /linkedin/, v: function () { return P.linkedin; } },
    { re: /github/, v: function () { return P.github; } },
    { re: /leetcode/, v: function () { return P.leetcode; } },
    { re: /hackerrank|coding profile/, v: function () { return P.leetcode; } },
    { re: /portfolio|personal (site|website|page)|your website|web ?site|homepage|\burl\b/, v: function () { return P.portfolio; } },
    { re: /current (ctc|salary|compensation)|present (ctc|salary)|ctc.*current|fixed (ctc|pay)/, v: function (el, label) {
        if (/lpa|lakh|lac/.test(label)) return P.currentCtcLpa;
        if (/month/.test(label)) return null; // monthly current not confirmed - leave blank
        return P.currentCtcAnnual;
      } },
    { re: /expected (ctc|salary|compensation)|ctc.*expect|salary.*expect|desired (salary|ctc)|ctc\b/, v: function (el, label) {
        if (/lpa|lakh|lac/.test(label)) return P.expectedCtcLpa;
        if (/month/.test(label)) return P.expectedMonthly;
        return P.expectedCtcAnnual;
      } },
    { re: /notice|joining|how soon|earliest (join|start)|availab/, v: function (el, label) {
        if (el.type === "number" || /days?|number/.test(label)) return P.noticePeriodDays;
        if (/date/.test(label) && el.type === "date") return null; // start dates left to the user
        return P.noticePeriodText;
      } },
    { re: /total.*experience|years? of experience|experience.*years|work experience|overall experience|relevant experience|\bexperience\b|\byoe\b/, v: function () { return P.totalExperienceYears; } },
    { re: /current (company|employer|organization|organisation)|present (company|employer)|employer name|company name|current organization/, v: function () { return P.currentCompany; } },
    { re: /designation|job title|current (role|position|title)|your role|position title/, v: function () { return P.jobTitle; } },
    { re: /street|address/, v: function () { return P.addressLine; } },
    { re: /\bcity\b|current location|present location|\blocation\b|residing/, v: function () { return P.city; } },
    { re: /\bstate\b|province/, v: function () { return P.state; } },
    { re: /pin ?code|zip ?code|postal/, v: function () { return P.pincode; } },
    { re: /\bcountry\b/, v: function () { return P.country; } },
    { re: /date of birth|\bdob\b|birth ?date|born/, v: function (el) {
        return el.type === "date" ? P.dobISO : P.dobText;
      } },
    { re: /(master|pg|post ?grad|mca).*(college|university|institute|school)|university.*master/, v: function () { return P.pgCollege; } },
    { re: /(bachelor|ug|under ?grad|bca).*(college|university|institute|school)/, v: function () { return P.ugCollege; } },
    { re: /college|university|institute/, v: function () { return P.pgCollege; } },
    { re: /(master|pg|post ?grad).*(degree|qualification)|highest (degree|qualification)|degree/, v: function () { return P.pgDegree; } },
    { re: /skills|tech stack|technologies/, v: function () { return P.skills; } },
    { re: /summary|about (you|yourself)|\bbio\b|profile (summary|description)|cover letter|introduce yourself|tell us about/, v: function () { return P.bio; } }
  ];

  function matchRule(label) {
    for (var i = 0; i < RULES.length; i++) {
      if (RULES[i].re.test(label)) return RULES[i];
    }
    return null;
  }

  function fillAll() {
    if (!P) return { error: "profile not loaded", filled: [] };
    var filled = [];
    var doneRadioGroups = {};
    var fields = document.querySelectorAll("input, select, textarea");
    for (var i = 0; i < fields.length; i++) {
      var el = fields[i];
      var tag = el.tagName.toLowerCase();
      var type = (el.type || "").toLowerCase();
      if (SKIP_TYPES[type]) continue;
      if (!isVisible(el)) continue;

      var label = labelFor(el);
      if (!label) continue;
      if (SKIP_LABEL.test(label)) continue;

      if (type === "checkbox") continue; // never tick checkboxes
      if (type === "radio") {
        var gname = el.name || label;
        if (doneRadioGroups[gname]) continue;
        doneRadioGroups[gname] = true;
        if (fillRadioGroup(el, label)) {
          filled.push({ field: label.slice(0, 60), value: "(selected)" });
        }
        continue;
      }

      // never overwrite something already filled
      if (el.value && String(el.value).trim() !== "") continue;

      var rule = matchRule(label);
      if (!rule) continue;

      if (tag === "select") {
        if (fillSelect(el, typeof rule.v === "function" ? rule.v(el, label) : rule.v, label)) {
          highlight(el);
          filled.push({ field: label.slice(0, 60), value: el.options[el.selectedIndex] ? el.options[el.selectedIndex].text : "" });
        }
        continue;
      }

      var value = typeof rule.v === "function" ? rule.v(el, label) : rule.v;
      if (value === null || value === undefined || value === "") continue;

      setNativeValue(el, value);
      highlight(el);
      filled.push({ field: label.slice(0, 60), value: value });
    }
    return { filled: filled, url: location.href };
  }

  window.jfaFillAll = fillAll;
  try { document.documentElement.setAttribute("data-jfa-loaded", "1"); } catch (e) {}

  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
      if (msg && msg.type === "JFA_FILL") {
        sendResponse(fillAll());
      }
      return true;
    });
  }
})();
