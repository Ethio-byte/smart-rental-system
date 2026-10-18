/* ==========================================================================
   Smart Rental — Landlord dashboard & Add Property interactions
   - Client-side only: no data is stored or uploaded
   - No authentication or backend integration
   ========================================================================== */
(function () {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  /* ------------------------------- Utilities ------------------------------- */
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_PATTERN = /^(\+?251|0)?9\d{8}$/;

  function findErrorEl(input) {
    const id = input.getAttribute("aria-describedby");
    if (!id) return null;
    const ids = id.split(/\s+/);
    for (const part of ids) {
      if (part.endsWith("Error")) {
        const el = document.getElementById(part);
        if (el) return el;
      }
    }
    return document.getElementById(ids[0]);
  }

  function setFieldError(input, message) {
    const errorEl = findErrorEl(input);
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

  function validateRequired(input, message) {
    if (!String(input.value || "").trim()) return setFieldError(input, message);
    return setFieldError(input, "");
  }

  function validatePhone(input) {
    const value = String(input.value || "").trim();
    if (!value) return setFieldError(input, "Please enter a contact phone number.");
    const normalized = value.replace(/\s+/g, "");
    if (!PHONE_PATTERN.test(normalized)) {
      return setFieldError(input, "Enter a valid Ethiopian phone number, e.g. +251 911 22 33 44.");
    }
    return setFieldError(input, "");
  }

  function validatePositiveNumber(input, label) {
    const raw = String(input.value || "").trim();
    if (!raw) return setFieldError(input, "Please enter " + label + ".");
    const num = Number(raw);
    if (!Number.isFinite(num)) return setFieldError(input, "Enter a valid number.");
    if (num <= 0) return setFieldError(input, label + " must be greater than zero.");
    return setFieldError(input, "");
  }

  function validateOptionalNumber(input, label, min, max) {
    const raw = String(input.value || "").trim();
    if (!raw) return setFieldError(input, "");
    const num = Number(raw);
    if (!Number.isFinite(num) || !Number.isInteger(num)) {
      return setFieldError(input, "Enter a whole number for " + label + ".");
    }
    if (num < min || num > max) {
      return setFieldError(input, label + " must be between " + min + " and " + max + ".");
    }
    return setFieldError(input, "");
  }

  /* ------------------------------- Add Property ---------------------------- */
  const addPropertyForm = $("#addPropertyForm");
  if (addPropertyForm) {
    const messageEl = $("#addPropertyMessage");
    const title = $("#propertyTitle");
    const type = $("#propertyType");
    const city = $("#propertyCity");
    const otherCityWrap = $("#otherCityWrap");
    const otherCity = $("#otherCity");
    const area = $("#propertyArea");
    const rent = $("#monthlyRent");
    const furnishing = $("#furnishing");
    const bedrooms = $("#bedrooms");
    const bathrooms = $("#bathrooms");
    const description = $("#propertyDescription");
    const phone = $("#contactPhone");
    const photos = $("#propertyPhotos");
    const preview = $("#photoPreview");

    const MAX_PHOTOS = 6;
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
    let objectUrls = [];

    function syncCity() {
      const isOther = city.value === "Other";
      otherCityWrap.hidden = !isOther;
      if (otherCity) {
        otherCity.required = isOther;
        if (!isOther) {
          otherCity.value = "";
          setFieldError(otherCity, "");
        }
      }
    }

    function revokeUrls() {
      objectUrls.forEach((url) => {
        try { URL.revokeObjectURL(url); } catch (e) { /* ignore */ }
      });
      objectUrls = [];
    }

    function renderPreview(files) {
      if (!preview) return;
      revokeUrls();
      preview.innerHTML = "";
      if (!files || files.length === 0) {
        const empty = document.createElement("p");
        empty.className = "photo-empty";
        empty.textContent = "No photos selected yet.";
        preview.appendChild(empty);
        return;
      }
      files.forEach((file) => {
        const url = URL.createObjectURL(file);
        objectUrls.push(url);
        const figure = document.createElement("figure");
        figure.className = "photo-thumb";
        const img = document.createElement("img");
        img.src = url;
        img.alt = file.name;
        const caption = document.createElement("figcaption");
        caption.textContent = file.name;
        figure.appendChild(img);
        figure.appendChild(caption);
        preview.appendChild(figure);
      });
    }

    function validatePhotos() {
      if (!photos) return true;
      const files = Array.from(photos.files || []);
      if (files.length === 0) {
        setFieldError(photos, "");
        renderPreview([]);
        return true;
      }
      if (files.length > MAX_PHOTOS) {
        setFieldError(photos, "You can select up to " + MAX_PHOTOS + " photos.");
        return false;
      }
      for (const file of files) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setFieldError(photos, "Only JPEG, PNG, or WebP images are allowed.");
          return false;
        }
        if (file.size > MAX_FILE_SIZE) {
          setFieldError(photos, "Each photo must be 5 MB or smaller.");
          return false;
        }
      }
      setFieldError(photos, "");
      renderPreview(files);
      return true;
    }

    function validateForm() {
      const results = [];
      results.push(validateRequired(title, "Please enter a property title."));
      results.push(validateRequired(type, "Please select a property type."));
      results.push(validateRequired(city, "Please select a city."));

      if (city.value === "Other") {
        results.push(validateRequired(otherCity, "Please enter the city."));
      } else {
        setFieldError(otherCity, "");
      }

      results.push(validateRequired(area, "Please enter the specific area or neighborhood."));
      results.push(validatePositiveNumber(rent, "monthly rent"));
      results.push(validateRequired(description, "Please enter a property description."));
      results.push(validatePhone(phone));

      results.push(validateOptionalNumber(bedrooms, "bedrooms", 0, 20));
      results.push(validateOptionalNumber(bathrooms, "bathrooms", 0, 20));

      results.push(validatePhotos());

      return results.every(Boolean);
    }

    // City toggle
    if (city) {
      city.addEventListener("change", syncCity);
      syncCity();
    }

    // Field-level events
    title.addEventListener("blur", () => validateRequired(title, "Please enter a property title."));
    type.addEventListener("change", () => validateRequired(type, "Please select a property type."));
    city.addEventListener("change", () => validateRequired(city, "Please select a city."));
    if (otherCity) {
      otherCity.addEventListener("blur", () => {
        if (city.value === "Other") validateRequired(otherCity, "Please enter the city.");
      });
    }
    area.addEventListener("blur", () => validateRequired(area, "Please enter the specific area or neighborhood."));
    rent.addEventListener("blur", () => validatePositiveNumber(rent, "monthly rent"));
    description.addEventListener("blur", () => validateRequired(description, "Please enter a property description."));
    phone.addEventListener("blur", validatePhone);
    bedrooms.addEventListener("blur", () => validateOptionalNumber(bedrooms, "bedrooms", 0, 20));
    bathrooms.addEventListener("blur", () => validateOptionalNumber(bathrooms, "bathrooms", 0, 20));

    if (photos) {
      photos.addEventListener("change", validatePhotos);
    }

    // Clear errors on input
    [title, area, otherCity, rent, description, phone, bedrooms, bathrooms].forEach((el) => {
      if (!el) return;
      el.addEventListener("input", () => {
        if (el.getAttribute("aria-invalid") === "true") {
          if (el === title) validateRequired(title, "Please enter a property title.");
          else if (el === area) validateRequired(area, "Please enter the specific area or neighborhood.");
          else if (el === otherCity) validateRequired(otherCity, "Please enter the city.");
          else if (el === rent) validatePositiveNumber(rent, "monthly rent");
          else if (el === description) validateRequired(description, "Please enter a property description.");
          else if (el === phone) validatePhone(phone);
          else if (el === bedrooms) validateOptionalNumber(bedrooms, "bedrooms", 0, 20);
          else if (el === bathrooms) validateOptionalNumber(bathrooms, "bathrooms", 0, 20);
        }
      });
    });

    addPropertyForm.addEventListener("submit", (event) => {
      event.preventDefault();
      clearFormMessage(messageEl);

      if (!validateForm()) {
        showFormMessage(messageEl, "error", "Please fix the highlighted fields and try again.");
        focusFirstInvalid(addPropertyForm);
        return;
      }

      // No backend yet: nothing is saved, uploaded or stored.
      showFormMessage(
        messageEl,
        "success",
        "Your property details look complete. Saving is not available yet — backend integration is required before this listing can be stored. No data was saved and photos were not uploaded."
      );
    });
  }

  /* ------------------------------- Footer year ----------------------------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
