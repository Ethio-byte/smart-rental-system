/* ==========================================================================
   Smart Rental — Renter dashboard & saved properties (frontend-only)
   - Temporary browser-local storage (localStorage) for saved property ids.
   - No accounts, passwords, or personal data are stored.
   - Saved properties will be connected to authenticated renter accounts via
     Supabase in a later phase.
   ========================================================================== */
(function () {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  /* ---------------------------- Property data ----------------------------- */
  // Base sample properties (matching homepage and property-details.js).
  const SAMPLE_PROPERTIES = [
    {
      id: "bole-deluxe-studio",
      name: "Bole Deluxe Studio",
      city: "Addis Ababa",
      subCity: "Bole",
      area: "Bole",
      location: "Bole, Addis Ababa",
      type: "Studio Apartment",
      typeBadge: "Studio",
      price: 9500,
      priceText: "ETB 9,500",
      meta: ["Studio Apartment", "1 bath", "Furnished"],
      image: "assets/properties/bole-studio.jpg",
      imageAlt: "Modern studio apartment interior in Bole, Addis Ababa with natural light and contemporary furnishings",
      mediaClass: "media-bole",
    },
    {
      id: "dire-dawa-family-house",
      name: "Dire Dawa Family House",
      city: "Dire Dawa",
      subCity: "Sabian",
      area: "Sabian",
      location: "Sabian, Dire Dawa",
      type: "House",
      typeBadge: "House",
      price: 18000,
      priceText: "ETB 18,000",
      meta: ["3 Bedrooms", "2 baths", "Parking"],
      image: "assets/properties/dire-house.jpg",
      imageAlt: "Spacious family house exterior in Sabian, Dire Dawa with garden and parking area",
      mediaClass: "media-dire",
    },
    {
      id: "hawassa-lakeview-room",
      name: "Hawassa Lakeview Room",
      city: "Hawassa",
      subCity: "Tabor",
      area: "Tabor",
      location: "Tabor, Hawassa",
      type: "Single Room",
      typeBadge: "Boarding",
      price: 4200,
      priceText: "ETB 4,200",
      meta: ["Single Room", "Shared kitchen", "Water included"],
      image: "assets/properties/hawassa-room.jpg",
      imageAlt: "Bright single room in Tabor, Hawassa with natural light, shared kitchen access, and lake area views",
      mediaClass: "media-hawassa",
    },
  ];

  const STORAGE_KEY = "smartrental.savedProperties";
  const LANDLORD_PROPERTIES_KEY = "smartrental.landlordProperties";

  /* ------------------------ Landlord property adapter ---------------------- */
  // Convert a landlord property (from localStorage) to the renter-facing format.
  function adaptLandlordProperty(lp) {
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

    // Determine a type badge for display
    let typeBadge = lp.type || "Property";
    if (typeBadge === "Studio Apartment") typeBadge = "Studio";
    else if (typeBadge === "Single Room" || typeBadge === "Shared Room") typeBadge = "Boarding";
    else if (typeBadge === "Boarding house") typeBadge = "Boarding";

    // Media class for CSS background fallback
    const cityKey = (city || "").toLowerCase().replace(/\s+/g, "-");
    const mediaClass = "media-" + cityKey || "media-default";

    // Use first photo if available, otherwise fall back to a placeholder
    let image = "assets/properties/placeholder.jpg";
    let imageAlt = "Property image";
    if (lp.photos && lp.photos.length > 0) {
      // Landlord photos are stored as filenames only (not uploaded).
      // We can't display them, so use a placeholder.
      image = "assets/properties/placeholder.jpg";
      imageAlt = lp.title + " (photo preview not available)";
    } else if (city === "Addis Ababa") {
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
      // Mark as landlord-created for any special handling
      _landlord: true,
      // Store original data for property-details page
      _original: lp,
    };
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

  function getAllProperties() {
    const landlordProps = getLandlordProperties().map(adaptLandlordProperty).filter(Boolean);
    return [...SAMPLE_PROPERTIES, ...landlordProps];
  }

  function getProperty(id) {
    // Check sample properties first
    const sample = SAMPLE_PROPERTIES.find((p) => p.id === id);
    if (sample) return sample;
    // Then check landlord properties
    const landlordRaw = getLandlordProperties().find((p) => p.id === id);
    if (landlordRaw) return adaptLandlordProperty(landlordRaw);
    return null;
  }

  function getSavedIds() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
    } catch (e) {
      return [];
    }
  }

  function setSavedIds(ids) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch (e) {
      /* ignore quota / private mode errors */
    }
  }

  function isSaved(id) {
    return getSavedIds().indexOf(id) !== -1;
  }

  function saveProperty(id) {
    const ids = getSavedIds();
    if (ids.indexOf(id) === -1) {
      ids.push(id);
      setSavedIds(ids);
    }
  }

  function unsaveProperty(id) {
    setSavedIds(getSavedIds().filter((x) => x !== id));
  }

  function toggleSaved(id) {
    if (isSaved(id)) {
      unsaveProperty(id);
      return false;
    }
    saveProperty(id);
    return true;
  }

  /* ---------------------------- Save button UI ---------------------------- */
  function applySaveState(btn, saved) {
    btn.classList.toggle("is-saved", saved);
    btn.setAttribute("aria-pressed", String(saved));
    const name = btn.getAttribute("data-property-name") || "property";
    btn.setAttribute(
      "aria-label",
      saved ? "Remove " + name + " from saved properties" : "Save " + name + " to saved properties"
    );
  }

  function applyAllSaveStates() {
    $$(".save-btn").forEach((btn) => {
      applySaveState(btn, isSaved(btn.getAttribute("data-save-id")));
    });
  }

  // Event delegation for save/unsave clicks (works for static + rendered cards).
  document.addEventListener("click", (event) => {
    const btn = event.target && event.target.closest ? event.target.closest(".save-btn") : null;
    if (!btn) return;
    event.preventDefault();
    event.stopPropagation();
    const id = btn.getAttribute("data-save-id");
    if (!id) return;
    const nowSaved = toggleSaved(id);
    $$(".save-btn").forEach((b) => {
      if (b.getAttribute("data-save-id") === id) applySaveState(b, nowSaved);
    });
    renderSavedProperties();
  });

  /* -------------------------- Dashboard rendering ------------------------- */
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function createPropertyCard(p) {
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
      '<img src="' + escapeHtml(p.image) + '" alt="' + escapeHtml(p.imageAlt) + '" loading="lazy" width="400" height="200" />' +
      '<span class="badge badge-sample">Sample listing</span>' +
      '<span class="badge badge-type">' + escapeHtml(p.typeBadge) + "</span>" +
      '<button type="button" class="save-btn is-saved" data-save-id="' + escapeHtml(p.id) + '" data-property-name="' + escapeHtml(p.name) + '" aria-pressed="true" aria-label="Remove ' + escapeHtml(p.name) + ' from saved properties">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />' +
      "</svg>" +
      "</button>" +
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

    // Missing image fallback (mirrors script.js behaviour).
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

    return article;
  }

  function renderSavedProperties() {
    const grid = $("#savedPropertiesGrid");
    const empty = $("#savedEmptyState");
    if (!grid) return;

    const savedIds = getSavedIds();
    const savedProps = savedIds.map(getProperty).filter(Boolean);

    grid.innerHTML = "";

    if (savedProps.length === 0) {
      grid.hidden = true;
      if (empty) empty.hidden = false;
      return;
    }

    grid.hidden = false;
    if (empty) empty.hidden = true;

    savedProps.forEach((p) => {
      grid.appendChild(createPropertyCard(p));
    });

    applyAllSaveStates();
  }

  /* ------------------------------ Init ----------------------------------- */
  function init() {
    applyAllSaveStates();
    renderSavedProperties();

    // Keep multiple tabs in sync.
    window.addEventListener("storage", (event) => {
      if (event.key === STORAGE_KEY) {
        applyAllSaveStates();
        renderSavedProperties();
      }
    });

    // Footer year (in case page-specific scripts are absent).
    const yearEl = $("#year");
    if (yearEl && !yearEl.textContent) {
      yearEl.textContent = String(new Date().getFullYear());
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Expose for debugging / future integration.
  window.SmartRentalSaved = {
    SAMPLE_PROPERTIES: SAMPLE_PROPERTIES,
    getAllProperties: getAllProperties,
    getProperty: getProperty,
    getSavedIds: getSavedIds,
    isSaved: isSaved,
    saveProperty: saveProperty,
    unsaveProperty: unsaveProperty,
    toggleSaved: toggleSaved,
    renderSavedProperties: renderSavedProperties,
    applyAllSaveStates: applyAllSaveStates,
  };
})();
