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

async function inspectTable(table, columns) {
  console.log(`\nInspecting Table: ${table}`);
  for (const col of columns) {
    const exists = await testColumn(table, col);
    console.log(`  - Column '${col}': ${exists ? '✅ Exists' : '❌ Missing'}`);
  }
}

async function run() {
  await inspectTable('profiles', [
    'id', 'email', 'full_name', 'avatar_url', 'phone', 'role', 'college', 'created_at'
  ]);
  
  await inspectTable('bikes', [
    'id', 'bike_name', 'brand', 'model', 'registration_number', 'status', 
    'rent_per_hour', 'rent_per_day', 'image_url', 'security_deposit', 'category', 'created_at'
  ]);
  
  await inspectTable('rentals', [
    'id', 'bike_id', 'user_id', 'start_date', 'end_date', 'status', 'created_at',
    'total_price', 'driving_license_url', 'id_proof_url', 'selfie_url', 'phone', 'address'
  ]);
}

run();
