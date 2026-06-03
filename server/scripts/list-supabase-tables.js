'use strict';

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

(async () => {
  const supabaseUrl = 'https://zrrffsjbfkphridqyais.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { data, error } = await supabase.from('app_secrets').select('*').limit(1);
    if (error) {
      console.log(`❌ Table 'app_secrets' failed:`, error.message);
    } else {
      console.log(`✅ Table 'app_secrets' exists! Data sample:`, data);
    }
  } catch (err) {
    console.log(`❌ Table 'app_secrets' exception:`, err.message);
  }
})();
