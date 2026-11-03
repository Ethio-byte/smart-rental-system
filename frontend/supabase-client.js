const SUPABASE_URL = "https://yqhbghoxtslymnydbvec.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_9kQ5PeMnvhr-ds12eDneiQ_ImVi1zO7";


window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);