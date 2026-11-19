// Job Form Autofill - matching and filling engine.
// Exposes window.jfaFillAll() inside the extension's isolated world.
// Works on plain pages, Workday/Greenhouse/Lever/Oracle/Eightfold/Naukri-style
// forms, LinkedIn Easy Apply, Google Forms, shadow DOM and same-origin iframes.
//
// Safety rules (unchanged):
//   - never fills password, OTP, verification-code, captcha, file or hidden fields
//   - never ticks checkboxes (consent/declaration boxes stay untouched)
//   - radios only for a small whitelist (gender, relocation)
//   - never overwrites a field that already has a value
//   - never clicks Submit/Send/Apply/Next or any navigation button
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

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // ---------- deep DOM traversal (shadow roots + same-origin iframes) ----------

  // All elements matching selector, descending into open shadow roots.
  function deepQueryAll(root, selector, out) {
    out = out || [];
    try {
      var found = root.querySelectorAll(selector);
      for (var i = 0; i < found.length; i++) out.push(found[i]);
      var all = root.querySelectorAll("*");
      for (var j = 0; j < all.length; j++) {
        if (all[j].shadowRoot) deepQueryAll(all[j].shadowRoot, selector, out);
      }
    } catch (e) {}
    return out;
  }

  // Documents to scan: the main document plus same-origin iframe documents.
  function collectDocuments(doc, out, depth) {
    out = out || [];
    depth = depth || 0;
    if (depth > 3) return out;
    out.push(doc);
    var frames = doc.querySelectorAll("iframe, frame");
    for (var i = 0; i < frames.length; i++) {
      try {
        var fd = frames[i].contentDocument;
        if (fd && fd.body) collectDocuments(fd, out, depth + 1);
      } catch (e) { /* cross-origin frame - left for the frame's own content script */ }
    }
    return out;
  }

  // ---------- labelling ----------

  function textOf(node) {
    var t = (node && (node.innerText || node.textContent)) || "";
    return t.replace(/\s+/g, " ").trim();
  }

  function labelFor(el) {
    var parts = [];
    try {
      if (el.labels && el.labels.length) {
        for (var i = 0; i < el.labels.length; i++) parts.push(textOf(el.labels[i]));
      }
    } catch (e) {}
    var attrs = ["aria-label", "placeholder", "title", "data-automation-id", "data-testid", "data-test-id"];
    for (var a = 0; a < attrs.length; a++) {
      var av = el.getAttribute(attrs[a]);
      if (av) parts.push(av.replace(/[_\-\[\].]+/g, " "));
    }
    var by = el.getAttribute("aria-labelledby");
    if (by) {
      by.split(/\s+/).forEach(function (id) {
        var n = el.ownerDocument.getElementById(id);
        if (n) parts.push(textOf(n));
      });
    }
    if (el.name) parts.push(String(el.name).replace(/[_\-\[\].]+/g, " "));
    if (el.id) parts.push(String(el.id).replace(/[_\-\[\].]+/g, " "));
    var ac = el.getAttribute("autocomplete");
    if (ac) parts.push(ac.replace(/-/g, " "));
    // group/fieldset legend (Workday and Google Forms group questions this way)
    var grp = el.closest("fieldset, [role=group], [role=radiogroup]");
    if (grp) {
      var legend = grp.querySelector("legend, [role=heading]");
      if (legend) parts.push(textOf(legend));
    }
    // a wrapping combobox/listbox often carries the real label
    var combo = el.closest("[role=combobox]");
    if (combo && combo !== el) {
      var cl = combo.getAttribute("aria-label");
      if (cl) parts.push(cl);
    }
    // preceding label/sibling text (common "label then input" markup)
    var sib = el.previousElementSibling;
    if (!sib && el.parentElement) sib = el.parentElement.previousElementSibling;
    if (sib) {
      var st = textOf(sib);
      if (st && st.length < 120) parts.push(st);
    }
    // nearest small container text (first line only, and only when the box
    // wraps this one field - a multi-field block's first line belongs to
    // its first field, not to this one)
    var box = el.closest("div, li, td, fieldset, section");
    if (box) {
      var boxFields = 0;
      try { boxFields = deepQueryAll(box, "input, select, textarea").length; } catch (e) {}
      if (boxFields <= 1) {
        var t = (box.innerText || "").split("\n").map(function (x) { return x.trim(); }).filter(Boolean)[0];
        if (t && t.length < 140) parts.push(t);
      }
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

  // ---------- value setting ----------

  function fireEvents(el, extra) {
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    if (extra !== false) el.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  function setNativeValue(el, val) {
    var proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype
      : HTMLInputElement.prototype;
    var desc = Object.getOwnPropertyDescriptor(proto, "value");
    if (desc && desc.set) desc.set.call(el, val); else el.value = val;
    fireEvents(el);
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
    var groupText = label;
    for (var g = 0; g < group.length; g++) groupText += " " + labelFor(group[g]) + " " + norm(group[g].value);
    if (/gender|sex/.test(label) || (/\bmale\b/.test(groupText) && /female/.test(groupText))) target = "male";
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

  // ---------- custom dropdowns / comboboxes (Workday, Eightfold, select2, react-select) ----------
  // Strategy: focus, set the typed value, then click the first visible matching
  // option in the opened listbox. Only options matching our value are clicked.

  function findOpenListOptions(el) {
    var doc = el.ownerDocument;
    var listId = el.getAttribute("aria-controls") || el.getAttribute("aria-owns") || el.getAttribute("aria-activedescendant-owner");
    var roots = [];
    if (listId) {
      var l = doc.getElementById(listId);
      if (l) roots.push(l);
    }
    if (!roots.length) {
      var pops = deepQueryAll(doc, "[role=listbox], [role=menu], .select2-results__options, [class*=dropdown][class*=open], [class*=menu][class*=open]");
      for (var i = 0; i < pops.length; i++) {
        if (isVisible(pops[i])) roots.push(pops[i]);
      }
    }
    var opts = [];
    for (var r = 0; r < roots.length; r++) {
      var found = roots[r].querySelectorAll("[role=option], [role=menuitem], li, [data-automation-id*=prompt]");
      for (var k = 0; k < found.length; k++) {
        if (isVisible(found[k])) opts.push(found[k]);
      }
    }
    return opts;
  }

  async function fillCombobox(el, value, label) {
    var v = norm(value);
    if (!v) return false;
    try { el.scrollIntoView({ block: "center" }); } catch (e) {}
    el.focus();
    el.click();
    await sleep(150);
    // type the value so the widget filters (set value + real key events)
    var proto = HTMLInputElement.prototype;
    var desc = Object.getOwnPropertyDescriptor(proto, "value");
    if (desc && desc.set) desc.set.call(el, value); else el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "a" }));
    el.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "a" }));
    await sleep(450);
    var opts = findOpenListOptions(el);
    var best = null;
    for (var i = 0; i < opts.length; i++) {
      var t = norm(textOf(opts[i]));
      if (!t) continue;
      if (t === v) { best = opts[i]; break; }
      if (!best && (t.indexOf(v) === 0 || v.indexOf(t) === 0)) best = opts[i];
      else if (!best && t.indexOf(v) !== -1) best = opts[i];
    }
    if (best) {
      best.click();
      await sleep(120);
      fireEvents(el, false);
      return true;
    }
    // no matching option: leave the typed value in place (some widgets accept free text)
    fireEvents(el, false);
    return el.value && norm(el.value).indexOf(v) !== -1;
  }

  function isCombobox(el) {
    if (el.tagName.toLowerCase() !== "input") return false;
    var role = (el.getAttribute("role") || "").toLowerCase();
    if (role === "combobox" || role === "searchbox") return true;
    if (el.getAttribute("aria-haspopup") === "listbox") return true;
    if (el.getAttribute("aria-expanded") !== null && el.getAttribute("aria-autocomplete")) return true;
    var cls = (el.className && el.className.baseVal !== undefined ? "" : String(el.className || "")).toLowerCase();
    return /select2-search|selectized|combobox|typeahead/.test(cls);
  }

  // ---------- global matching rules: first match wins ----------
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
    { re: /total.*experience|years? of experience|experience.*years|overall experience|relevant experience|\bexperience\b|\byoe\b/, v: function () { return P.totalExperienceYears; } },
    { re: /current (company|employer|organization|organisation)|present (company|employer)|employer name|current organization/, v: function () { return P.currentCompany; } },
    { re: /designation|current (role|position|title)|your role/, v: function () { return P.jobTitle; } },
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
    { re: /skills|tech stack|technologies/, v: function () { return P.skills; } },
    { re: /primary skill|main skill|core skill|top skill/, v: function () { return P.primarySkill || null; } },
    { re: /summary|about (you|yourself)|\bbio\b|profile (summary|description)|cover letter|introduce yourself|tell us about/, v: function () { return P.bio; } }
  ];

  function matchRule(label) {
    for (var i = 0; i < RULES.length; i++) {
      if (RULES[i].re.test(label)) return RULES[i];
    }
    return null;
  }

  // ---------- entry-scoped rules (inside a repeating work/education block) ----------

  function entryValue(kind, entry, label, el) {
    if (kind === "work") {
      if (/company|employer|organization|organisation/.test(label)) return entry.company;
      if (/job title|position|\btitle\b|role|designation/.test(label)) return entry.title;
      if (/currently|present|i (currently )?work/.test(label)) return null; // checkbox - never ticked anyway
      if (/from|start/.test(label) && !/end|to /.test(label)) {
        return dateValue(el, entry.startISO, entry.startText, entry.startMonth, entry.startYear);
      }
      if (/\bto\b|end/.test(label)) {
        if (entry.current) return null; // still working here: leave end dates alone
        return dateValue(el, entry.endISO, entry.endText, entry.endMonth, entry.endYear);
      }
      if (/location|city/.test(label)) return entry.location || null;
      if (/description|responsibilit|duties|summary/.test(label)) return entry.description || null;
      return null;
    }
    // education
    if (/school|university|college|institute|institution/.test(label)) return entry.school;
    if (/degree|qualification|diploma/.test(label)) return entry.degree;
    if (/field of study|major|speciali[sz]ation|course|discipline|area of study/.test(label)) return entry.fieldOfStudy;
    if (/grade|cgpa|gpa|percentage|score|marks|result/.test(label)) return entry.grade;
    if (/from|start/.test(label) && !/end|to /.test(label)) {
      return dateValue(el, entry.startYear ? entry.startYear + "-01-01" : "", entry.startYear, null, entry.startYear);
    }
    if (/\bto\b|end|graduat|complet|finish/.test(label)) {
      return dateValue(el, entry.endYear ? entry.endYear + "-06-01" : "", entry.endYear, null, entry.endYear);
    }
    if (/location|city/.test(label)) return null;
    return null;
  }

  function dateValue(el, iso, text, month, year) {
    var type = (el.type || "").toLowerCase();
    var tag = el.tagName.toLowerCase();
    if (tag === "select") {
      var label = labelFor(el);
      if (/month/.test(label)) return month || "";
      if (/year/.test(label)) return year || "";
      return text || "";
    }
    if (type === "date") return iso || "";
    if (type === "month") return iso ? iso.slice(0, 7) : "";
    if (type === "number") return year || "";
    return text || iso || "";
  }

  // ---------- "Add Another" repeating sections (Workday My Experience etc.) ----------

  var ADD_RE = /\badd\b/; // button must at least say "add"
  var WORK_RE = /experience|employment|\bwork\b|job|position|history/;
  var EDU_RE = /education|school|academic|qualification|degree|college|university/;

  function buttonText(btn) {
    return norm((btn.innerText || "") + " " + (btn.value || "") + " " +
      (btn.getAttribute("aria-label") || "") + " " + (btn.getAttribute("title") || ""));
  }

  function fillableFields(root) {
    var all = deepQueryAll(root, "input, select, textarea");
    var out = [];
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].type || "").toLowerCase();
      if (SKIP_TYPES[t] || t === "checkbox" || t === "radio") continue;
      out.push(all[i]);
    }
    return out;
  }

  function sectionContainer(btn) {
    // climb to the smallest ancestor that holds a form field or a matching heading
    var node = btn.parentElement;
    var hops = 0;
    var kindRe = null;
    var t = buttonText(btn);
    if (WORK_RE.test(t)) kindRe = WORK_RE;
    else if (EDU_RE.test(t)) kindRe = EDU_RE;
    while (node && node !== node.ownerDocument.body && hops < 8) {
      try {
        if (fillableFields(node).length >= 1) return node;
        var heads = node.querySelectorAll("h1, h2, h3, h4, h5, legend, [role=heading], header");
        for (var h = 0; h < heads.length; h++) {
          var ht = norm(textOf(heads[h]));
          if ((kindRe && kindRe.test(ht)) || WORK_RE.test(ht) || EDU_RE.test(ht)) return node;
        }
      } catch (e) {}
      node = node.parentElement;
      hops++;
    }
    return null;
  }

  function sectionKind(btn, container) {
    var t = buttonText(btn);
    if (WORK_RE.test(t)) return "work";
    if (EDU_RE.test(t)) return "education";
    if (container) {
      // heading/legend text of the section
      var heads = container.querySelectorAll("h1, h2, h3, h4, h5, legend, [role=heading], header");
      var htext = "";
      for (var i = 0; i < heads.length; i++) htext += " " + textOf(heads[i]);
      htext = norm(htext);
      if (WORK_RE.test(htext)) return "work";
      if (EDU_RE.test(htext)) return "education";
    }
    return null;
  }

  function findAddButtons(doc) {
    var cands = deepQueryAll(doc, "button, a, [role=button], input[type=button]");
    var out = [];
    for (var i = 0; i < cands.length; i++) {
      var b = cands[i];
      if (!isVisible(b) || b.disabled) continue;
      var t = buttonText(b);
      if (!ADD_RE.test(t)) continue;
      if (/delete|remove|address|attachment|resume|photo|skill|language|website|link/.test(t)) continue;
      var container = sectionContainer(b);
      var kind = sectionKind(b, container);
      if (!kind || !container) continue;
      out.push({ button: b, container: container, kind: kind });
    }
    return out;
  }

  function anchorReFor(kind) {
    return kind === "work"
      ? /company|employer|organization|organisation|job title|position title/
      : /school|university|college|institute|institution|degree/;
  }

  function entryBlocks(section) {
    var anchorRe = anchorReFor(section.kind);
    var fields = fillableFields(section.container);
    var blocks = [];
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      if (!anchorRe.test(labelFor(f))) continue;
      // smallest ancestor holding 2+ fields, staying inside the container
      var node = f.parentElement;
      var block = null;
      var hops = 0;
      while (node && node !== section.container && hops < 8) {
        if (fillableFields(node).length >= 2) { block = node; break; }
        node = node.parentElement;
        hops++;
      }
      if (!block) block = f.parentElement || f;
      if (blocks.indexOf(block) === -1) blocks.push(block);
    }
    return blocks;
  }

  function fieldCount(section) {
    return fillableFields(section.container).length;
  }

  async function ensureBlocks(section, desired, log) {
    var blocks = entryBlocks(section);
    var clicks = 0;
    while (blocks.length < desired && clicks < 5) {
      var before = fieldCount(section);
      try { section.button.scrollIntoView({ block: "center" }); } catch (e) {}
      section.button.click();
      clicks++;
      log.push("clicked '" + (buttonText(section.button).slice(0, 40) || "Add") + "' (click " + clicks + ")");
      await sleep(600);
      var nowBlocks = entryBlocks(section);
      if (nowBlocks.length > blocks.length) { blocks = nowBlocks; continue; }
      // some forms append bare fields (no anchor yet) - count growth as progress
      if (fieldCount(section) > before) { blocks = nowBlocks.length ? nowBlocks : blocks; }
      else break; // click did nothing - stop hammering
    }
    return blocks;
  }

  async function fillBlock(block, kind, entry, filled) {
    var fields = fillableFields(block);
    for (var i = 0; i < fields.length; i++) {
      var el = fields[i];
      var tag = el.tagName.toLowerCase();
      if (!isVisible(el)) continue;
      var label = labelFor(el);
      if (!label || SKIP_LABEL.test(label)) continue;
      if (el.value && String(el.value).trim() !== "") continue; // never overwrite
      var value = entryValue(kind, entry, label, el);
      if (value === null || value === undefined || value === "") continue;
      el.__jfaBlock = true;
      if (tag === "select") {
        var v = norm(value);
        var want = [new RegExp("^" + v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$"), new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))];
        var opt = pickOption(el, want);
        if (opt) {
          setNativeValue(el, opt.value);
          highlight(el);
          filled.push({ field: label.slice(0, 60), value: el.options[el.selectedIndex] ? el.options[el.selectedIndex].text : value });
        }
        continue;
      }
      if (isCombobox(el)) {
        if (await fillCombobox(el, value, label)) {
          highlight(el);
          filled.push({ field: label.slice(0, 60), value: value });
        }
        continue;
      }
      setNativeValue(el, value);
      highlight(el);
      filled.push({ field: label.slice(0, 60), value: value });
    }
  }

  // ---------- main pass ----------

  function insideAny(el, blocks) {
    for (var i = 0; i < blocks.length; i++) {
      try { if (blocks[i].contains(el)) return true; } catch (e) {}
    }
    return false;
  }

  async function fillOne(el, filled) {
    var tag = el.tagName.toLowerCase();
    var type = (el.type || "").toLowerCase();
    if (SKIP_TYPES[type]) return;
    if (!isVisible(el)) return;

    var label = labelFor(el);
    if (!label) return;
    if (SKIP_LABEL.test(label)) return;

    if (type === "checkbox") return; // never tick checkboxes
    if (type === "radio") {
      if (fillRadioGroup(el, label)) {
        filled.push({ field: label.slice(0, 60), value: "(selected)" });
      }
      return;
    }

    if (el.value && String(el.value).trim() !== "") return; // never overwrite

    var rule = matchRule(label);
    if (!rule) return;
    var value = typeof rule.v === "function" ? rule.v(el, label) : rule.v;
    if (value === null || value === undefined || value === "") return;

    if (tag === "select") {
      if (fillSelect(el, value, label)) {
        highlight(el);
        filled.push({ field: label.slice(0, 60), value: el.options[el.selectedIndex] ? el.options[el.selectedIndex].text : value });
      }
      return;
    }
    if (isCombobox(el)) {
      if (await fillCombobox(el, value, label)) {
        highlight(el);
        filled.push({ field: label.slice(0, 60), value: value });
      }
      return;
    }
    setNativeValue(el, value);
    highlight(el);
    filled.push({ field: label.slice(0, 60), value: value });
  }

  async function fillAll() {
    if (!P) return { error: "profile not loaded", filled: [] };
    var filled = [];
    var log = [];
    var handledBlocks = [];
    var doneRadioGroups = {};

    var docs = collectDocuments(document);

    // Pass 1: repeating sections with "Add"/"Add Another" buttons.
    var seenContainers = [];
    for (var d = 0; d < docs.length; d++) {
      var sections = findAddButtons(docs[d]);
      for (var s = 0; s < sections.length; s++) {
        var section = sections[s];
        if (seenContainers.indexOf(section.container) !== -1) continue;
        seenContainers.push(section.container);
        var entries = section.kind === "work" ? (P.workExperience || []) : (P.education || []);
        if (!entries.length) continue;
        var blocks = await ensureBlocks(section, entries.length, log);
        var n = Math.min(blocks.length, entries.length);
        for (var b = 0; b < n; b++) {
          handledBlocks.push(blocks[b]);
          var bfields = deepQueryAll(blocks[b], "input, select, textarea");
          for (var m = 0; m < bfields.length; m++) bfields[m].__jfaBlock = true;
          await fillBlock(blocks[b], section.kind, entries[b], filled);
        }
        if (blocks.length < entries.length) {
          log.push("section only gave " + blocks.length + " of " + entries.length + " " + section.kind + " blocks - remaining entries left for manual add");
        }
      }
    }

    // Pass 2: ordinary fields everywhere (shadow DOM + same-origin iframes included).
    for (var dd = 0; dd < docs.length; dd++) {
      var fields = deepQueryAll(docs[dd], "input, select, textarea");
      for (var i = 0; i < fields.length; i++) {
        var el = fields[i];
        if (el.__jfaBlock || insideAny(el, handledBlocks)) continue;
        var type = (el.type || "").toLowerCase();
        if (type === "radio") {
          var gname = (el.name || labelFor(el)) + "@" + dd;
          if (doneRadioGroups[gname]) continue;
          doneRadioGroups[gname] = true;
        }
        await fillOne(el, filled);
      }
    }
    return { filled: filled, log: log, url: location.href };
  }

  window.jfaFillAll = fillAll;
  try { document.documentElement.setAttribute("data-jfa-loaded", "1"); } catch (e) {}

  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
      if (msg && msg.type === "JFA_FILL") {
        fillAll().then(sendResponse);
        return true; // async response
      }
    });
  }
})();
