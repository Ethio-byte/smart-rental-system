
(async function protectDashboard() {
  const supabase = window.supabaseClient;

  if (!supabase) {
    console.error("Supabase client is not initialized.");
    window.location.href = "login.html";
    return;
  }

  const currentPage = window.location.pathname;
  const requiredRole = currentPage.endsWith("landlord-dashboard.html")
    ? "landlord"
    : "renter";

  try {
    // Check whether a user is logged in
    const { data: { user }, error: authError } =
      await supabase.auth.getUser();

    if (authError || !user) {
      window.location.href = "login.html";
      return;
    }

    // Get the user's account type from their database profile
    const { data: profile, error: profileError } = await supabase
      .from("Profiles")
      .select("Account_type")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Could not load user profile:", profileError);
      alert("Unable to verify your account. Please log in again.");
      await supabase.auth.signOut();
      window.location.href = "login.html";
      return;
    }

    const actualRole = String(profile.Account_type).toLowerCase();

    // Prevent access to the wrong dashboard
    if (actualRole !== requiredRole) {
      window.location.href =
        actualRole === "landlord"
          ? "landlord-dashboard.html"
          : "renter-dashboard.html";
      return;
    }

    console.log("Dashboard access verified:", actualRole);
     document.documentElement.classList.remove("auth-pending");
  } catch (error) {
    console.error("Dashboard authentication error:", error);
    alert("Unable to verify your login. Please try again.");
    await supabase.auth.signOut();
    window.location.href = "login.html";
  }
})();

// Shared logout function for both dashboards
window.logoutUser = async function () {
  try {
    const { error } = await window.supabaseClient.auth.signOut();

    if (error) {
      throw error;
    }

    window.location.href = "login.html";
  } catch (error) {
    console.error("Logout error:", error);
    alert("Logout failed. Please try again.");
  }
};
