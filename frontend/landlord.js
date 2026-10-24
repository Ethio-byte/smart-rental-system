/* ==========================================================================
   Smart Rental — Landlord dashboard & Add Property interactions
   - Client-side only: property data stored in localStorage (demo only)
   - No authentication or backend integration
   ========================================================================== */
(function () {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  /* ---------------------------- Property Storage --------------------------- */
  const LANDLORD_PROPERTIES_KEY = "smartrental.landlordProperties";

  function getLandlordProperties() {
    try {
      const raw = localStorage.getItem(LANDLORD_PROPERTIES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function setLandlordProperties(properties) {
    try {
      localStorage.setItem(LANDLORD_PROPERTIES_KEY, JSON.stringify(properties));
    } catch (e) {
      /* ignore quota / private mode errors */
    }
  }

  function generatePropertyId(title) {
    const base = String(title || "property")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 6);
    return base + "-" + timestamp + "-" + random;
  }

  function saveProperty(propertyData) {
    const properties = getLandlordProperties();
    const newProperty = {
      id: generatePropertyId(propertyData.title),
      ...propertyData,
      createdAt: new Date().toISOString(),
      status: "draft",
    };
    properties.unshift(newProperty);
    setLandlordProperties(properties);
    return newProperty;
  }

  function updateProperty(propertyId, updates) {
    const properties = getLandlordProperties();
    const index = properties.findIndex((p) => p.id === propertyId);
    if (index === -1) return null;
    properties[index] = { ...properties[index], ...updates, updatedAt: new Date().toISOString() };
    setLandlordProperties(properties);
    return properties[index];
  }

  function deleteProperty(propertyId) {
    const properties = getLandlordProperties();
    const filtered = properties.filter((p) => p.id !== propertyId);
    setLandlordProperties(filtered);
    return filtered.length !== properties.length;
  }

  function getProperty(propertyId) {
    return getLandlordProperties().find((p) => p.id === propertyId) || null;
  }

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
    const choosePhotos = $("#choosePhotos");
    const takePhoto = $("#takePhoto");
    const preview = $("#photoPreview");

    const MAX_PHOTOS = 10;
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
    let objectUrls = [];
    let selectedFiles = [];
    let coverIndex = 0;

    // Sub-city options by city (only for cities with defined administrative sub-cities)
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
    };

    // Cities that have predefined sub-city/dropdown options
    const CITIES_WITH_SUBCITY_DROPDOWN = new Set(["Addis Ababa", "Dire Dawa"]);

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
      const hasSubCityDropdown = CITIES_WITH_SUBCITY_DROPDOWN.has(cityValue);

      // No city selected yet: reset to initial HTML state (dropdown visible, custom hidden)
      if (!cityValue) {
        subCityWrap.hidden = false;
        subCity.hidden = false;
        otherSubCityWrap.hidden = true;
        if (otherSubCity) {
          otherSubCity.required = false;
          otherSubCity.value = "";
          setFieldError(otherSubCity, "");
        }
        if (subCity) {
          subCity.value = "";
          setFieldError(subCity, "");
        }
        otherCityWrap.hidden = true;
        if (otherCity) {
          otherCity.required = false;
          otherCity.value = "";
          setFieldError(otherCity, "");
        }
        woredaWrap.hidden = true;
        if (woreda) {
          woreda.value = "";
          setFieldError(woreda, "");
        }
        return;
      }

      // Other city input
      otherCityWrap.hidden = !isOtherCity;
      if (otherCity) {
        otherCity.required = isOtherCity;
        if (!isOtherCity) {
          otherCity.value = "";
          setFieldError(otherCity, "");
        }
      }

      // Sub-city / district field: show dropdown for Addis Ababa & Dire Dawa, custom input otherwise
      if (hasSubCityDropdown && !isOtherCity) {
        // Known city with predefined sub-cities: show select wrapper, hide custom input wrapper
        subCityWrap.hidden = false;
        populateSubCities(cityValue);
        subCity.hidden = false;
        otherSubCityWrap.hidden = true;
        if (otherSubCity) {
          otherSubCity.required = false;
          otherSubCity.value = "";
          setFieldError(otherSubCity, "");
        }
      } else {
        // Custom city or city without predefined sub-cities: hide select wrapper, show custom input wrapper
        subCityWrap.hidden = true;
        if (subCity) {
          subCity.value = "";
          subCity.hidden = true;
          setFieldError(subCity, "");
        }
        otherSubCityWrap.hidden = false;
        if (otherSubCity) {
          otherSubCity.required = true;
        }
      }

      // Sync sub-city dependent state (handles "Other" selection in dropdown)
      syncSubCity();

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
      const hasSubCityDropdown = CITIES_WITH_SUBCITY_DROPDOWN.has(cityValue);

      if (hasSubCityDropdown && !isOtherCity) {
        // Known city with predefined sub-cities: show custom input when "Other" selected
        // Keep dropdown wrapper visible so user can change selection
        subCityWrap.hidden = false;
        otherSubCityWrap.hidden = !isOtherSubCity;
        if (otherSubCity) {
          otherSubCity.required = isOtherSubCity;
          if (!isOtherSubCity) {
            otherSubCity.value = "";
            setFieldError(otherSubCity, "");
          }
        }
      } else {
        // Custom city or city without predefined sub-cities: custom input wrapper always shown
        subCityWrap.hidden = true;
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

    function fileKey(file) {
      return file.name + ":" + file.size + ":" + file.lastModified;
    }

    function renderPreview() {
      if (!preview) return;
      revokeUrls();
      preview.innerHTML = "";
      if (!selectedFiles || selectedFiles.length === 0) {
        const empty = document.createElement("p");
        empty.className = "photo-empty";
        empty.textContent = "No photos selected yet.";
        preview.appendChild(empty);
        return;
      }
      selectedFiles.forEach((file, index) => {
        const url = URL.createObjectURL(file);
        objectUrls.push(url);
        const figure = document.createElement("figure");
        figure.className = "photo-thumb" + (index === coverIndex ? " is-cover" : "");
        figure.dataset.index = index;

        const img = document.createElement("img");
        img.src = url;
        img.alt = file.name;
        img.loading = "lazy";

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "photo-remove";
        removeBtn.setAttribute("aria-label", "Remove " + file.name);
        removeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

        const coverBtn = document.createElement("button");
        coverBtn.type = "button";
        coverBtn.className = "photo-cover-btn" + (index === coverIndex ? " is-active" : "");
        coverBtn.setAttribute("aria-label", index === coverIndex ? "Cover photo (current)" : "Set as cover photo");
        coverBtn.setAttribute("aria-pressed", index === coverIndex ? "true" : "false");
        coverBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="12" cy="12" r="3"></circle></svg>';

        const caption = document.createElement("figcaption");
        caption.textContent = file.name;

        figure.appendChild(img);
        figure.appendChild(removeBtn);
        figure.appendChild(coverBtn);
        figure.appendChild(caption);
        preview.appendChild(figure);
      });

      // Attach event listeners for remove and cover buttons
      preview.querySelectorAll(".photo-remove").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const figure = btn.closest(".photo-thumb");
          const index = parseInt(figure.dataset.index, 10);
          removePhoto(index);
        });
      });

      preview.querySelectorAll(".photo-cover-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const figure = btn.closest(".photo-thumb");
          const index = parseInt(figure.dataset.index, 10);
          setCoverPhoto(index);
        });
      });
    }

    function removePhoto(index) {
      if (index < 0 || index >= selectedFiles.length) return;

      // Revoke the object URL for the removed photo
      if (objectUrls[index]) {
        try { URL.revokeObjectURL(objectUrls[index]); } catch (e) { /* ignore */ }
      }

      selectedFiles.splice(index, 1);
      objectUrls.splice(index, 1);

      // Adjust cover index if needed
      if (coverIndex >= selectedFiles.length) {
        coverIndex = selectedFiles.length > 0 ? 0 : 0;
      }

      renderPreview();
      validatePhotos();
    }

    function setCoverPhoto(index) {
      if (index < 0 || index >= selectedFiles.length) return;
      coverIndex = index;
      renderPreview();
    }

    function addFiles(newFiles) {
      const existingKeys = new Set(selectedFiles.map(fileKey));
      let added = 0;
      let rejected = 0;

      for (const file of newFiles) {
        if (selectedFiles.length >= MAX_PHOTOS) {
          rejected++;
          continue;
        }
        const key = fileKey(file);
        if (existingKeys.has(key)) {
          // Duplicate - skip
          continue;
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
          rejected++;
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          rejected++;
          continue;
        }
        selectedFiles.push(file);
        existingKeys.add(key);
        added++;
      }

      if (rejected > 0) {
        setFieldError(choosePhotos, "Some files were rejected: wrong type, too large, or would exceed the " + MAX_PHOTOS + "-photo limit.");
      } else {
        setFieldError(choosePhotos, "");
      }

      if (added > 0 || rejected > 0) {
        renderPreview();
      }
      return added > 0;
    }

    function validatePhotos() {
      if (selectedFiles.length === 0) {
        setFieldError(choosePhotos, "");
        renderPreview();
        return true;
      }
      if (selectedFiles.length > MAX_PHOTOS) {
        setFieldError(choosePhotos, "You can select up to " + MAX_PHOTOS + " photos.");
        return false;
      }
      for (const file of selectedFiles) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setFieldError(choosePhotos, "Only JPEG, PNG, or WebP images are allowed.");
          return false;
        }
        if (file.size > MAX_FILE_SIZE) {
          setFieldError(choosePhotos, "Each photo must be 5 MB or smaller.");
          return false;
        }
      }
      setFieldError(choosePhotos, "");
      renderPreview();
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
      const hasSubCityDropdown = CITIES_WITH_SUBCITY_DROPDOWN.has(cityValue);

      if (hasSubCityDropdown && !isOtherCity) {
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
      // Do NOT call syncCity() on init — city is empty, would show wrong UI
    }

    // Sub-city toggle
    if (subCity) {
      subCity.addEventListener("change", () => {
        syncSubCity();
        const cityValue = city.value;
        const isOtherCity = cityValue === "Other city or town";
        const hasSubCityDropdown = CITIES_WITH_SUBCITY_DROPDOWN.has(cityValue);
        if (hasSubCityDropdown && !isOtherCity) {
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
        const hasSubCityDropdown = CITIES_WITH_SUBCITY_DROPDOWN.has(cityValue);
        if (hasSubCityDropdown && !isOtherCity) {
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
        const hasSubCityDropdown = CITIES_WITH_SUBCITY_DROPDOWN.has(cityValue);
        if (hasSubCityDropdown && !isOtherCity && subCity.value === "Other") {
          validateRequired(otherSubCity, "Please enter the sub-city or district.");
        } else if (!hasSubCityDropdown || isOtherCity) {
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

    function handleFileSelect(inputEl) {
      if (!inputEl || !inputEl.files || inputEl.files.length === 0) return;
      const newFiles = Array.from(inputEl.files);
      addFiles(newFiles);
      inputEl.value = "";
    }

    if (choosePhotos) {
      choosePhotos.addEventListener("change", () => handleFileSelect(choosePhotos));
    }
    if (takePhoto) {
      takePhoto.addEventListener("change", () => handleFileSelect(takePhoto));
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
            const hasSubCityDropdown = CITIES_WITH_SUBCITY_DROPDOWN.has(cityValue);
            if (hasSubCityDropdown && !isOtherCity && subCity.value === "Other") {
              validateRequired(otherSubCity, "Please enter the sub-city or district.");
            } else if (!hasSubCityDropdown || isOtherCity) {
              validateRequired(otherSubCity, "Please enter the sub-city, district, or local administrative area.");
            }
          }
          else if (el === subCity) {
            const cityValue = city.value;
            const isOtherCity = cityValue === "Other city or town";
            const hasSubCityDropdown = CITIES_WITH_SUBCITY_DROPDOWN.has(cityValue);
            if (hasSubCityDropdown && !isOtherCity && subCity.value !== "Other") {
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

    function collectFormData() {
      const cityValue = city.value;
      const isOtherCity = cityValue === "Other city or town";
      const hasSubCityDropdown = CITIES_WITH_SUBCITY_DROPDOWN.has(cityValue);

      let subCityValue = "";
      if (hasSubCityDropdown && !isOtherCity) {
        subCityValue = subCity.value === "Other" ? (otherSubCity.value || "").trim() : subCity.value;
      } else {
        subCityValue = (otherSubCity.value || "").trim();
      }

      const woredaValue = (woreda.value || "").trim();
      const areaValue = (area.value || "").trim();
      const landmarkValue = (landmark.value || "").trim();

      return {
        title: (title.value || "").trim(),
        type: type.value,
        city: isOtherCity ? (otherCity.value || "").trim() : cityValue,
        subCity: subCityValue,
        woreda: woredaValue,
        area: areaValue,
        landmark: landmarkValue,
        rent: Number(rent.value),
        furnishing: furnishing.value || "",
        bedrooms: bedrooms.value ? Number(bedrooms.value) : 0,
        bathrooms: bathrooms.value ? Number(bathrooms.value) : 0,
        description: (description.value || "").trim(),
        phone: (phone.value || "").trim(),
        photos: selectedFiles.map((f) => f.name),
      };
    }

    addPropertyForm.addEventListener("submit", (event) => {
      event.preventDefault();
      clearFormMessage(messageEl);

      if (!validateForm()) {
        showFormMessage(messageEl, "error", "Please fix the highlighted fields and try again.");
        focusFirstInvalid(addPropertyForm);
        return;
      }

      const propertyData = collectFormData();
      const savedProperty = saveProperty(propertyData);

      showFormMessage(
        messageEl,
        "success",
        "Property saved locally (demo only). It now appears in your dashboard below. Data is stored in this browser's localStorage and is not uploaded anywhere."
      );

      addPropertyForm.reset();
      selectedFiles = [];
      coverIndex = 0;
      revokeUrls();
      renderPreview();
      syncCity();

      setTimeout(() => {
        window.location.href = "landlord-dashboard.html";
      }, 1500);
    });
  }

  /* ---------------------------- Dashboard Rendering -------------------------- */
  const propertyTableBody = $("#propertyTableBody");
  const emptyPropertiesRow = $("#emptyPropertiesRow");

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, "")
      .replace(/'/g, "'");
  }

  function formatPrice(amount) {
    return "ETB " + Number(amount).toLocaleString();
  }

  function formatStatus(status) {
    const statusMap = {
      draft: { label: "Draft", class: "status-draft" },
      published: { label: "Published", class: "status-published" },
      unlisted: { label: "Unlisted", class: "status-unlisted" },
    };
    const s = statusMap[status] || statusMap.draft;
    return '<span class="status-badge ' + s.class + '">' + s.label + "</span>";
  }

  function createPropertyRow(property) {
    const tr = document.createElement("tr");
    tr.dataset.propertyId = property.id;

    const locationParts = [];
    if (property.city) locationParts.push(property.city);
    if (property.subCity) locationParts.push(property.subCity);
    if (property.area) locationParts.push(property.area);
    const location = locationParts.join(", ") || "—";

    tr.innerHTML =
      '<td>' +
      '<div class="property-cell">' +
      '<strong>' + escapeHtml(property.title) + "</strong>" +
      '<span class="property-type">' + escapeHtml(property.type) + "</span>" +
      "</div>" +
      "</td>" +
      '<td>' + escapeHtml(location) + "</td>" +
      '<td>' + escapeHtml(formatPrice(property.rent)) + "</td>" +
      '<td>' + formatStatus(property.status) + "</td>" +
      '<td class="cell-actions">' +
      '<button type="button" class="btn btn-outline btn-sm edit-btn" data-property-id="' + escapeHtml(property.id) + '" aria-label="Edit ' + escapeHtml(property.title) + '">Edit</button>' +
      '<button type="button" class="btn btn-outline btn-sm delete-btn" data-property-id="' + escapeHtml(property.id) + '" aria-label="Delete ' + escapeHtml(property.title) + '">Delete</button>' +
      "</td>";

    return tr;
  }

  function renderDashboard() {
    if (!propertyTableBody) return;

    const properties = getLandlordProperties();

    if (emptyPropertiesRow) {
      emptyPropertiesRow.hidden = properties.length > 0;
    }

    const existingRows = $$("tr[data-property-id]", propertyTableBody);
    existingRows.forEach((row) => row.remove());

    if (properties.length === 0) {
      return;
    }

    properties.forEach((property) => {
      propertyTableBody.appendChild(createPropertyRow(property));
    });
  }

  /* ---------------------------- Edit/Delete Handlers ----------------------- */
  function openEditModal(property) {
    const url = "add-property.html?edit=" + encodeURIComponent(property.id);
    window.location.href = url;
  }

  function confirmDelete(propertyId) {
    const property = getProperty(propertyId);
    if (!property) return;

    const confirmed = window.confirm(
      'Delete "' + property.title + '"?\n\nThis action cannot be undone. The property will be permanently removed from your dashboard.'
    );

    if (confirmed) {
      deleteProperty(propertyId);
      renderDashboard();
    }
  }

  function setupDashboardActions() {
    if (!propertyTableBody) return;

    propertyTableBody.addEventListener("click", (event) => {
      const editBtn = event.target.closest(".edit-btn");
      const deleteBtn = event.target.closest(".delete-btn");

      if (editBtn) {
        const propertyId = editBtn.getAttribute("data-property-id");
        if (propertyId) {
          openEditModal(getProperty(propertyId));
        }
        return;
      }

      if (deleteBtn) {
        const propertyId = deleteBtn.getAttribute("data-property-id");
        if (propertyId) {
          confirmDelete(propertyId);
        }
        return;
      }
    });
  }

  /* ---------------------------- Edit Mode Support -------------------------- */
  function populateFormForEdit(property) {
    if (!property) return;

    title.value = property.title || "";
    type.value = property.type || "";
    city.value = property.city || "";
    syncCity();

    const cityValue = property.city;
    const isOtherCity = cityValue === "Other city or town";
    const hasSubCityDropdown = CITIES_WITH_SUBCITY_DROPDOWN.has(cityValue);

    if (isOtherCity) {
      otherCity.value = property.city || "";
    }

    if (hasSubCityDropdown && !isOtherCity) {
      const subCities = SUB_CITIES_BY_CITY[cityValue] || [];
      if (subCities.includes(property.subCity)) {
        subCity.value = property.subCity;
      } else {
        subCity.value = "Other";
        otherSubCity.value = property.subCity || "";
      }
    } else {
      otherSubCity.value = property.subCity || "";
    }
    syncSubCity();

    woreda.value = property.woreda || "";
    area.value = property.area || "";
    landmark.value = property.landmark || "";
    rent.value = property.rent || "";
    furnishing.value = property.furnishing || "";
    bedrooms.value = property.bedrooms || "";
    bathrooms.value = property.bathrooms || "";
    description.value = property.description || "";
    phone.value = property.phone || "";

    selectedFiles = [];
    objectUrls = [];
    coverIndex = 0;
    renderPreview();

    validateForm();
  }

  function initEditMode() {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    if (!editId) return;

    const property = getProperty(editId);
    if (!property) {
      showFormMessage(messageEl, "error", "Property not found. It may have been deleted.");
      return;
    }

    const editIndicator = document.createElement("div");
    editIndicator.className = "form-message form-message--success";
    editIndicator.hidden = false;
    editIndicator.innerHTML =
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" /></svg>' +
      'Editing <strong>' + escapeHtml(property.title) + "</strong>. Changes will update the existing listing.";

    const formHead = $(".auth-head", addPropertyForm);
    if (formHead) {
      formHead.insertAdjacentElement("afterend", editIndicator);
    }

    const submitBtn = $('button[type="submit"]', addPropertyForm);
    if (submitBtn) {
      submitBtn.textContent = "Save Changes";
    }

    const originalSubmitHandler = addPropertyForm.onsubmit;
    addPropertyForm.removeEventListener("submit", originalSubmitHandler);

    addPropertyForm.addEventListener("submit", (event) => {
      event.preventDefault();
      clearFormMessage(messageEl);

      if (!validateForm()) {
        showFormMessage(messageEl, "error", "Please fix the highlighted fields and try again.");
        focusFirstInvalid(addPropertyForm);
        return;
      }

      const propertyData = collectFormData();
      updateProperty(editId, propertyData);

      showFormMessage(
        messageEl,
        "success",
        "Property updated locally (demo only). Changes are saved in this browser's localStorage."
      );

      setTimeout(() => {
        window.location.href = "landlord-dashboard.html";
      }, 1500);
    });

    populateFormForEdit(property);
  }

  /* ---------------------------- Init Dashboard ----------------------------- */
  if (propertyTableBody) {
    renderDashboard();
    setupDashboardActions();
  }

  if (addPropertyForm) {
    initEditMode();
  }

  /* ------------------------------- Footer year ----------------------------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
