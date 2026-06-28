import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zfsikxquvusonixrbzvy.supabase.co',
  'sb_publishable_lWf2Jd352u2UPW_EGt-k3Q_M0rTC8lX'
);

const tables = [
  'bikes', 'profiles', 'rentals', 'membership_requests', 'app_settings', 'drivers', 'invoices',
  'users', 'rides', 'bookings', 'payments',
  'dealer_bikes', 'dealer_customers', 'dealer_sales', 'dealer_invoices', 'inventory_logs'
];

async function main() {
  console.log('=== Checking all potential tables ===');
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table "${table}": NOT ACCESSIBLE (Error: ${error.code} - ${error.message})`);
    } else {
      console.log(`Table "${table}": EXISTS (Rows returned: ${data.length})`);
    }
  }
}

main().catch(console.error);
