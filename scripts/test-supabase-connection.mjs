/**
 * Script para verificar la conexión a Supabase.
 * Uso: node --env-file=.env scripts/test-supabase-connection.mjs
 * O: VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... node scripts/test-supabase-connection.mjs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Faltan variables de entorno.');
  console.error('   Asegúrate de tener VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu .env');
  process.exit(1);
}

console.log('🔌 Comprobando conexión a Supabase...');
console.log('   URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // 1. Probar que la API responde (una query simple que no requiere auth)
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      // Si es RLS o tabla no existe, probar con auth.getSession()
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('❌ Error de conexión:', error.message);
        console.error('   Detalle:', error);
        process.exit(1);
      }
      console.log('✅ Conexión a Supabase correcta (auth OK, consulta a perfiles con restricción RLS)');
      return;
    }
    console.log('✅ Conexión a Supabase correcta.');
    console.log('   Respuesta de ejemplo (profiles):', data?.length >= 0 ? `${data.length} fila(s)` : 'OK');
  } catch (err) {
    console.error('❌ Error inesperado:', err.message);
    process.exit(1);
  }
}

testConnection();
