import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zfsikxquvusonixrbzvy.supabase.co',
  'sb_publishable_lWf2Jd352u2UPW_EGt-k3Q_M0rTC8lX'
);

async function main() {
  console.log('=== Checking tables ===');
  
  const { data: rental, error: rentalErr } = await supabase.from('rentals').select('*').limit(1);
  console.log('rentals cols:', rental && rental[0] ? JSON.stringify(Object.keys(rental[0])) : 'EMPTY/NO DATA', 'err:', rentalErr?.message);
  
  const { data: profile, error: profileErr } = await supabase.from('profiles').select('*').limit(1);
  console.log('profiles cols:', profile && profile[0] ? JSON.stringify(Object.keys(profile[0])) : 'EMPTY/NO DATA', 'err:', profileErr?.message);
  
  const { data: bike, error: bikeErr } = await supabase.from('bikes').select('*').limit(1);
  console.log('bikes cols:', bike && bike[0] ? JSON.stringify(Object.keys(bike[0])) : 'EMPTY/NO DATA', 'err:', bikeErr?.message);
  
  const { data: mem, error: memErr } = await supabase.from('membership_requests').select('*').limit(1);
  console.log('membership_requests cols:', mem && mem[0] ? JSON.stringify(Object.keys(mem[0])) : 'EMPTY/NO DATA', 'err:', memErr?.message);
  
  console.log('\n=== Testing rentals join with profiles ===');
  const { data: j1, error: e1 } = await supabase.from('rentals').select('id, user_id, profiles!user_id(id, full_name, email)').limit(1);
  console.log('!user_id hint:', e1?.message || 'OK', j1 ? JSON.stringify(j1[0]) : null);
  
  const { data: j2, error: e2 } = await supabase.from('rentals').select('id, user_id, profiles(id, full_name, email)').limit(1);
  console.log('no hint:', e2?.message || 'OK');

  const { data: j3, error: e3 } = await supabase.from('rentals').select('id, user_id, bikes!bike_id(id, bike_name, brand)').limit(1);
  console.log('bikes !bike_id hint:', e3?.message || 'OK');

  const { data: j4, error: e4 } = await supabase.from('membership_requests').select('*, profiles!user_id(id, full_name, email)').limit(1);
  console.log('membership !user_id:', e4?.message || 'OK');

  const { data: j5, error: e5 } = await supabase.from('membership_requests').select('*, profiles(*)').limit(1);
  console.log('membership profiles(*):', e5?.message || 'OK');
}

main().catch(console.error);
