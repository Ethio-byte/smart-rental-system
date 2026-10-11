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

  /* ---------------------------- Property search ---------------------------- */
  const searchForm = $("#heroSearch");
  const propertyGrid = $("#propertyGrid");
  const filterStatus = $("#filterStatus");
  const noResults = $("#noResults");
  const propertySection = $("#properties");

  function filterProperties() {
    if (!propertyGrid) return;

    const location = $("#location").value;
    const type = $("#type").value;
    const price = $("#price").value;

    let visibleCount = 0;
    const cards = $$(".property-card", propertyGrid);

    cards.forEach((card) => {
      const matchesLocation = !location || card.dataset.location === location;
      const matchesType = !type || card.dataset.type === type;

      let matchesPrice = true;
      if (price) {
        const [min, max] = price.split("-").map(Number);
        const value = Number(card.dataset.price);
        matchesPrice = value >= min && value <= max;
      }

      const show = matchesLocation && matchesType && matchesPrice;
      card.classList.toggle("is-hidden", !show);
      if (show) visibleCount += 1;
    });

    if (noResults) noResults.hidden = visibleCount !== 0;

    if (filterStatus) {
      const hasFilters = Boolean(location || type || price);
      if (hasFilters) {
        filterStatus.hidden = false;
        filterStatus.textContent =
          visibleCount === 1
            ? "1 listing matches your search."
            : visibleCount + " listings match your search.";
      } else {
        filterStatus.hidden = true;
      }
    }
  }

  if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      filterProperties();
      if (propertySection) {
        propertySection.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
          block: "start",
        });
      }
    });

    // Live filtering as the user adjusts selects
    $$("select", searchForm).forEach((select) => {
      select.addEventListener("change", filterProperties);
    });
  }

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
