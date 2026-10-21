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
    const subCityWrap = $("#subCityWrap");
    const subCity = $("#propertySubCity");
    const otherSubCityWrap = $("#otherSubCityWrap");
    const otherSubCity = $("#otherSubCity");
    const woredaWrap = $("#woredaWrap");
    const woreda = $("#propertyWoreda");
    const area = $("#propertyArea");
    const landmark = $("#propertyLandmark");
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

    // Sub-city options by city (mirrors script.js ETHIOPIA_LOCATIONS)
    const SUB_CITIES_BY_CITY = {
      "Addis Ababa": [
        "Addis Ketema",
        "Akaki Kaliti",
        "Arada",
        "Bole",
        "Gulele",
        "Kirkos",
        "Kolfe Keranio",
        "Lideta",
        "Nifas Silk-Lafto",
        "Yeka",
      ],
      "Dire Dawa": [
        "Sabian",
        "Kezira",
        "Gende Ada",
        "Melka Jebdu",
        "Lege Harre",
      ],
      "Hawassa": [
        "Addis Ketema",
        "Bahil Adarash",
        "Haile",
        "Hayk Dar",
        "Mehal Ketema",
        "Misrak",
        "Tabor",
        "Wondogenet",
      ],
      Harar: [
        "Abadir",
        "Aboker",
        "Assum Bari",
        "Badro",
        "Gidir Megala",
        "Hamaressa",
        "Jegol (Walled City)",
        "Jinela",
        "Shenkor",
        "Sofia",
      ],
      Adama: ["Adama"],
      "Bahir Dar": [
        "Bahir Dar Zuria",
        "Dagmawi",
        "Facil",
        "Gish Abay",
        "Hidar",
        "Shum Abo",
        "Sefene Selam",
        "Tana",
      ],
      Mekelle: [
        "Adi Haki",
        "Aynalem",
        "Hawelti",
        "Kedamay Weyane",
        "Quiha",
        "Semien",
        "Hadnet",
        "Ayder",
      ],
      Gondar: ["Azezo", "Dabat", "Gondar Zuria", "Maraki", "Teda"],
      Jimma: ["Jimma"],
    };

    // Woreda field is optional and available for any city where applicable
    const CITIES_WITH_WOREDA = ["Addis Ababa"];

    function populateSubCities(cityValue) {
      if (!subCity) return;
      const options = SUB_CITIES_BY_CITY[cityValue] || [];
      const currentValue = subCity.value;
      subCity.innerHTML = '<option value="">Select sub-city / district</option>';
      options.forEach((opt) => {
        const optionEl = document.createElement("option");
        optionEl.value = opt;
        optionEl.textContent = opt;
        subCity.appendChild(optionEl);
      });
      // Add "Other" option for custom entry
      const otherOpt = document.createElement("option");
      otherOpt.value = "Other";
      otherOpt.textContent = "Other sub-city / district";
      subCity.appendChild(otherOpt);
      if (options.includes(currentValue) || currentValue === "Other") {
        subCity.value = currentValue;
      }
    }

    function syncCity() {
      const cityValue = city.value;
      const isOtherCity = cityValue === "Other city or town";

      // Other city input
      otherCityWrap.hidden = !isOtherCity;
      if (otherCity) {
        otherCity.required = isOtherCity;
        if (!isOtherCity) {
          otherCity.value = "";
          setFieldError(otherCity, "");
        }
      }

      // Sub-city select: always show, but populate differently based on city
      const hasSubCities = SUB_CITIES_BY_CITY[cityValue] && SUB_CITIES_BY_CITY[cityValue].length > 0;
      subCityWrap.hidden = false; // Always show local administrative area field

      if (hasSubCities && !isOtherCity) {
        // Known city with predefined sub-cities: show select with options
        populateSubCities(cityValue);
        subCity.hidden = false;
        // otherSubCityWrap will be shown by syncSubCity when "Other" is selected
      } else {
        // Custom city or city without predefined sub-cities: show custom input directly
        if (subCity) {
          subCity.value = "";
          setFieldError(subCity, "");
        }
        subCity.hidden = true;
        // Show the custom input for sub-city
        otherSubCityWrap.hidden = false;
        if (otherSubCity) {
          otherSubCity.required = true;
        }
      }

      // Woreda field: available for any city where applicable
      // Show for Addis Ababa always, and for other cities optionally
      const showWoreda = CITIES_WITH_WOREDA.includes(cityValue) || isOtherCity;
      woredaWrap.hidden = !showWoreda;
      if (!showWoreda && woreda) {
        woreda.value = "";
        setFieldError(woreda, "");
      }
    }

    function syncSubCity() {
      const isOtherSubCity = subCity && subCity.value === "Other";
      const cityValue = city.value;
      const isOtherCity = cityValue === "Other city or town";
      const hasSubCities = SUB_CITIES_BY_CITY[cityValue] && SUB_CITIES_BY_CITY[cityValue].length > 0;

      if (hasSubCities && !isOtherCity) {
        // Known city with predefined sub-cities: show custom input when "Other" selected
        otherSubCityWrap.hidden = !isOtherSubCity;
        if (otherSubCity) {
          otherSubCity.required = isOtherSubCity;
          if (!isOtherSubCity) {
            otherSubCity.value = "";
            setFieldError(otherSubCity, "");
          }
        }
      } else {
        // Custom city or city without predefined sub-cities: custom input is always shown
        otherSubCityWrap.hidden = false;
        if (otherSubCity) {
          otherSubCity.required = true;
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

      const isOtherCity = city.value === "Other city or town";
      if (isOtherCity) {
        results.push(validateRequired(otherCity, "Please enter the city."));
      } else {
        setFieldError(otherCity, "");
      }

      // Sub-city / local administrative area validation
      const cityValue = city.value;
      const hasSubCities = SUB_CITIES_BY_CITY[cityValue] && SUB_CITIES_BY_CITY[cityValue].length > 0;

      if (hasSubCities && !isOtherCity) {
        // Known city with predefined sub-cities
        if (subCity.value === "Other") {
          results.push(validateRequired(otherSubCity, "Please enter the sub-city or district."));
        } else {
          results.push(validateRequired(subCity, "Please select a sub-city or district."));
          setFieldError(otherSubCity, "");
        }
      } else {
        // Custom city or city without predefined sub-cities: otherSubCity is the required field
        setFieldError(subCity, "");
        results.push(validateRequired(otherSubCity, "Please enter the sub-city, district, or local administrative area."));
      }

      // Area (neighborhood/kebele) is always required
      results.push(validateRequired(area, "Please enter the neighborhood, kebele, or local area."));

      // Woreda is optional, no validation needed

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
      city.addEventListener("change", () => {
        syncCity();
        validateRequired(city, "Please select a city.");
      });
      syncCity();
    }

    // Sub-city toggle
    if (subCity) {
      subCity.addEventListener("change", () => {
        syncSubCity();
        const cityValue = city.value;
        const isOtherCity = cityValue === "Other city or town";
        const hasSubCities = SUB_CITIES_BY_CITY[cityValue] && SUB_CITIES_BY_CITY[cityValue].length > 0;
        if (hasSubCities && !isOtherCity) {
          if (subCity.value === "Other") {
            // validation will happen on blur/submit
          } else {
            validateRequired(subCity, "Please select a sub-city or district.");
          }
        }
      });
    }

    // Field-level events
    title.addEventListener("blur", () => validateRequired(title, "Please enter a property title."));
    type.addEventListener("change", () => validateRequired(type, "Please select a property type."));
    city.addEventListener("change", () => validateRequired(city, "Please select a city."));
    if (otherCity) {
      otherCity.addEventListener("blur", () => {
        if (city.value === "Other city or town") validateRequired(otherCity, "Please enter the city.");
      });
    }
    if (subCity) {
      subCity.addEventListener("blur", () => {
        const cityValue = city.value;
        const isOtherCity = cityValue === "Other city or town";
        const hasSubCities = SUB_CITIES_BY_CITY[cityValue] && SUB_CITIES_BY_CITY[cityValue].length > 0;
        if (hasSubCities && !isOtherCity) {
          if (subCity.value === "Other") {
            // otherSubCity will be validated on its own blur
          } else {
            validateRequired(subCity, "Please select a sub-city or district.");
          }
        }
      });
    }
    if (otherSubCity) {
      otherSubCity.addEventListener("blur", () => {
        const cityValue = city.value;
        const isOtherCity = cityValue === "Other city or town";
        const hasSubCities = SUB_CITIES_BY_CITY[cityValue] && SUB_CITIES_BY_CITY[cityValue].length > 0;
        if (hasSubCities && !isOtherCity && subCity.value === "Other") {
          validateRequired(otherSubCity, "Please enter the sub-city or district.");
        } else if (!hasSubCities || isOtherCity) {
          // For custom cities or cities without predefined sub-cities, otherSubCity is always required
          validateRequired(otherSubCity, "Please enter the sub-city, district, or local administrative area.");
        }
      });
    }
    area.addEventListener("blur", () => validateRequired(area, "Please enter the neighborhood, kebele, or local area."));
    rent.addEventListener("blur", () => validatePositiveNumber(rent, "monthly rent"));
    description.addEventListener("blur", () => validateRequired(description, "Please enter a property description."));
    phone.addEventListener("blur", validatePhone);
    bedrooms.addEventListener("blur", () => validateOptionalNumber(bedrooms, "bedrooms", 0, 20));
    bathrooms.addEventListener("blur", () => validateOptionalNumber(bathrooms, "bathrooms", 0, 20));

    if (photos) {
      photos.addEventListener("change", validatePhotos);
    }

    // Clear errors on input
    [title, area, otherCity, otherSubCity, rent, description, phone, bedrooms, bathrooms, subCity, woreda, landmark].forEach((el) => {
      if (!el) return;
      el.addEventListener("input", () => {
        if (el.getAttribute("aria-invalid") === "true") {
          if (el === title) validateRequired(title, "Please enter a property title.");
          else if (el === area) validateRequired(area, "Please enter the neighborhood, kebele, or local area.");
          else if (el === otherCity) validateRequired(otherCity, "Please enter the city.");
          else if (el === otherSubCity) {
            const cityValue = city.value;
            const isOtherCity = cityValue === "Other city or town";
            const hasSubCities = SUB_CITIES_BY_CITY[cityValue] && SUB_CITIES_BY_CITY[cityValue].length > 0;
            if (hasSubCities && !isOtherCity && subCity.value === "Other") {
              validateRequired(otherSubCity, "Please enter the sub-city or district.");
            } else if (!hasSubCities || isOtherCity) {
              validateRequired(otherSubCity, "Please enter the sub-city, district, or local administrative area.");
            }
          }
          else if (el === subCity) {
            const cityValue = city.value;
            const isOtherCity = cityValue === "Other city or town";
            const hasSubCities = SUB_CITIES_BY_CITY[cityValue] && SUB_CITIES_BY_CITY[cityValue].length > 0;
            if (hasSubCities && !isOtherCity && subCity.value !== "Other") {
              validateRequired(subCity, "Please select a sub-city or district.");
            }
          }
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
