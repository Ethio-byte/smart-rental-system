/* ==========================================================================
   Smart Rental — Renter dashboard & saved properties
   - Saved properties are persisted per authenticated renter in Supabase.
   - Non-database (sample/landlord) listings keep browser-local fallback.
   ========================================================================== */
(function () {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  /* ---------------------------- Property data ----------------------------- */
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

  const supabase = window.supabaseClient || null;

  /* ------------------------ Landlord property adapter ---------------------- */
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

    let typeBadge = lp.type || "Property";
    if (typeBadge === "Studio Apartment") typeBadge = "Studio";
    else if (typeBadge === "Single Room" || typeBadge === "Shared Room") typeBadge = "Boarding";
    else if (typeBadge === "Boarding house") typeBadge = "Boarding";

    const cityKey = (city || "").toLowerCase().replace(/\s+/g, "-");
    const mediaClass = "media-" + cityKey || "media-default";

    let image = "assets/properties/placeholder.jpg";
    let imageAlt = "Property image";
    if (lp.photos && lp.photos.length > 0) {
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
      _landlord: true,
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
    const sample = SAMPLE_PROPERTIES.find((p) => p.id === id);
    if (sample) return sample;
    const landlordRaw = getLandlordProperties().find((p) => p.id === id);
    if (landlordRaw) return adaptLandlordProperty(landlordRaw);
    return null;
  }

  function adaptDatabaseProperty(property) {
    if (!property) return null;
    const city = property.city || "";
    const area = property.area || "";
    const type = property.property_type || "Property";

    let image = "assets/properties/bole-studio.jpg";
    if (city === "Dire Dawa") {
      image = "assets/properties/dire-house.jpg";
    } else if (city === "Hawassa") {
      image = "assets/properties/hawassa-room.jpg";
    }

    const cityKey = (city || "").toLowerCase().replace(/\s+/g, "-");
    const mediaClass = "media-" + (cityKey || "default");

    const meta = [];
    if (type) meta.push(type);
    if (Number(property.bedrooms) > 0) {
      meta.push(Number(property.bedrooms) + " Bedroom" + (Number(property.bedrooms) > 1 ? "s" : ""));
    } else if (type === "Studio Apartment" || type === "Single Room" || type === "Shared Room" || type === "Studio") {
      meta.push("Studio / Single");
    }
    if (Number(property.bathrooms) > 0) {
      meta.push(Number(property.bathrooms) + " bath" + (Number(property.bathrooms) > 1 ? "s" : ""));
    }
    if (property.furnishing) meta.push(property.furnishing);

    return {
      id: property.id,
      name: property.title || "Untitled Property",
      city: city,
      subCity: "",
      area: area,
      location: [city, area].filter(Boolean).join(", "),
      type: type,
      typeBadge: type,
      price: Number(property.rent || 0),
      priceText: "ETB " + Number(property.rent || 0).toLocaleString(),
      meta: meta,
      image: image,
      imageAlt: "Property in " + (city || "Ethiopia"),
      mediaClass: mediaClass,
      _database: true,
      _original: property,
    };
  }

  /* ---------------------------- Saved property IDs ------------------------ */
  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
  }

  function getLocalSavedIds() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
    } catch (e) {
      return [];
    }
  }

  function setLocalSavedIds(ids) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch (e) {
      /* ignore quota / private mode errors */
    }
  }

  async function getCurrentUser() {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data || !data.user) return null;
      return data.user;
    } catch (e) {
      return null;
    }
  }

  async function getDbSavedIds() {
    const user = await getCurrentUser();
    if (!user || !supabase) return [];
    try {
      const { data, error } = await supabase
        .from("saved_properties")
        .select("property_id")
        .eq("user_id", user.id);
      if (error) {
        console.error("Could not load saved properties:", error.message);
        return [];
      }
      return (data || [])
        .map((row) => row.property_id)
        .filter((id) => typeof id === "string");
    } catch (e) {
      console.error("Could not load saved properties:", e);
      return [];
    }
  }

  async function getSavedIds() {
    const dbIds = await getDbSavedIds();
    const localIds = getLocalSavedIds().filter((id) => !isUuid(id));
    return [...new Set([...dbIds, ...localIds])];
  }

  async function isSaved(id) {
    const ids = await getSavedIds();
    return ids.indexOf(id) !== -1;
  }

  async function saveProperty(id) {
    if (!id) return false;

    if (!isUuid(id)) {
      const ids = getLocalSavedIds().filter((x) => !isUuid(x));
      if (ids.indexOf(id) === -1) ids.push(id);
      setLocalSavedIds(ids);
      return true;
    }

    const user = await getCurrentUser();
    if (!user || !supabase) return false;

    try {
      const { data: property, error: propertyError } = await supabase
        .from("properties")
        .select("id")
        .eq("id", id)
        .maybeSingle();

      if (propertyError || !property) {
        console.error("Cannot save unknown property:", propertyError || id);
        return false;
      }

      const { data: existing, error: existingError } = await supabase
        .from("saved_properties")
        .select("id")
        .eq("user_id", user.id)
        .eq("property_id", id)
        .maybeSingle();

      if (existingError) {
        console.error("Could not check saved property:", existingError.message);
        return false;
      }

      if (existing) return true;

      const { error: insertError } = await supabase
        .from("saved_properties")
        .insert({ user_id: user.id, property_id: id });

      if (insertError) {
        console.error("Could not save property:", insertError.message);
        return false;
      }

      setLocalSavedIds(getLocalSavedIds().filter((x) => x !== id));
      return true;
    } catch (e) {
      console.error("Could not save property:", e);
      return false;
    }
  }

  async function unsaveProperty(id) {
    if (!id) return;

    setLocalSavedIds(getLocalSavedIds().filter((x) => x !== id));

    if (!isUuid(id)) return;

    const user = await getCurrentUser();
    if (!user || !supabase) return;

    try {
      const { error } = await supabase
        .from("saved_properties")
        .delete()
        .eq("user_id", user.id)
        .eq("property_id", id);

      if (error) {
        console.error("Could not remove saved property:", error.message);
      }
    } catch (e) {
      console.error("Could not remove saved property:", e);
    }
  }

  async function toggleSaved(id) {
    if (await isSaved(id)) {
      await unsaveProperty(id);
      return false;
    }
    const saved = await saveProperty(id);
    return saved;
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

  async function applyAllSaveStates() {
    let ids = [];
    try {
      ids = await getSavedIds();
    } catch (e) {
      ids = [];
    }
    const savedSet = new Set(ids);
    $$(".save-btn").forEach((btn) => {
      applySaveState(btn, savedSet.has(btn.getAttribute("data-save-id")));
    });
  }

  document.addEventListener("click", async (event) => {
    const btn = event.target && event.target.closest ? event.target.closest(".save-btn") : null;
    if (!btn) return;
    event.preventDefault();
    event.stopPropagation();

    const id = btn.getAttribute("data-save-id");
    if (!id) return;

    btn.disabled = true;
    try {
      const nowSaved = await toggleSaved(id);
      const actuallySaved = await isSaved(id);
      $$(".save-btn").forEach((b) => {
        if (b.getAttribute("data-save-id") === id) applySaveState(b, actuallySaved);
      });
      if (nowSaved !== actuallySaved) {
        // Keep UI consistent with the database state.
      }
      await renderSavedProperties();
    } catch (e) {
      console.error("Could not update saved property:", e);
    } finally {
      btn.disabled = false;
    }
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

  async function renderSavedProperties() {
    const grid = $("#savedPropertiesGrid");
    const empty = $("#savedEmptyState");
    if (!grid) return;

    grid.innerHTML = "";
    grid.hidden = true;
    if (empty) {
      empty.hidden = false;
      const heading = empty.querySelector("h3");
      const text = empty.querySelector("p");
      const link = empty.querySelector("a");
      if (heading) heading.textContent = "Loading saved properties…";
      if (text) text.textContent = "Please wait while we fetch your saved listings.";
      if (link) link.hidden = true;
    }

    try {
      const savedIds = await getSavedIds();

      const dbIds = savedIds.filter(isUuid);
      let dbProps = [];
      if (dbIds.length > 0 && supabase) {
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .in("id", dbIds);

        if (error) throw error;
        dbProps = (data || []).map(adaptDatabaseProperty).filter(Boolean);
      }

      const localProps = savedIds
        .filter((id) => !isUuid(id))
        .map(getProperty)
        .filter(Boolean);

      const propertyMap = new Map();
      dbProps.forEach((p) => propertyMap.set(p.id, p));
      localProps.forEach((p) => propertyMap.set(p.id, p));

      const savedProps = savedIds.map((id) => propertyMap.get(id)).filter(Boolean);

      grid.innerHTML = "";

      if (savedProps.length === 0) {
        grid.hidden = true;
        if (empty) {
          empty.hidden = false;
          const heading = empty.querySelector("h3");
          const text = empty.querySelector("p");
          const link = empty.querySelector("a");
          if (heading) heading.textContent = "No saved properties yet";
          if (text) text.textContent = "You have not saved any properties. Browse the available listings and use the heart button on a property card to bookmark it. Your saved listings will appear here.";
          if (link) link.hidden = false;
        }
        await applyAllSaveStates();
        return;
      }

      grid.hidden = false;
      if (empty) empty.hidden = true;

      savedProps.forEach((p) => {
        grid.appendChild(createPropertyCard(p));
      });

      await applyAllSaveStates();
    } catch (error) {
      console.error("Could not render saved properties:", error);
      grid.innerHTML = "";
      grid.hidden = true;
      if (empty) {
        empty.hidden = false;
        const heading = empty.querySelector("h3");
        const text = empty.querySelector("p");
        const link = empty.querySelector("a");
        if (heading) heading.textContent = "Could not load saved properties";
        if (text) text.textContent = "Please try again later.";
        if (link) link.hidden = true;
      }
    }
  }

  /* ------------------------------ Init ----------------------------------- */
  async function init() {
    await applyAllSaveStates();
    await renderSavedProperties();

    window.addEventListener("storage", (event) => {
      if (event.key === STORAGE_KEY) {
        applyAllSaveStates();
        renderSavedProperties();
      }
    });

    const yearEl = $("#year");
    if (yearEl && !yearEl.textContent) {
      yearEl.textContent = String(new Date().getFullYear());
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      init();
    });
  } else {
    init();
  }

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
    adaptDatabaseProperty: adaptDatabaseProperty,
  };
})();
