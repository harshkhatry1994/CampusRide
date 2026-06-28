import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zfsikxquvusonixrbzvy.supabase.co',
  'sb_publishable_lWf2Jd352u2UPW_EGt-k3Q_M0rTC8lX'
);

async function main() {
  console.log('=== Attempting insert to get schema info ===');
  
  const { data, error } = await supabase.from('rentals').insert({}).select();
  console.log('Insert rentals error:', error);
  
  const { data: d2, error: e2 } = await supabase.from('rentals').select('status');
  console.log('rentals with status column error:', e2);
}

main().catch(console.error);
