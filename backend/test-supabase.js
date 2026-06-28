import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = "sb_publishable_lWf2Jd352u2UPW_EGt-k3Q_M0rTC8lX";

async function run() {
  const url = `${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`;
  const res = await fetch(url);
  const text = await res.text();
  console.log("RESPONSE TYPE:", res.headers.get('content-type'));
  console.log("RESPONSE FIRST 1000 CHARS:", text.substring(0, 1000));
}
run();
