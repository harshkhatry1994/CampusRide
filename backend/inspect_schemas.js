import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zfsikxquvusonixrbzvy.supabase.co',
  'sb_publishable_lWf2Jd352u2UPW_EGt-k3Q_M0rTC8lX'
);

async function main() {
  const { data: bikes } = await supabase.from('bikes').select('*').limit(1);
  console.log('Bikes columns:', bikes && bikes[0] ? Object.keys(bikes[0]) : 'No row in bikes');
  if (bikes && bikes[0]) console.log('Bikes sample:', bikes[0]);

  const { data: profiles } = await supabase.from('profiles').select('*').limit(1);
  console.log('Profiles columns:', profiles && profiles[0] ? Object.keys(profiles[0]) : 'No row in profiles');
  if (profiles && profiles[0]) console.log('Profiles sample:', profiles[0]);
}

main().catch(console.error);
