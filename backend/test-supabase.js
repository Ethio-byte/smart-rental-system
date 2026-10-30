
const supabase = require("./config/supabase");

async function testConnection() {
  const { data, error } = await supabase
    .from("properties")
    .select("id")
    .limit(1);

  if (error) {
    console.error("Supabase test failed:", error.message);
    return;
  }

  console.log("Supabase connection successful!");
  console.log("Properties returned:", data.length);
}

testConnection();
