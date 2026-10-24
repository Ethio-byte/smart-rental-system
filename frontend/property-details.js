/* ==========================================================================
   Smart Rental — Property Details Page (frontend-only)
   - Loads property data by ID from URL query parameter
   - Photo gallery with main image and thumbnails
   - Save/unsave using existing smartrental.savedProperties localStorage key
   - Handles missing/invalid IDs gracefully
   ========================================================================== */
(function () {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  /* ---------------------------- Property Data ----------------------------- */
  // Extended property data with details for the details page.
  // Reuses IDs and base data from renter.js PROPERTIES array.
  const PROPERTY_DETAILS = {
    "bole-deluxe-studio": {
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
      // Extended details
      description: "A bright, modern studio apartment in the heart of Bole, Addis Ababa. This fully furnished unit features an open-plan living area with large windows bringing in abundant natural light, a well-equipped kitchenette with modern appliances, and a private bathroom with shower. The space is designed for comfortable urban living with quality finishes throughout. Located just minutes from Bole Medhane Alem, Edna Mall, and numerous restaurants and cafes. Easy access to public transport and the airport. Water and electricity included in rent. Building has 24-hour security and backup generator.",
      bedrooms: 0,
      bathrooms: 1,
      furnishing: "Furnished",
      amenities: [
        "24-hour security",
        "Backup generator",
        "Water included",
        "Electricity included",
        "High-speed internet ready",
        "Air conditioning",
        "Balcony",
        "Parking available",
        "Elevator access",
        "CCTV surveillance"
      ],
      photos: [
        { src: "assets/properties/bole-studio.jpg", alt: "Modern studio apartment interior in Bole, Addis Ababa with natural light and contemporary furnishings" }
      ],
      landlord: {
        name: "Alemayehu Tadesse",
        phone: "+251 911 22 33 44",
        email: "alemayehu.t@example.com"
      }
    },
    "dire-dawa-family-house": {
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
      description: "A spacious standalone family house in the quiet Sabian area of Dire Dawa. This property offers three generous bedrooms, two full bathrooms, a large living room, separate dining area, and a fully fitted kitchen. The compound includes a private garden, covered parking for two vehicles, and a guest toilet. Recently painted throughout with tiled floors and modern fixtures. Close to Dire Dawa University, Sabian Market, and main road access. Reliable water supply with storage tank. Ideal for families or professionals seeking space and privacy.",
      bedrooms: 3,
      bathrooms: 2,
      furnishing: "Unfurnished",
      amenities: [
        "Private garden",
        "Covered parking (2 cars)",
        "Water storage tank",
        "Guest toilet",
        "Tiled floors throughout",
        "Modern kitchen cabinets",
        "Separate dining area",
        "Compound wall with gate",
        "Close to university and market",
        "Quiet residential area"
      ],
      photos: [
        { src: "assets/properties/dire-house.jpg", alt: "Spacious family house exterior in Sabian, Dire Dawa with garden and parking area" }
      ],
      landlord: {
        name: "Fatima Mohammed",
        phone: "+251 922 55 66 77",
        email: "fatima.m@example.com"
      }
    },
    "hawassa-lakeview-room": {
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
      description: "A clean, well-lit single room in a managed boarding house in Tabor, Hawassa — within walking distance of Lake Hawassa. The room includes a bed, wardrobe, desk, and chair. Residents share a modern kitchen, dining area, and clean bathrooms. Water is included in the monthly rent. The compound has a common sitting area with lake views, laundry lines, and 24-hour caretaker. Close to Hawassa University, Hawassa Industrial Park, and local transport. Suitable for students or young professionals. Monthly cleaning of common areas included.",
      bedrooms: 0,
      bathrooms: 0,
      furnishing: "Furnished",
      amenities: [
        "Shared modern kitchen",
        "Shared clean bathrooms",
        "Water included",
        "Lake views from common area",
        "24-hour caretaker",
        "Laundry lines",
        "Common sitting area",
        "Monthly common-area cleaning",
        "Walking distance to Lake Hawassa",
        "Close to university and industrial park"
      ],
      photos: [
        { src: "assets/properties/hawassa-room.jpg", alt: "Bright single room in Tabor, Hawassa with natural light, shared kitchen access, and lake area views" }
      ],
      landlord: {
        name: "Mesfin Gebre",
        phone: "+251 933 88 99 00",
        email: "mesfin.g@example.com"
      }
    }
  };

  const STORAGE_KEY = "smartrental.savedProperties";

  /* ---------------------------- Utility Functions -------------------------- */
function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatPrice(amount) {
    return "ETB " + Number(amount).toLocaleString();
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

  function applySaveState(btn, saved) {
    btn.classList.toggle("is-saved", saved);
    btn.setAttribute("aria-pressed", String(saved));
    const name = btn.getAttribute("data-property-name") || "property";
    btn.setAttribute(
      "aria-label",
      saved ? "Remove " + name + " from saved properties" : "Save " + name + " to saved properties"
    );
    const textEl = btn.querySelector(".save-btn-text");
    if (textEl) {
      textEl.textContent = saved ? "Saved" : "Save";
    }
  }

  /* ---------------------------- Gallery Functions -------------------------- */
  let currentImageIndex = 0;
  let propertyPhotos = [];

  function initGallery(photos) {
    propertyPhotos = photos || [];
    currentImageIndex = 0;

    const mainImage = $("#mainImage");
    const galleryMain = $("#galleryMain");
    const galleryPrev = $("#galleryPrev");
    const galleryNext = $("#galleryNext");
    const galleryThumbs = $("#galleryThumbs");
    const thumbsTrack = $("#thumbsTrack");

    if (!mainImage || propertyPhotos.length === 0) return;

    // Set main image
    mainImage.src = propertyPhotos[0].src;
    mainImage.alt = propertyPhotos[0].alt;

    // Show/hide nav buttons based on photo count
    const hasMultiple = propertyPhotos.length > 1;
    if (galleryPrev) galleryPrev.hidden = !hasMultiple;
    if (galleryNext) galleryNext.hidden = !hasMultiple;

    // Render thumbnails
    if (thumbsTrack && hasMultiple) {
      thumbsTrack.innerHTML = "";
      propertyPhotos.forEach((photo, index) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "thumb-btn" + (index === 0 ? " is-active" : "");
        btn.setAttribute("aria-label", "View photo " + (index + 1) + " of " + propertyPhotos.length);
        btn.setAttribute("aria-selected", index === 0 ? "true" : "false");
        btn.dataset.index = index;

        const img = document.createElement("img");
        img.src = photo.src;
        img.alt = "";
        img.loading = "lazy";
        img.width = 80;
        img.height = 60;

        btn.appendChild(img);
        thumbsTrack.appendChild(btn);

        btn.addEventListener("click", () => {
          showImage(index);
        });

        btn.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            showImage(index);
          }
        });
      });
      if (galleryThumbs) galleryThumbs.hidden = false;
    } else if (galleryThumbs) {
      galleryThumbs.hidden = true;
    }

    // Attach nav button listeners
    if (galleryPrev) {
      galleryPrev.onclick = () => navigateGallery(-1);
    }
    if (galleryNext) {
      galleryNext.onclick = () => navigateGallery(1);
    }

    // Keyboard navigation for main gallery
    if (galleryMain) {
      galleryMain.onkeydown = (e) => {
        if (e.key === "ArrowLeft") navigateGallery(-1);
        else if (e.key === "ArrowRight") navigateGallery(1);
      };
    }

    // Handle main image load error
    mainImage.onerror = () => {
      mainImage.hidden = true;
      if (!galleryMain.querySelector(".media-fallback")) {
        const fallback = document.createElement("span");
        fallback.className = "media-fallback";
        fallback.textContent = "Image unavailable";
        galleryMain.appendChild(fallback);
      }
    };
  }

  function showImage(index) {
    if (index < 0 || index >= propertyPhotos.length) return;

    currentImageIndex = index;
    const mainImage = $("#mainImage");
    if (!mainImage) return;

    mainImage.src = propertyPhotos[index].src;
    mainImage.alt = propertyPhotos[index].alt;

    // Update thumbnail active state
    $$(".thumb-btn", $("#thumbsTrack")).forEach((btn, i) => {
      const active = i === index;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    });
  }

  function navigateGallery(direction) {
    if (propertyPhotos.length <= 1) return;
    const newIndex = (currentImageIndex + direction + propertyPhotos.length) % propertyPhotos.length;
    showImage(newIndex);
  }

  /* ---------------------------- Render Functions --------------------------- */
  function renderProperty(property) {
    // Update page title and breadcrumb
    document.title = property.name + " — Smart Rental";
    const breadcrumbCurrent = $("#breadcrumbCurrent");
    if (breadcrumbCurrent) breadcrumbCurrent.textContent = property.name;

    // Update property header
    const typeBadge = $("#typeBadge");
    if (typeBadge) {
      typeBadge.textContent = property.typeBadge;
    }

    const propertyTitle = $("#propertyTitle");
    if (propertyTitle) propertyTitle.textContent = property.name;

    const locationText = $("#locationText");
    if (locationText) locationText.textContent = property.location;

    const propertyPrice = $("#propertyPrice");
    if (propertyPrice) propertyPrice.textContent = property.priceText + " / month";

    // Save button
    const saveBtn = $("#saveBtn");
    if (saveBtn) {
      saveBtn.setAttribute("data-save-id", property.id);
      saveBtn.setAttribute("data-property-name", property.name);
      applySaveState(saveBtn, isSaved(property.id));
    }

    // Key facts
    const factsList = $("#propertyFacts");
    if (factsList) {
      const facts = [];
      if (property.type) facts.push({ label: "Property type", value: property.type });
      if (property.city) facts.push({ label: "City", value: property.city });
      if (property.subCity) facts.push({ label: "Sub-city", value: property.subCity });
      if (property.area) facts.push({ label: "Area", value: property.area });
      if (typeof property.bedrooms === "number" && property.bedrooms > 0) {
        facts.push({ label: "Bedrooms", value: String(property.bedrooms) });
      } else if (property.type === "Studio Apartment" || property.type === "Single Room" || property.type === "Shared Room") {
        facts.push({ label: "Bedrooms", value: "Studio / Single" });
      }
      if (typeof property.bathrooms === "number" && property.bathrooms > 0) {
        facts.push({ label: "Bathrooms", value: String(property.bathrooms) });
      } else if (property.meta.some(m => m.toLowerCase().includes("shared"))) {
        facts.push({ label: "Bathrooms", value: "Shared" });
      }
      if (property.furnishing) facts.push({ label: "Furnishing", value: property.furnishing });

      factsList.innerHTML = facts.map((fact) =>
        '<li><span class="fact-label">' + escapeHtml(fact.label) + '</span><span class="fact-value">' + escapeHtml(fact.value) + "</span></li>"
      ).join("");
    }

    // Description
    const descSection = $("#descriptionSection");
    const descText = $("#propertyDescription");
    if (property.description) {
      if (descText) descText.textContent = property.description;
      if (descSection) descSection.hidden = false;
    } else if (descSection) {
      descSection.hidden = true;
    }

    // Amenities
    const amenitiesSection = $("#amenitiesSection");
    const amenitiesList = $("#amenitiesList");
    if (property.amenities && property.amenities.length > 0) {
      if (amenitiesList) {
        amenitiesList.innerHTML = property.amenities.map((a) =>
          '<li><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg><span>' + escapeHtml(a) + "</span></li>"
        ).join("");
      }
      if (amenitiesSection) amenitiesSection.hidden = false;
    } else if (amenitiesSection) {
      amenitiesSection.hidden = true;
    }

    // Landlord contact
    const contactSection = $("#contactSection");
    const landlordName = $("#landlordName");
    const contactMethods = $("#contactMethods");
    if (property.landlord && (property.landlord.phone || property.landlord.email)) {
      if (landlordName) landlordName.textContent = property.landlord.name || "Property Owner";
      if (contactMethods) {
        const methods = [];
        if (property.landlord.phone) {
          methods.push(
            '<a class="contact-method" href="tel:' + escapeHtml(property.landlord.phone.replace(/\s/g, "")) + '">' +
            '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" /></svg>' +
            '<span>' + escapeHtml(property.landlord.phone) + "</span></a>"
          );
        }
        if (property.landlord.email) {
          methods.push(
            '<a class="contact-method" href="mailto:' + escapeHtml(property.landlord.email) + '">' +
            '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>' +
            '<span>' + escapeHtml(property.landlord.email) + "</span></a>"
          );
        }
        contactMethods.innerHTML = methods.join("");
      }
      if (contactSection) contactSection.hidden = false;
    } else if (contactSection) {
      contactSection.hidden = true;
    }

    // Initialize gallery
    initGallery(property.photos);
  }

  function showLoading() {
    $("#loadingState").hidden = false;
    $("#errorState").hidden = true;
    $("#propertyContent").hidden = true;
  }

  function showError(message, title) {
    $("#loadingState").hidden = true;
    $("#propertyContent").hidden = true;
    $("#errorState").hidden = false;
    const errorTitle = $("#errorTitle");
    const errorMessage = $("#errorMessage");
    if (errorTitle) errorTitle.textContent = title || "Property not found";
    if (errorMessage) errorMessage.textContent = message || "The property you're looking for doesn't exist or has been removed.";
  }

  function showContent() {
    $("#loadingState").hidden = true;
    $("#errorState").hidden = true;
    $("#propertyContent").hidden = false;
  }

  /* ---------------------------- Save Button Handler ------------------------ */
  function setupSaveButton() {
    const saveBtn = $("#saveBtn");
    if (!saveBtn) return;

    saveBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = saveBtn.getAttribute("data-save-id");
      if (!id) return;
      const nowSaved = toggleSaved(id);
      applySaveState(saveBtn, nowSaved);

      // Also update any save buttons on other pages (via storage event in renter.js)
      // Dispatch a custom event for same-page sync
      window.dispatchEvent(new CustomEvent("smartrental:save-changed", { detail: { id, saved: nowSaved } }));
    });
  }

  /* ---------------------------- Init --------------------------------------- */
  function init() {
    showLoading();

    // Get property ID from URL
    const params = new URLSearchParams(window.location.search);
    const propertyId = params.get("id");

    if (!propertyId) {
      showError("No property ID provided. Please select a property from the listings.", "Missing Property ID");
      return;
    }

    const property = PROPERTY_DETAILS[propertyId];
    if (!property) {
      showError("No property found with ID '" + escapeHtml(propertyId) + "'. It may have been removed or the link is incorrect.", "Property Not Found");
      return;
    }

    renderProperty(property);
    setupSaveButton();
    showContent();

    // Sync save state across tabs
    window.addEventListener("storage", (event) => {
      if (event.key === STORAGE_KEY) {
        const saveBtn = $("#saveBtn");
        if (saveBtn) {
          const id = saveBtn.getAttribute("data-save-id");
          if (id) applySaveState(saveBtn, isSaved(id));
        }
      }
    });

    // Also listen for custom event from same-tab clicks on other save buttons
    window.addEventListener("smartrental:save-changed", (event) => {
      const saveBtn = $("#saveBtn");
      if (saveBtn) {
        const id = saveBtn.getAttribute("data-save-id");
        if (id && event.detail.id === id) {
          applySaveState(saveBtn, event.detail.saved);
        }
      }
    });

    // Footer year
    const yearEl = $("#year");
    if (yearEl && !yearEl.textContent) {
      yearEl.textContent = String(new Date().getFullYear());
    }

    // Initialize navbar (from script.js)
    // script.js already handles this, but ensure it runs
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();