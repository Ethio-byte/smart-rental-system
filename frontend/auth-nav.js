(function () {
  "use strict";

  function init() {
    const supabase = window.supabaseClient;
    if (!supabase) return;

    const navActions = document.querySelector(".nav-actions");
    if (!navActions) return;

    async function getAccountType(user) {
      if (!user) return null;
      try {
        const { data, error } = await supabase
          .from("Profiles")
          .select("Account_type")
          .eq("id", user.id)
          .single();
        if (error || !data) return null;
        return String(data.Account_type).toLowerCase();
      } catch (error) {
        console.error("Profile lookup error:", error);
        return null;
      }
    }

    async function updateNav() {
      let user = null;
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        user = data && data.user ? data.user : null;
      } catch (error) {
        console.error("Auth check error:", error);
        user = null;
      }

      if (!user) {
        navActions.innerHTML =
          '<a class="btn btn-ghost" href="login.html">Login</a>' +
          '<a class="btn btn-primary" href="register.html">Register</a>';
        return;
      }

      const accountType = await getAccountType(user);
      const dashboardHref =
        accountType === "landlord"
          ? "landlord-dashboard.html"
          : "renter-dashboard.html";

      navActions.innerHTML =
        '<a class="btn btn-ghost" href="' +
        dashboardHref +
        '">Dashboard</a>' +
        '<button class="btn btn-primary" type="button" id="navLogoutBtn">Logout</button>';

      const logoutBtn = document.getElementById("navLogoutBtn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", async function () {
          try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            const primaryNav = document.getElementById("primaryNav");
            const navToggle = document.getElementById("navToggle");
            if (primaryNav && navToggle && window.matchMedia("(max-width: 860px)").matches) {
              primaryNav.classList.remove("is-open");
              navToggle.setAttribute("aria-expanded", "false");
              navToggle.setAttribute("aria-label", "Open navigation menu");
            }

            updateNav();
          } catch (error) {
            console.error("Logout error:", error);
            alert("Logout failed. Please try again.");
          }
        });
      }
    }

    updateNav();

    try {
      supabase.auth.onAuthStateChange(function () {
        updateNav();
      });
    } catch (error) {
      console.error("Auth state listener error:", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
