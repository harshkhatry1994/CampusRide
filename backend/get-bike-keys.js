import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = "sb_publishable_lWf2Jd352u2UPW_EGt-k3Q_M0rTC8lX";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('bikes').select('*').limit(1);
  if (error) {
    console.log("❌ Error:", error.message);
  } else {
    console.log("✅ Bikes:", data);
  }
}
run();
