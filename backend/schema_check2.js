import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zfsikxquvusonixrbzvy.supabase.co',
  'sb_publishable_lWf2Jd352u2UPW_EGt-k3Q_M0rTC8lX'
);

async function main() {
  console.log('=== Checking tables ===');
  
  const { data: booking, error: bookingErr } = await supabase.from('bookings').select('*').limit(1);
  console.log('bookings cols:', booking && booking[0] ? JSON.stringify(Object.keys(booking[0])) : 'EMPTY/NO DATA', 'err:', bookingErr?.message);
  
  const { data: ride, error: rideErr } = await supabase.from('rides').select('*').limit(1);
  console.log('rides cols:', ride && ride[0] ? JSON.stringify(Object.keys(ride[0])) : 'EMPTY/NO DATA', 'err:', rideErr?.message);
  
  const { data: mem, error: memErr } = await supabase.from('membership_requests').select('*').limit(1);
  console.log('membership_requests:', mem && mem[0] ? JSON.stringify(Object.keys(mem[0])) : 'EMPTY/NO DATA', 'err:', memErr?.message);
}

main().catch(console.error);
