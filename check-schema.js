// Simple script to check the profiles table structure
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfilesTable() {
  try {
    // Get the table structure
    const { data: columns, error } = await supabase
      .rpc('get_columns_info', { table_name: 'profiles' });

    if (error) {
      console.error('Error getting table info:', error);
      return;
    }

    console.log('Profiles table columns:');
    console.table(columns);
    
    // Check if onboarding_completed exists
    const hasOnboardingColumn = columns.some(col => col.column_name === 'onboarding_completed');
    console.log('\nonboarding_completed column exists:', hasOnboardingColumn);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkProfilesTable();
