import { createClient } from '@supabase/supabase-js';

async function main() {
  console.log('=== Checking tables ===');
  
  const res = await fetch('https://zfsikxquvusonixrbzvy.supabase.co/rest/v1/', {
    headers: {
      'apikey': 'sb_publishable_lWf2Jd352u2UPW_EGt-k3Q_M0rTC8lX'
    }
  });
  
  const spec = await res.json();
  console.log('Tables: ', Object.keys(spec.definitions || {}).join(', '));
  
  if (spec.definitions && spec.definitions.rentals) {
    console.log('rentals schema:', JSON.stringify(spec.definitions.rentals.properties, null, 2));
  }
  
  if (spec.definitions && spec.definitions.bookings) {
    console.log('bookings schema:', JSON.stringify(spec.definitions.bookings.properties, null, 2));
  }
}

main().catch(console.error);
