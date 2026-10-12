/* ==========================================================================
   Smart Rental — Login & Registration form validation
   - Client-side only: NO passwords or personal data are stored anywhere
   - No real authentication happens here (no backend yet)
   - Shared by login.html and register.html
   ========================================================================== */
(function () {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  /* ------------------------------- Utilities ------------------------------- */
  // Simple, practical email format check (matches the browser's intent).
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const MIN_PASSWORD_LENGTH = 8;

  function getErrorEl(input) {
    const id = input.getAttribute("aria-describedby");
    if (!id) return null;
    // The first id in aria-describedby is the error text element.
    return document.getElementById(id.split(" ")[0]);
  }

  function setFieldError(input, message) {
    const errorEl = getErrorEl(input);
    if (errorEl) errorEl.textContent = message;
    if (message) {
      input.setAttribute("aria-invalid", "true");
    } else {
      input.removeAttribute("aria-invalid");
    }
    return !message;
  }

  function showFormMessage(messageEl, type, text) {
    if (!messageEl) return;
    messageEl.classList.remove("form-message--error", "form-message--success");
    messageEl.classList.add(type === "success" ? "form-message--success" : "form-message--error");
    messageEl.textContent = text;
    messageEl.hidden = false;
  }

  function clearFormMessage(messageEl) {
    if (!messageEl) return;
    messageEl.hidden = true;
    messageEl.textContent = "";
    messageEl.classList.remove("form-message--error", "form-message--success");
  }

  function focusFirstInvalid(form) {
    const invalid = $('[aria-invalid="true"]', form);
    if (invalid) invalid.focus();
  }

  /* ---------------------------- Password toggles --------------------------- */
  $$(".password-toggle").forEach((toggle) => {
    const targetId = toggle.getAttribute("data-toggle-for");
    const input = targetId ? document.getElementById(targetId) : null;
    if (!input) return;

    toggle.addEventListener("click", () => {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      toggle.setAttribute("aria-pressed", String(show));
      toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
      const eye = $(".icon-eye", toggle);
      const eyeOff = $(".icon-eye-off", toggle);
      if (eye) eye.hidden = show;
      if (eyeOff) eyeOff.hidden = !show;
    });
  });

  /* --------------------------- Individual checks --------------------------- */
  function validateEmail(input) {
    const value = input.value.trim();
    if (!value) return setFieldError(input, "Please enter your email address.");
    if (!EMAIL_PATTERN.test(value)) return setFieldError(input, "Enter a valid email address, e.g. name@example.com.");
    return setFieldError(input, "");
  }

  function validateRequired(input, message) {
    if (!input.value.trim()) return setFieldError(input, message);
    return setFieldError(input, "");
  }

  /* ------------------------------ Login form ------------------------------- */
  const loginForm = $("#loginForm");
  if (loginForm) {
    const messageEl = $("#loginMessage");
    const email = $("#loginEmail");
    const password = $("#loginPassword");

    function validateLogin() {
      const okEmail = validateEmail(email);
      const okPassword = validateRequired(password, "Please enter your password.");
      return okEmail && okPassword;
    }

    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      clearFormMessage(messageEl);

      if (!validateLogin()) {
        showFormMessage(messageEl, "error", "Please fix the highlighted fields and try again.");
        focusFirstInvalid(loginForm);
        return;
      }

      // No backend yet, so we do NOT log anyone in or store anything.
      showFormMessage(
        messageEl,
        "success",
        "Looks good! This is a demo only — you are not actually logged in, and your password was not saved. Real authentication will be added later."
      );
    });

    // Validate a field once the user leaves it.
    email.addEventListener("blur", () => validateEmail(email));
    password.addEventListener("blur", () => validateRequired(password, "Please enter your password."));

    // Clear a field's error as soon as the user starts correcting it.
    email.addEventListener("input", () => {
      if (email.getAttribute("aria-invalid") === "true") validateEmail(email);
    });
    password.addEventListener("input", () => {
      if (password.getAttribute("aria-invalid") === "true") {
        validateRequired(password, "Please enter your password.");
      }
    });
  }

  /* ---------------------------- Registration form -------------------------- */
  const registerForm = $("#registerForm");
  if (registerForm) {
    const messageEl = $("#registerMessage");
    const fullName = $("#fullName");
    const email = $("#registerEmail");
    const password = $("#registerPassword");
    const confirm = $("#confirmPassword");

    function validatePassword() {
      const value = password.value;
      if (!value) return setFieldError(password, "Please create a password.");
      if (value.length < MIN_PASSWORD_LENGTH) {
        return setFieldError(password, "Password must be at least " + MIN_PASSWORD_LENGTH + " characters.");
      }
      return setFieldError(password, "");
    }

    function validateConfirm() {
      if (!confirm.value) return setFieldError(confirm, "Please confirm your password.");
      if (confirm.value !== password.value) return setFieldError(confirm, "Passwords do not match.");
      return setFieldError(confirm, "");
    }

    function validateRegister() {
      const results = [
        validateRequired(fullName, "Please enter your full name."),
        validateEmail(email),
        validatePassword(),
        validateConfirm(),
      ];
      return results.every(Boolean);
    }

    registerForm.addEventListener("submit", (event) => {
      event.preventDefault();
      clearFormMessage(messageEl);

      if (!validateRegister()) {
        showFormMessage(messageEl, "error", "Please fix the highlighted fields and try again.");
        focusFirstInvalid(registerForm);
        return;
      }

      // No backend yet: nothing is submitted, created or stored.
      const accountType = $('input[name="accountType"]:checked', registerForm);
      const role = accountType ? accountType.value : "renter";
      showFormMessage(
        messageEl,
        "success",
        "Looks good! This is a demo only — no " +
          role +
          " account has been created and nothing you typed was stored. Real registration will be added later."
      );
    });

    // Field-level validation on blur.
    fullName.addEventListener("blur", () => validateRequired(fullName, "Please enter your full name."));
    email.addEventListener("blur", () => validateEmail(email));
    password.addEventListener("blur", validatePassword);
    confirm.addEventListener("blur", validateConfirm);

    // Re-check while typing, but only once a field is already flagged.
    fullName.addEventListener("input", () => {
      if (fullName.getAttribute("aria-invalid") === "true") {
        validateRequired(fullName, "Please enter your full name.");
      }
    });
    email.addEventListener("input", () => {
      if (email.getAttribute("aria-invalid") === "true") validateEmail(email);
    });
    password.addEventListener("input", () => {
      if (password.getAttribute("aria-invalid") === "true") validatePassword();
      // Keep the confirmation in sync if it was already checked.
      if (confirm.value && confirm.getAttribute("aria-invalid") === "true") validateConfirm();
    });
    confirm.addEventListener("input", () => {
      if (confirm.getAttribute("aria-invalid") === "true") validateConfirm();
    });
  }

  /* ------------------------------- Footer year ----------------------------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
