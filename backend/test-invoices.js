import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = "sb_publishable_lWf2Jd352u2UPW_EGt-k3Q_M0rTC8lX";
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Inspecting 'invoices' table...");
  const { data: cols, error: colsErr } = await supabase.from('invoices').select('*').limit(1);
  console.log("Invoices sample row or keys:", cols?.[0] ? Object.keys(cols[0]) : "No rows found", "error:", colsErr);
}

run();
