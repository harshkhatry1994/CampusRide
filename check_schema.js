import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zfsikxquvusonixrbzvy.supabase.co',
  'sb_publishable_lWf2Jd352u2UPW_EGt-k3Q_M0rTC8lX'
);

async function main() {
  console.log('=== Checking tables ===');
  
  // Check rentals table structure
  const { data: rental, error: rentalErr } = await supabase.from('rentals').select('*').limit(1);
  console.log('rentals:', rental ? JSON.stringify(Object.keys(rental[0] || {})) : 'EMPTY', rentalErr?.message);
  
  // Check profiles
  const { data: profile, error: profileErr } = await supabase.from('profiles').select('*').limit(1);
  console.log('profiles:', profile ? JSON.stringify(Object.keys(profile[0] || {})) : 'EMPTY', profileErr?.message);
  
  // Check bikes
  const { data: bike, error: bikeErr } = await supabase.from('bikes').select('*').limit(1);
  console.log('bikes:', bike ? JSON.stringify(Object.keys(bike[0] || {})) : 'EMPTY', bikeErr?.message);
  
  // Check membership_requests
  const { data: mem, error: memErr } = await supabase.from('membership_requests').select('*').limit(1);
  console.log('membership_requests:', mem ? JSON.stringify(Object.keys(mem[0] || {})) : 'EMPTY', memErr?.message);
  
  // Try joined query - rentals with profiles
  console.log('\n=== Testing joins ===');
  const { data: joinTest, error: joinErr } = await supabase
    .from('rentals')
    .select('*, profiles!user_id(*)')
    .limit(1);
  console.log('rentals!profiles join:', joinErr?.message || 'OK', joinTest ? JSON.stringify(joinTest[0]) : null);

  // Try alternate join
  const { data: joinTest2, error: joinErr2 } = await supabase
    .from('rentals')
    .select('*, profiles(*)')
    .limit(1);
  console.log('rentals profiles join (no hint):', joinErr2?.message || 'OK');
  
  // Check if there's a foreign key from rentals to profiles
  const { data: joinTest3, error: joinErr3 } = await supabase
    .from('rentals')
    .select('*, user:profiles!rentals_user_id_fkey(*)')
    .limit(1);
  console.log('rentals fkey join:', joinErr3?.message || 'OK');

  // Check membership join
  const { data: memJoin, error: memJoinErr } = await supabase
    .from('membership_requests')
    .select('*, profiles!user_id(*)')
    .limit(1);
  console.log('membership!profiles join:', memJoinErr?.message || 'OK');
}

main().catch(console.error);
