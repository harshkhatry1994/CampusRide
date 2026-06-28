import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zfsikxquvusonixrbzvy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_lWf2Jd352u2UPW_EGt-k3Q_M0rTC8lX';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testQuery() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  console.log('USERS DATA:', data);
  console.log('USERS ERROR:', error);

  const { data: pData, error: pError } = await supabase.from('profiles').select('*').limit(1);
  console.log('PROFILES DATA:', pData);
  console.log('PROFILES ERROR:', pError);
}

testQuery();
