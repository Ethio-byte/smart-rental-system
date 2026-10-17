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

  function filterProperties() {
    if (!propertyGrid) return;

    const location = normalise(locationSelect ? locationSelect.value : "");
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
      const cardLocation = normalise(card.dataset.location);
      const cardType = normalise(card.dataset.type);
      const cardPrice = Number(card.dataset.price);

      const matchesLocation =
        !location || cardLocation === location || cardLocation.includes(location);
      const matchesType = !type || cardType === type;
      const matchesMaxRent = maxRent === null || cardPrice <= maxRent;

      const show = matchesLocation && matchesType && matchesMaxRent;
      card.classList.toggle("is-hidden", !show);
      if (show) visibleCount += 1;
    });

    const hasFilters = Boolean(location || type || maxRent !== null);

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
    [locationSelect, typeSelect, maxRentInput].forEach((el) => {
      if (el) el.removeAttribute("aria-invalid");
    });
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
  }

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      resetFilters();
    });
  }

  // Initial state: no filters active, so show every card.
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
