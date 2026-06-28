import { createClient } from '@supabase/supabase-js';

const s = createClient(
  'https://zfsikxquvusonixrbzvy.supabase.co',
  'sb_publishable_lWf2Jd352u2UPW_EGt-k3Q_M0rTC8lX'
);

async function run() {
  // Test the EXACT query that AuthContext is now using (causes the regression)
  const bad = await s.from('profiles')
    .select('id, email, full_name, role, avatar_url, phone, is_premium')
    .eq('id', '8273176d-045c-4954-b9df-8645b2980a85')
    .single();
  console.log('BAD QUERY (with is_premium) ERROR:', bad.error?.message);
  console.log('BAD QUERY DATA:', bad.data);

  // Test the original working query
  const good = await s.from('profiles')
    .select('*')
    .eq('id', '8273176d-045c-4954-b9df-8645b2980a85')
    .single();
  console.log('GOOD QUERY (select *) ERROR:', good.error?.message);
  console.log('GOOD QUERY role:', good.data?.role);
  console.log('GOOD QUERY all columns:', good.data ? Object.keys(good.data).join(', ') : 'NULL');
}
run().catch(e => console.error(e));
