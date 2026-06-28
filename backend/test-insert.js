import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = "sb_publishable_lWf2Jd352u2UPW_EGt-k3Q_M0rTC8lX";
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: users } = await supabase.from('profiles').select('id').limit(1);
  const { data: bikes } = await supabase.from('bikes').select('id').limit(1);

  console.log("Found User ID:", users?.[0]?.id);
  console.log("Found Bike ID:", bikes?.[0]?.id);

  if (!users?.[0] || !bikes?.[0]) {
    console.error("Please ensure there is at least one user in profiles and one bike in bikes.");
    return;
  }

  // Insert a test rental row
  const { data: rental, error: insertError } = await supabase.from('rentals').insert({
    bike_id: bikes[0].id,
    user_id: users[0].id,
    status: 'pending',
    start_date: new Date().toISOString(),
    end_date: new Date().toISOString(),
    total_price: 1500
  }).select().single();

  if (insertError) {
    console.error("Failed to insert test rental:", insertError);
    return;
  }

  console.log("Successfully inserted rental:", rental);

  // Now, try updating lifecycle_status
  console.log("\nAttempting to update lifecycle_status...");
  const { data: updateRes1, error: updateErr1 } = await supabase
    .from('rentals')
    .update({ lifecycle_status: 'confirmed' })
    .eq('id', rental.id)
    .select();
  console.log("Update lifecycle_status result:", updateRes1, "error:", updateErr1);

  // Attempt to update status
  console.log("\nAttempting to update status...");
  const { data: updateRes2, error: updateErr2 } = await supabase
    .from('rentals')
    .update({ status: 'confirmed' })
    .eq('id', rental.id)
    .select();
  console.log("Update status result:", updateRes2, "error:", updateErr2);

  // Delete the test rental
  await supabase.from('rentals').delete().eq('id', rental.id);
}

run();
