
const express = require("express");
const supabase = require("./config/supabase");

const app = express();
const PORT = 3000;

app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Smart Rental backend is running!");
});

// API health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Smart Rental API is working",
  });
});

app.get("/api/properties", async (req, res) => {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "published");

  if (error) {
    console.error("Error fetching properties:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not fetch properties",
    });
  }

  res.json({
    success: true,
    count: data.length,
    properties: data,
  });
});


app.listen(PORT, () => {
  console.log(`Smart Rental server running at http://localhost:${PORT}`);
});
