import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zfsikxquvusonixrbzvy.supabase.co',
  'sb_publishable_lWf2Jd352u2UPW_EGt-k3Q_M0rTC8lX'
);

async function main() {
  const { data: bike } = await supabase.from('bikes').select('id').limit(1).single();
  const { data: profile } = await supabase.from('profiles').select('id').limit(1).single();
  
  if (!bike || !profile) {
    console.error('No bike or profile found to test insertion.');
    return;
  }
  
  console.log('Using bike_id:', bike.id, 'profile_id:', profile.id);
  
  // Try inserting a dummy row with only minimum fields to see what columns rentals has
  const { data, error } = await supabase.from('rentals').insert({
    bike_id: bike.id,
    user_id: profile.id,
    start_date: new Date().toISOString(),
    end_date: new Date().toISOString(),
    total_price: 0,
    status: 'pending'
  }).select('*');
  
  if (error) {
    console.error('Insertion failed:', error.message);
  } else {
    console.log('Successfully inserted! Rentals columns are:');
    console.log(data[0] ? Object.keys(data[0]) : 'EMPTY');
    
    // Clean up
    const { error: delErr } = await supabase.from('rentals').delete().eq('id', data[0].id);
    console.log('Cleanup error:', delErr?.message || 'NONE');
  }
}

main().catch(console.error);
