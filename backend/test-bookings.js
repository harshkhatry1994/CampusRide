import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = "sb_publishable_lWf2Jd352u2UPW_EGt-k3Q_M0rTC8lX";
const supabase = createClient(supabaseUrl, supabaseKey);

async function testColumn(table, column) {
  const { error } = await supabase.from(table).select(column).limit(1);
  if (error && error.message.includes('does not exist')) {
    return false;
  }
  return true;
}

async function run() {
  const tables = ['bookings', 'rideshare_bookings', 'rentals'];
  for (const t of tables) {
    console.log(`\nInspecting ${t}:`);
    const cols = ['id', 'status', 'lifecycle_status'];
    for (const c of cols) {
      const exists = await testColumn(t, c);
      console.log(`  - Column '${c}': ${exists ? '✅ Exists' : '❌ Missing'}`);
    }
  }
}

run();
