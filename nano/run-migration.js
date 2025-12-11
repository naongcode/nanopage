const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Running migration...');

    // SQL 파일 읽기
    const sql = fs.readFileSync('./supabase-migration-add-generated-image.sql', 'utf8');

    // SQL 실행
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('Migration failed:', error);

      // RPC가 없으면 직접 실행
      console.log('Trying direct execution...');
      const { error: error2 } = await supabase.from('scenarios').select('generated_image_url').limit(1);

      if (error2 && error2.message.includes('column "generated_image_url" does not exist')) {
        console.log('\nPlease run this SQL manually in Supabase Dashboard:');
        console.log('\n' + sql);
      } else {
        console.log('Column already exists!');
      }
    } else {
      console.log('Migration completed successfully!');
    }
  } catch (err) {
    console.error('Error:', err);
    console.log('\nPlease run the SQL manually in Supabase Dashboard (SQL Editor):');
    console.log('\n' + fs.readFileSync('./supabase-migration-add-generated-image.sql', 'utf8'));
  }
}

runMigration();
