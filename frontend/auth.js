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
  // Ethiopian phone: +251 9XX XXX XXX or 09XX XXX XXX (optional leading +)
  const PHONE_PATTERN = /^(\+?251|0)?9\d{8}$/;
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
    messageEl.classList.remove("form-message--error", "form-message--success", "form-message--loading");
    if (type === "success") {
      messageEl.classList.add("form-message--success");
    } else if (type === "loading") {
      messageEl.classList.add("form-message--loading");
    } else {
      messageEl.classList.add("form-message--error");
    }
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

  function validatePhone(input) {
    const value = input.value.trim();
    if (!value) return setFieldError(input, "");
    if (!PHONE_PATTERN.test(value.replace(/\s+/g, ""))) {
      return setFieldError(input, "Enter a valid Ethiopian phone number, e.g. +251 911 22 33 44.");
    }
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
 
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearFormMessage(messageEl);

  if (!validateLogin()) {
    showFormMessage(
      messageEl,
      "error",
      "Please fix the highlighted fields and try again."
    );
    focusFirstInvalid(loginForm);
    return;
  }

   const emailInput = document.getElementById("loginEmail");
const passwordInput = document.getElementById("loginPassword");
  const submitButton = loginForm.querySelector('button[type="submit"]');

  try {
    if (submitButton) submitButton.disabled = true;

    // Sign in using Supabase Authentication
    const { data, error } =
      await window.supabaseClient.auth.signInWithPassword({
        email: emailInput.value.trim(),
        password: passwordInput.value
      });

    if (error) throw error;

    const user = data.user;
    const metadata = user.user_metadata || {};

    const fallbackAccountType = metadata.account_type || "renter";

    // Read the existing profile so an existing Account_type is not overwritten.
    const { data: existingProfile, error: profileFetchError } =
      await window.supabaseClient
        .from("Profiles")
        .select("Account_type")
        .eq("id", user.id)
        .maybeSingle();

    if (profileFetchError) throw profileFetchError;

    const accountType =
      existingProfile && existingProfile.Account_type
        ? existingProfile.Account_type
        : fallbackAccountType;

    // Create or update the user's profile without clobbering an existing role.
    const { error: profileError } = await window.supabaseClient
      .from("Profiles")
      .upsert(
        {
          id: user.id,
          "full name": metadata.full_name || "",
          phone: metadata.phone || "",
          Account_type: accountType
        },
        { onConflict: "id" }
      );

    if (profileError) throw profileError;

    showFormMessage(
      messageEl,
      "success",
      "Login successful! Redirecting..."
    );

    window.location.href =
      String(accountType).toLowerCase() === "landlord"
        ? "landlord-dashboard.html"
        : "renter-dashboard.html";

  } catch (error) {
    console.error("Login error:", error);

    showFormMessage(
      messageEl,
      "error",
      error.message || "Login failed. Please try again."
    );
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
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

    /* --------------------------- Forgot password ---------------------------- */
    const forgotPasswordPanel = $("#forgotPasswordPanel");
    const forgotPasswordForm = $("#forgotPasswordForm");
    const forgotEmail = $("#forgotEmail");
    const forgotPasswordMessage = $("#forgotPasswordMessage");
    const backToLoginLink = $("#backToLoginLink");
    const sendResetLinkBtn = $("#sendResetLinkBtn");

    function showForgotPasswordPanel() {
      if (loginForm) loginForm.hidden = true;
      if (forgotPasswordPanel) forgotPasswordPanel.hidden = false;
      if (forgotPasswordMessage) clearFormMessage(forgotPasswordMessage);
      if (forgotEmail) {
        forgotEmail.value = "";
        forgotEmail.removeAttribute("aria-invalid");
        const err = getErrorEl(forgotEmail);
        if (err) err.textContent = "";
        forgotEmail.focus();
      }
    }

    function showLoginForm() {
      if (forgotPasswordPanel) forgotPasswordPanel.hidden = true;
      if (loginForm) loginForm.hidden = false;
    }

    const forgotPasswordLink = $("#forgotPasswordLink");
    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener("click", (event) => {
        event.preventDefault();
        clearFormMessage(messageEl);
        showForgotPasswordPanel();
      });
    }

    if (backToLoginLink) {
      backToLoginLink.addEventListener("click", (event) => {
        event.preventDefault();
        if (forgotPasswordMessage) clearFormMessage(forgotPasswordMessage);
        showLoginForm();
      });
    }

    if (forgotPasswordForm && forgotEmail) {
      forgotEmail.addEventListener("blur", () => validateEmail(forgotEmail));
      forgotEmail.addEventListener("input", () => {
        if (forgotEmail.getAttribute("aria-invalid") === "true") validateEmail(forgotEmail);
      });

      forgotPasswordForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (forgotPasswordMessage) clearFormMessage(forgotPasswordMessage);

        const ok = validateEmail(forgotEmail);
        if (!ok) {
          showFormMessage(
            forgotPasswordMessage,
            "error",
            "Please enter a valid email address."
          );
          focusFirstInvalid(forgotPasswordForm);
          return;
        }

        const emailValue = forgotEmail.value.trim();
        const supabase = window.supabaseClient;
        if (!supabase) {
          showFormMessage(
            forgotPasswordMessage,
            "error",
            "Authentication is not available. Please try again later."
          );
          return;
        }

        const redirectTo = new URL("reset-password.html", window.location.href).href;
        const submitButton = forgotPasswordForm.querySelector('button[type="submit"]') || sendResetLinkBtn;

        try {
          if (submitButton) submitButton.disabled = true;
          showFormMessage(forgotPasswordMessage, "loading", "Sending password reset email...");

          const { error } = await supabase.auth.resetPasswordForEmail(emailValue, {
            redirectTo: redirectTo,
          });
          if (error) throw error;

          showFormMessage(
            forgotPasswordMessage,
            "success",
            "Password reset email sent. Please check your inbox (and spam folder) for the reset link."
          );
        } catch (error) {
          console.error("Forgot password error:", error);
          showFormMessage(
            forgotPasswordMessage,
            "error",
            (error && error.message) || "Could not send reset email. Please try again."
          );
        } finally {
          if (submitButton) submitButton.disabled = false;
        }
      });
    }
  }

  /* ---------------------------- Registration form -------------------------- */
  const registerForm = $("#registerForm");
  if (registerForm) {
    const messageEl = $("#registerMessage");
    const fullName = $("#fullName");
    const email = $("#registerEmail");
    const phone = $("#phoneNumber");
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
        validatePhone(phone),
        validatePassword(),
        validateConfirm(),
      ];
      return results.every(Boolean);
    }

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearFormMessage(messageEl);

  if (!validateRegister()) {
    showFormMessage(
      messageEl,
      "error",
      "Please fix the highlighted fields and try again."
    );
    focusFirstInvalid(registerForm);
    return;
  }

  const accountType = $('input[name="accountType"]:checked', registerForm);
  const role = accountType ? accountType.value : "renter";

  const submitButton = $('button[type="submit"]', registerForm);

  try {
    if (submitButton) submitButton.disabled = true;

    const { data, error } =
      await window.supabaseClient.auth.signUp({
        email: email.value.trim(),
        password: password.value,
        options: {
          data: {
            full_name: fullName.value.trim(),
            phone: phone.value.trim(),
            account_type: role
          }
        }
      });

    if (error) throw error;

    showFormMessage(
      messageEl,
      "success",
      "Registration successful! Please check your email and confirm your account before logging in."
    );

    registerForm.reset();

  } catch (error) {
    console.error("Registration error:", error);

    showFormMessage(
      messageEl,
      "error",
      error.message || "Registration failed. Please try again."
    );

  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

     

    // Field-level validation on blur.
    fullName.addEventListener("blur", () => validateRequired(fullName, "Please enter your full name."));
    email.addEventListener("blur", () => validateEmail(email));
    phone.addEventListener("blur", validatePhone);
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
    phone.addEventListener("input", () => {
      if (phone.getAttribute("aria-invalid") === "true") validatePhone(phone);
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

  /* --------------------------- Reset password form ------------------------- */
  const resetPasswordForm = $("#resetPasswordForm");
  if (resetPasswordForm) {
    const messageEl = $("#resetMessage");
    const newPassword = $("#newPassword");
    const confirmPassword = $("#confirmPassword");
    const submitButton = resetPasswordForm.querySelector('button[type="submit"]');

    function validateNewPassword() {
      const value = newPassword.value;
      if (!value) return setFieldError(newPassword, "Please enter a new password.");
      if (value.length < MIN_PASSWORD_LENGTH) {
        return setFieldError(newPassword, "Password must be at least " + MIN_PASSWORD_LENGTH + " characters.");
      }
      return setFieldError(newPassword, "");
    }

    function validateConfirmPassword() {
      if (!confirmPassword.value) return setFieldError(confirmPassword, "Please confirm your new password.");
      if (confirmPassword.value !== newPassword.value) {
        return setFieldError(confirmPassword, "Passwords do not match.");
      }
      return setFieldError(confirmPassword, "");
    }

    function validateReset() {
      const results = [validateNewPassword(), validateConfirmPassword()];
      return results.every(Boolean);
    }

    const supabase = window.supabaseClient;
    let recoveryReady = false;

    function setRecoveryReady(ready) {
      recoveryReady = ready;
      if (submitButton) submitButton.disabled = !ready;
    }

    async function checkRecoverySession() {
      if (!supabase) {
        showFormMessage(messageEl, "error", "Authentication is not available. Please try again later.");
        setRecoveryReady(false);
        return;
      }
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (data && data.session) {
          setRecoveryReady(true);
          clearFormMessage(messageEl);
        } else {
          setRecoveryReady(false);
          showFormMessage(
            messageEl,
            "error",
            "This password reset link is invalid or has expired. Please request a new one from the login page."
          );
        }
      } catch (error) {
        console.error("Recovery session check error:", error);
        setRecoveryReady(false);
        showFormMessage(
          messageEl,
          "error",
          (error && error.message) || "Unable to verify reset session."
        );
      }
    }

    if (supabase) {
      try {
        supabase.auth.onAuthStateChange((event, session) => {
          if (event === "PASSWORD_RECOVERY" || (session && !recoveryReady)) {
            setRecoveryReady(true);
            clearFormMessage(messageEl);
            showFormMessage(messageEl, "success", "Reset link verified. You can now choose a new password.");
          }
        });
      } catch (error) {
        console.error("Auth state listener error:", error);
      }
    }

    checkRecoverySession();

    newPassword.addEventListener("blur", validateNewPassword);
    confirmPassword.addEventListener("blur", validateConfirmPassword);

    newPassword.addEventListener("input", () => {
      if (newPassword.getAttribute("aria-invalid") === "true") validateNewPassword();
      if (confirmPassword.value && confirmPassword.getAttribute("aria-invalid") === "true") {
        validateConfirmPassword();
      }
    });
    confirmPassword.addEventListener("input", () => {
      if (confirmPassword.getAttribute("aria-invalid") === "true") validateConfirmPassword();
    });

    resetPasswordForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearFormMessage(messageEl);

      if (!recoveryReady) {
        showFormMessage(
          messageEl,
          "error",
          "This password reset link is invalid or has expired. Please request a new one."
        );
        return;
      }

      if (!validateReset()) {
        showFormMessage(messageEl, "error", "Please fix the highlighted fields and try again.");
        focusFirstInvalid(resetPasswordForm);
        return;
      }

      try {
        if (submitButton) submitButton.disabled = true;
        showFormMessage(messageEl, "loading", "Updating password...");

        const { error } = await supabase.auth.updateUser({
          password: newPassword.value,
        });
        if (error) throw error;

        showFormMessage(messageEl, "success", "Password updated successfully! Redirecting to login...");
        setTimeout(() => {
          window.location.href = "login.html";
        }, 1500);
      } catch (error) {
        console.error("Reset password error:", error);
        showFormMessage(
          messageEl,
          "error",
          (error && error.message) || "Could not update password. Please try again."
        );
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }

  /* ------------------------------- Footer year ----------------------------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
