import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zfsikxquvusonixrbzvy.supabase.co',
  'sb_publishable_lWf2Jd352u2UPW_EGt-k3Q_M0rTC8lX'
);

async function main() {
  const { data: rentals, error: rErr } = await supabase.from('rentals').select('id, user_id, bike_id');
  console.log('Rentals:', rentals, 'error:', rErr?.message);
  
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, email, role');
  console.log('Profiles:', profiles, 'error:', pErr?.message);
  
  const { data: bikes, error: bErr } = await supabase.from('bikes').select('id, bike_name');
  console.log('Bikes:', bikes, 'error:', bErr?.message);
}

main().catch(console.error);
