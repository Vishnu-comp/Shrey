JOB FORM AUTOFILL - INSTALL STEPS (Chrome on laptop)
====================================================

1. Unzip vishnu-job-autofill.zip somewhere you can keep it
   (e.g. Documents\job-form-autofill). Do not delete the folder
   after installing - Chrome loads it from there.

2. Open Chrome and go to:  chrome://extensions

3. Turn ON "Developer mode" (toggle, top-right corner).

4. Click "Load unpacked" (top-left) and select the unzipped
   job-form-autofill folder (the one with manifest.json in it).

5. The extension now appears in your toolbar. Click the puzzle
   icon in the toolbar and pin "Job Form Autofill - Vishnu".

HOW TO USE
----------
1. Open any job application form.
2. Click the extension icon, then "Fill this form".
3. Filled fields flash green and the popup lists what was filled.
4. Multi-step forms: click it again on each new step.
5. Always review the whole form before you hit Submit.

WHAT IT NEVER TOUCHES
---------------------
- Passwords, OTP / verification code fields
- Checkboxes (consent, declarations, terms) - tick those yourself
- File uploads (resume) - attach yourself
- Any field that already has text in it
- Anything it cannot confidently match stays blank

EDIT YOUR DETAILS
-----------------
Open profile.js in Notepad, change any value, save, then go to
chrome://extensions and click the reload icon on the extension card.
