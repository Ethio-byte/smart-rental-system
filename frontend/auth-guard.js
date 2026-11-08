
(async function protectDashboard() {
  const supabase = window.supabaseClient;

  async function ensureAuth() {
    // Hide protected content until the current session is validated.
    document.documentElement.classList.add("auth-pending");

    if (!supabase) {
      console.error("Supabase client is not initialized.");
      window.location.replace("login.html");
      return false;
    }

    const currentPage = window.location.pathname;
    const requiredRole = currentPage.endsWith("landlord-dashboard.html")
      ? "landlord"
      : "renter";

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        window.location.replace("login.html");
        return false;
      }

      const { data: profile, error: profileError } = await supabase
        .from("Profiles")
        .select("Account_type")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        console.error("Could not load user profile:", profileError);
        alert("Unable to verify your account. Please log in again.");
        await supabase.auth.signOut();
        window.location.replace("login.html");
        return false;
      }

      const actualRole = String(profile.Account_type).toLowerCase();

      if (actualRole !== requiredRole) {
        window.location.replace(
          actualRole === "landlord"
            ? "landlord-dashboard.html"
            : "renter-dashboard.html"
        );
        return false;
      }

      console.log("Dashboard access verified:", actualRole);
      document.documentElement.classList.remove("auth-pending");
      return true;
    } catch (error) {
      console.error("Dashboard authentication error:", error);
      alert("Unable to verify your login. Please try again.");
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error("Sign out error:", signOutError);
      }
      window.location.replace("login.html");
      return false;
    }
  }

  // Initial authentication check.
  await ensureAuth();

  // Recheck when a cached page is restored from the back/forward cache.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      ensureAuth();
    }
  });

  // Recheck when the tab becomes visible again.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      ensureAuth();
    }
  });
})();

// Shared logout function for both dashboards
window.logoutUser = async function () {
  try {
    const { error } = await window.supabaseClient.auth.signOut();

    if (error) {
      throw error;
    }

    window.location.replace("login.html");
  } catch (error) {
    console.error("Logout error:", error);
    alert("Logout failed. Please try again.");
  }
};
