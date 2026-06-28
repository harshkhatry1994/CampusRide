import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zfsikxquvusonixrbzvy.supabase.co',
  'sb_publishable_lWf2Jd352u2UPW_EGt-k3Q_M0rTC8lX'
);

async function inspect(tableName) {
  const { data, error } = await supabase.from(tableName).select('*').limit(1);
  if (error) {
    console.log(`Table "${tableName}": ERROR:`, error.message);
  } else {
    console.log(`Table "${tableName}": EXISTS, columns:`, data[0] ? Object.keys(data[0]) : 'EMPTY/NO ROWS');
  }
}

async function main() {
  const tables = [
    'membership_requests',
    'app_settings',
    'drivers',
    'dealer_bikes',
    'dealer_sales',
    'dealer_customers',
    'dealer_invoices',
    'bike_images',
    'bike_documents',
    'customer_documents',
    'inventory_logs',
    'portal_notifications',
    'company_settings',
    'portal_profiles',
    'rentals',
    'invoices',
    'bikes',
    'profiles'
  ];
  for (const t of tables) {
    await inspect(t);
  }
  
  console.log('\n=== Testing rentals joined with profiles & bikes ===');
  const { error: e1 } = await supabase.from('rentals').select('id, user_id, profiles(id, full_name, email)').limit(1);
  console.log('rentals join profiles:', e1 ? e1.message : 'SUCCESS');
  
  const { error: e2 } = await supabase.from('rentals').select('id, bike_id, bikes(id, bike_name)').limit(1);
  console.log('rentals join bikes:', e2 ? e2.message : 'SUCCESS');
}

main().catch(console.error);
