/* ==========================================================================
   Smart Rental — Landing page interactions
   - Mobile navigation toggle
   - Sticky header shadow on scroll
   - Active nav link highlighting
   - Property search / filtering
   - Scroll reveal animations
   - Dynamic footer year
   ========================================================================== */
(function () {
  "use strict";

  /* ---------------------------- Location data ---------------------------- */
  // Ethiopian cities with their administrative subdivisions.
  // This is frontend-only reference data for form fields and search filters.
  // It does NOT represent an exhaustive or legally authoritative list.
  // Landlords can always enter custom values for any level.
  const ETHIOPIA_LOCATIONS = {
    "Addis Ababa": {
      subCities: [
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
      // Addis Ababa sub-cities contain woredas; we don't enumerate all 100+ woredas here.
      // The form allows free-text woreda/neighborhood entry.
      hasWoredas: true,
    },
    "Dire Dawa": {
      // Dire Dawa local areas/kebeles. These are commonly referenced neighborhoods.
      // Not an exhaustive or officially authoritative list; landlords/renters can enter custom values.
      subCities: [
        "Sabian",
        "Kezira",
        "Gende Ada",
        "Melka Jebdu",
        "Lege Harre",
      ],
      hasWoredas: false,
    },
    "Hawassa": {
      // Hawassa has 8 sub-cities.
      subCities: [
        "Addis Ketema",
        "Bahil Adarash",
        "Haile",
        "Hayk Dar",
        "Mehal Ketema",
        "Misrak",
        "Tabor",
        "Wondogenet",
      ],
      hasWoredas: false,
    },
    "Harar": {
      // Harar Jugol (the walled city) has 19 kebeles; surrounding rural areas have additional kebeles.
      // We list the main areas as sub-cities; kebeles are free-text.
      subCities: [
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
      hasWoredas: false,
    },
    "Adama": {
      // Adama (Nazret) is divided into kebeles.
      subCities: [
        "Kebele 01",
        "Kebele 02",
        "Kebele 03",
        "Kebele 04",
        "Kebele 05",
        "Kebele 06",
        "Kebele 07",
        "Kebele 08",
        "Kebele 09",
        "Kebele 10",
        "Kebele 11",
        "Kebele 12",
        "Kebele 13",
        "Kebele 14",
        "Kebele 15",
        "Kebele 16",
        "Kebele 17",
        "Kebele 18",
      ],
      hasWoredas: false,
    },
    "Bahir Dar": {
      // Bahir Dar has sub-cities/kebeles.
      subCities: [
        "Bahir Dar Zuria",
        "Dagmawi",
        "Facil",
        "Gish Abay",
        "Hidar",
        "Shum Abo",
        "Sefene Selam",
        "Tana",
      ],
      hasWoredas: false,
    },
    "Mekelle": {
      // Mekelle has sub-cities.
      subCities: [
        "Adi Haki",
        "Aynalem",
        "Hawelti",
        "Kedamay Weyane",
        "Quiha",
        "Semien",
        "Hadnet",
        "Ayder",
      ],
      hasWoredas: false,
    },
    "Gondar": {
      // Gondar has sub-cities/kebeles.
      subCities: [
        "Azezo",
        "Dabat",
        "Gondar Zuria",
        "Maraki",
        "Teda",
      ],
      hasWoredas: false,
    },
    "Jimma": {
      // Jimma has kebeles.
      subCities: [
        "Kebele 01",
        "Kebele 02",
        "Kebele 03",
        "Kebele 04",
        "Kebele 05",
        "Kebele 06",
        "Kebele 07",
        "Kebele 08",
        "Kebele 09",
        "Kebele 10",
        "Kebele 11",
        "Kebele 12",
        "Kebele 13",
        "Kebele 14",
        "Kebele 15",
        "Kebele 16",
        "Kebele 17",
      ],
      hasWoredas: false,
    },
  };

  // Ordered list of cities for select elements.
  const CITY_ORDER = [
    "Addis Ababa",
    "Dire Dawa",
    "Hawassa",
    "Harar",
    "Adama",
    "Bahir Dar",
    "Mekelle",
    "Gondar",
    "Jimma",
    "Other city or town",
  ];

  function getSubCities(city) {
    const data = ETHIOPIA_LOCATIONS[city];
    return data ? data.subCities : [];
  }

  function cityHasWoredas(city) {
    const data = ETHIOPIA_LOCATIONS[city];
    return data ? data.hasWoredas : false;
  }

  function buildCityOptions(selectedValue = "") {
    return CITY_ORDER.map((city) => {
      const selected = city === selectedValue ? " selected" : "";
      return '<option value="' + city + '"' + selected + ">" + city + "</option>";
    }).join("");
  }

  function buildSubCityOptions(city, selectedValue = "") {
    const subCities = getSubCities(city);
    if (subCities.length === 0) return "";
    return subCities
      .map((sc) => {
        const selected = sc === selectedValue ? " selected" : "";
        return '<option value="' + sc + '"' + selected + ">" + sc + "</option>";
      })
      .join("");
  }

  
  

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  /* ------------------------------- Navigation ------------------------------ */
  const header = $("#siteHeader");
  const navToggle = $("#navToggle");
  const primaryNav = $("#primaryNav");

  function closeMenu() {
    if (!primaryNav) return;
    primaryNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation menu");
  }

  function toggleMenu() {
    const isOpen = primaryNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
  }

  if (navToggle && primaryNav) {
    navToggle.addEventListener("click", toggleMenu);

    // Close when a link inside the menu is chosen (mobile)
    $$("a", primaryNav).forEach((link) => {
      link.addEventListener("click", () => {
        if (window.matchMedia("(max-width: 860px)").matches) closeMenu();
      });
    });

    // Close on outside click
    document.addEventListener("click", (event) => {
      if (!primaryNav.classList.contains("is-open")) return;
      if (!primaryNav.contains(event.target) && !navToggle.contains(event.target)) {
        closeMenu();
      }
    });

    // Close on Escape
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && primaryNav.classList.contains("is-open")) {
        closeMenu();
        navToggle.focus();
      }
    });

    // Reset menu state when resizing back to desktop
    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) closeMenu();
    });
  }

  /* --------------------------- Header scroll state ------------------------- */
  let ticking = false;
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
      }
    },
    { passive: true }
  );
  onScroll();

  /* ------------------------ Active nav link highlighting ------------------- */
  const navLinks = $$("[data-nav]");
  const sections = ["home", "properties", "how-it-works", "about"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          $$(".nav-link").forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("href") === "#" + id);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((section) => navObserver.observe(section));
  }

  /* ---------------------------- Missing image fallback --------------------- */
  $$(".property-media img, .preview-media img").forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        img.hidden = true;
        if (img.parentElement && !$(".media-fallback", img.parentElement)) {
          const fallback = document.createElement("span");
          fallback.className = "media-fallback";
          fallback.textContent = "Image unavailable";
          img.parentElement.appendChild(fallback);
        }
      },
      { once: true }
    );
  });

/* ---------------------------- Property search ---------------------------- */
  const searchForm = $("#heroSearch");
  const propertyGrid = $("#propertyGrid");
  const filterStatus = $("#filterStatus");
  const noResults = $("#noResults");
  const propertySection = $("#properties");
  const locationSelect = $("#location");
  const subCitySelect = $("#subCity");
  const subCityCustomInput = $("#subCityCustom");
  const subCityWrap = $("#subCityWrap");
  const subCityCustomWrap = $("#subCityCustomWrap");
  const typeSelect = $("#type");
  const maxRentInput = $("#maxRent");
  const clearButton = $("#clearFilters");

  // Normalise text so matching is case-insensitive and ignores extra spaces.
  function normalise(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
  }

  function scrollToProperties() {
    if (!propertySection) return;
    propertySection.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  }

  function updateSubCityFilter() {
    if (!subCitySelect || !subCityWrap || !locationSelect || !subCityCustomInput) return;
    const city = locationSelect.value;
    const subCities = getSubCities(city);
    const isCustomCity = city === "Other city or town";
    const subCityCustomControl = $("#subCityCustomControl");
    const subCitySelectControl = $("#subCitySelectControl");

    // Always show the local-area filter for every city
    subCityWrap.hidden = false;

    if (subCities.length > 0 && !isCustomCity) {
      // City has predefined sub-cities: show select with options + "Other"
      const currentValue = subCitySelect.value;
      subCitySelect.innerHTML = '<option value="">All areas</option>' + buildSubCityOptions(city);
      // Add "Other" option for custom entry
      const otherOption = document.createElement("option");
      otherOption.value = "Other";
      otherOption.textContent = "Other area / custom";
      subCitySelect.appendChild(otherOption);
      if (subCities.includes(currentValue) || currentValue === "Other") {
        subCitySelect.value = currentValue;
      } else {
        subCitySelect.value = "";
      }
      subCitySelect.hidden = false;
      if (subCitySelectControl) subCitySelectControl.hidden = false;
      if (subCityCustomControl) subCityCustomControl.hidden = true;
      subCityCustomInput.hidden = true;
    } else {
      // City has no predefined sub-cities or is custom: show text input only
      subCitySelect.hidden = true;
      if (subCitySelectControl) subCitySelectControl.hidden = true;
      subCityCustomInput.hidden = false;
      subCityCustomInput.value = "";
      if (subCityCustomControl) subCityCustomControl.hidden = false;
    }
  }

  function getSubCityFilterValue() {
    if (!subCitySelect || !subCityCustomInput) return "";
    if (!subCitySelect.hidden) {
      return subCitySelect.value;
    }
    return subCityCustomInput.value;
  }

  function filterProperties() {
    if (!propertyGrid) return;

    const city = normalise(locationSelect ? locationSelect.value : "");
    const subCity = normalise(getSubCityFilterValue());
    const type = normalise(typeSelect ? typeSelect.value : "");

    // Read the maximum monthly rent, guarding against invalid input.
    let maxRent = null;
    if (maxRentInput && maxRentInput.value.trim() !== "") {
      const parsed = Number(maxRentInput.value);
      if (Number.isFinite(parsed) && parsed >= 0) {
        maxRent = parsed;
        maxRentInput.setAttribute("aria-invalid", "false");
      } else {
        maxRentInput.setAttribute("aria-invalid", "true");
      }
    }

    let visibleCount = 0;
    const cards = $$(".property-card", propertyGrid);

    cards.forEach((card) => {
      const cardCity = normalise(card.dataset.city);
      const cardSubCity = normalise(card.dataset.subCity);
      const cardArea = normalise(card.dataset.area);
      const cardType = normalise(card.dataset.type);
      const cardPrice = Number(card.dataset.price);

      // Match city: either no city filter, or card city matches, or card city contains filter (for custom cities)
      const matchesCity = !city || cardCity === city || cardCity.includes(city);

      // Match sub-city: if sub-city filter is set, check against card's sub-city and area
      const matchesSubCity =
        !subCity || cardSubCity === subCity || cardSubCity.includes(subCity) || cardArea === subCity || cardArea.includes(subCity);

      const matchesType = !type || cardType === type;
      const matchesMaxRent = maxRent === null || cardPrice <= maxRent;

      const show = matchesCity && matchesSubCity && matchesType && matchesMaxRent;
      card.classList.toggle("is-hidden", !show);
      if (show) visibleCount += 1;
    });

    const hasFilters = Boolean(city || subCity || type || maxRent !== null);

    if (noResults) noResults.hidden = visibleCount !== 0 || !hasFilters;
    if (clearButton) clearButton.hidden = !hasFilters;

    if (filterStatus) {
      if (hasFilters) {
        filterStatus.hidden = false;
        filterStatus.textContent =
          visibleCount === 0
            ? "No listings match your filters."
            : visibleCount === 1
            ? "1 listing matches your search."
            : visibleCount + " listings match your search.";
      } else {
        filterStatus.hidden = true;
      }
    }
  }

  function resetFilters() {
    if (searchForm) searchForm.reset();
    [locationSelect, subCitySelect, subCityCustomInput, typeSelect, maxRentInput].forEach((el) => {
      if (el) el.removeAttribute("aria-invalid");
    });
    updateSubCityFilter();
    filterProperties();
  }

  if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      filterProperties();
      scrollToProperties();
    });

    // Live filtering as the user adjusts the controls
    $$("select, input", searchForm).forEach((control) => {
      control.addEventListener("input", filterProperties);
      control.addEventListener("change", filterProperties);
    });

    // Update sub-city options when city changes
    if (locationSelect) {
      locationSelect.addEventListener("change", updateSubCityFilter);
    }

    // Handle "Other" selection in sub-city dropdown
    if (subCitySelect) {
      subCitySelect.addEventListener("change", () => {
        const subCityCustomControl = $("#subCityCustomControl");
        const subCitySelectControl = $("#subCitySelectControl");
        const isOther = subCitySelect.value === "Other";
        if (subCityCustomControl) subCityCustomControl.hidden = !isOther;
        if (subCitySelectControl) subCitySelectControl.hidden = isOther;
        subCityCustomInput.hidden = !isOther;
        if (isOther) {
          subCityCustomInput.focus();
        }
        filterProperties();
      });
    }

    // Live filter on custom sub-city input
    if (subCityCustomInput) {
      subCityCustomInput.addEventListener("input", filterProperties);
    }
  }

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      resetFilters();
    });
  }

  // Initial state: no filters active, so show every card.
  updateSubCityFilter();
  filterProperties();

  /* ------------------------------ Scroll reveal ---------------------------- */
  const revealTargets = $$(
    ".feature-card, .property-card, .step, .about-copy, .about-panel, .cta-panel, .section-head"
  );

  if ("IntersectionObserver" in window && revealTargets.length) {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!prefersReduced) {
      const revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("reveal", "is-visible");
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );

      revealTargets.forEach((el) => {
        el.classList.add("reveal");
        revealObserver.observe(el);
      });
    }
  }

  /* -------------------------- Landlord property rendering -------------------- */
  const LANDLORD_PROPERTIES_KEY = "smartrental.landlordProperties";

    function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, "")
      .replace(/'/g, "'");
  }

  function getLandlordProperties() {
    try {
      const raw = localStorage.getItem(LANDLORD_PROPERTIES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function adaptLandlordPropertyForHomepage(lp) {
    if (!lp) return null;
    const city = lp.city || "";
    const subCity = lp.subCity || "";
    const area = lp.area || "";
    const locationParts = [city, subCity, area].filter(Boolean);
    const location = locationParts.join(", ") || city || "—";

    const meta = [];
    if (lp.type) meta.push(lp.type);
    if (lp.bedrooms && lp.bedrooms > 0) meta.push(lp.bedrooms + " Bedroom" + (lp.bedrooms > 1 ? "s" : ""));
    else if (lp.type === "Studio Apartment" || lp.type === "Single Room" || lp.type === "Shared Room") meta.push("Studio / Single");
    if (lp.bathrooms && lp.bathrooms > 0) meta.push(lp.bathrooms + " bath" + (lp.bathrooms > 1 ? "s" : ""));
    if (lp.furnishing) meta.push(lp.furnishing);

    let typeBadge = lp.type || "Property";
    if (typeBadge === "Studio Apartment") typeBadge = "Studio";
    else if (typeBadge === "Single Room" || typeBadge === "Shared Room") typeBadge = "Boarding";
    else if (typeBadge === "Boarding house") typeBadge = "Boarding";

    const cityKey = (city || "").toLowerCase().replace(/\s+/g, "-");
    const mediaClass = "media-" + cityKey || "media-default";

    // Use city-based placeholder image
    let image = "assets/properties/placeholder.jpg";
    let imageAlt = "Property image";
    if (city === "Addis Ababa") {
      image = "assets/properties/bole-studio.jpg";
      imageAlt = "Sample property in Addis Ababa";
    } else if (city === "Dire Dawa") {
      image = "assets/properties/dire-house.jpg";
      imageAlt = "Sample property in Dire Dawa";
    } else if (city === "Hawassa") {
      image = "assets/properties/hawassa-room.jpg";
      imageAlt = "Sample property in Hawassa";
    }

    return {
      id: lp.id,
      name: lp.title || "Untitled Property",
      city: city,
      subCity: subCity,
      area: area,
      location: location,
      type: lp.type || "Property",
      typeBadge: typeBadge,
      price: lp.rent || 0,
      priceText: "ETB " + Number(lp.rent || 0).toLocaleString(),
      meta: meta,
      image: image,
      imageAlt: imageAlt,
      mediaClass: mediaClass,
      _landlord: true,
      _original: lp,
    };
  }

  function renderLandlordProperties() {
    if (!propertyGrid) return;

    const landlordProps = getLandlordProperties().map(adaptLandlordPropertyForHomepage).filter(Boolean);
    if (landlordProps.length === 0) return;

    landlordProps.forEach((p) => {
      // Check if already rendered (avoid duplicates on re-render)
      if (propertyGrid.querySelector('[data-property-id="' + p.id + '"]')) return;

      const article = document.createElement("article");
      article.className = "property-card";
      article.setAttribute("data-property-id", p.id);
      article.setAttribute("data-city", p.city);
      article.setAttribute("data-sub-city", p.subCity || "");
      article.setAttribute("data-area", p.area || "");
      article.setAttribute("data-type", p.type);
      article.setAttribute("data-price", String(p.price));

      const metaHtml = p.meta.map((m) => "<li>" + escapeHtml(m) + "</li>").join("");

      article.innerHTML =
        '<div class="property-media ' + escapeHtml(p.mediaClass) + '">' +
        '<button type="button" class="save-btn" data-save-id="' + escapeHtml(p.id) + '" data-property-name="' + escapeHtml(p.name) + '" aria-pressed="false" aria-label="Save ' + escapeHtml(p.name) + ' to saved properties">' +
        '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />' +
        "</svg>" +
        "</button>" +
        '<img src="' + escapeHtml(p.image) + '" alt="' + escapeHtml(p.imageAlt) + '" loading="lazy" width="400" height="200" />' +
        '<span class="badge badge-sample">Sample listing</span>' +
        '<span class="badge badge-type">' + escapeHtml(p.typeBadge) + "</span>" +
        "</div>" +
        '<div class="property-body">' +
        '<h3 class="property-name">' + escapeHtml(p.name) + "</h3>" +
        '<p class="property-loc">' +
        '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>' +
        escapeHtml(p.location) +
        "</p>" +
        '<ul class="property-meta">' + metaHtml + "</ul>" +
        '<div class="property-foot">' +
        '<p class="property-price">' + escapeHtml(p.priceText) + ' <span>/ month</span></p>' +
        '<a class="btn btn-outline" href="property-details.html?id=' + escapeHtml(p.id) + '" aria-label="View details for ' + escapeHtml(p.name) + '">View Details</a>' +
        "</div>" +
        "</div>";

      // Missing image fallback
      const img = article.querySelector(".property-media img");
      if (img) {
        img.addEventListener(
          "error",
          () => {
            img.hidden = true;
            const media = img.parentElement;
            if (media && !media.querySelector(".media-fallback")) {
              const fallback = document.createElement("span");
              fallback.className = "media-fallback";
              fallback.textContent = "Image unavailable";
              media.appendChild(fallback);
            }
          },
          { once: true }
        );
      }

      propertyGrid.appendChild(article);
    });

    // Re-apply save states for newly added buttons (renter.js handles this globally)
    if (window.SmartRentalSaved && typeof window.SmartRentalSaved.applyAllSaveStates === "function") {
      window.SmartRentalSaved.applyAllSaveStates();
    }
  }

  // Render landlord properties on load
  renderLandlordProperties();

  // Re-render when landlord properties change (cross-tab)
  window.addEventListener("storage", (event) => {
    if (event.key === LANDLORD_PROPERTIES_KEY) {
      renderLandlordProperties();
    }
  });

  /* ------------------------------- Footer year ----------------------------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
