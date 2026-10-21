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
      subCities: ["Adama"],
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
      subCities: ["Jimma"],
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

  /* ------------------------------- Footer year ----------------------------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
