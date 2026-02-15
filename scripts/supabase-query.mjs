/**
 * Ejecuta una consulta a Supabase usando el cliente (anon key).
 * Uso: ( set -a; [ -f .env ] && source .env; set +a; node scripts/supabase-query.mjs )
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('🔌 Conexión:', supabaseUrl);
  console.log('');

  // Consulta 1: listar boxes (tabla que suele ser accesible)
  const { data: boxes, error: e1 } = await supabase
    .from('boxes')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (e1) {
    console.log('❌ Error en boxes:', e1.message);
  } else {
    console.log('📦 Tabla "boxes" (máx. 5):');
    console.log(JSON.stringify(boxes, null, 2));
  }

  console.log('');

  // Consulta 2: contar perfiles
  const { count, error: e2 } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (e2) {
    console.log('❌ Error en profiles (count):', e2.message);
  } else {
    console.log('👤 Total filas en "profiles":', count);
  }
}

run().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
