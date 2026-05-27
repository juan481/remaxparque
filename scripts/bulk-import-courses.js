/**
 * Bulk Course Importer — RE/MAX Academia
 * ----------------------------------------
 * Importa cursos desde archivos JSON a la base de datos Supabase.
 *
 * Uso:
 *   node scripts/bulk-import-courses.js              → importa ambos (academia1 + academia3)
 *   node scripts/bulk-import-courses.js --parque1    → solo Parque 1
 *   node scripts/bulk-import-courses.js --parque3    → solo Parque 3
 *   node scripts/bulk-import-courses.js --dry-run    → simula sin escribir
 *
 * Requisitos:
 *   - Node.js 18+
 *   - Archivo .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 *   - npm install @supabase/supabase-js dotenv   (si no están instalados)
 *
 * Estructura JSON esperada:
 *   Ver scripts/data/academia1.template.json
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load env from .env.local
function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ No se encontró .env.local. Asegurate de correr el script desde la raíz del proyecto.');
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) {
      process.env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const args = process.argv.slice(2);
const DRY_RUN  = args.includes('--dry-run');
const ONLY_P1  = args.includes('--parque1');
const ONLY_P3  = args.includes('--parque3');

// ─── Helpers ────────────────────────────────────────────────────────────────

function loadJSON(filename) {
  const filePath = path.resolve(__dirname, 'data', filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Archivo no encontrado: ${filePath}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function buildRow(course) {
  // Validate required field
  if (!course.title) throw new Error(`Curso sin título: ${JSON.stringify(course)}`);

  // Validate difficulty
  const validDiff = ['basico', 'intermedio', 'avanzado'];
  const difficulty = course.difficulty && validDiff.includes(course.difficulty)
    ? course.difficulty
    : null;

  // Build parque_visibility array
  const parque = course.parque; // 'parque1' | 'parque3' | 'both'
  let parqueVisibility;
  if (!parque || parque === 'both') {
    parqueVisibility = ['parque1', 'parque3'];
  } else {
    parqueVisibility = [parque];
  }

  return {
    title:             course.title,
    description:       course.description   ?? null,
    category:          course.category      ?? null,
    video_url:         course.video_url     ?? null,
    pdf_url:           course.pdf_url       ?? null,
    duration_minutes:  course.duration_minutes ? parseInt(course.duration_minutes) : null,
    difficulty:        difficulty,
    instructor:        course.instructor    ?? null,
    thumbnail_url:     course.thumbnail_url ?? null,
    is_published:      course.is_published  ?? false,
    parque_visibility: parqueVisibility,
  };
}

async function importFile(filename, label) {
  console.log(`\n📂 Procesando ${label} (${filename})...`);

  const courses = loadJSON(filename);
  if (!courses) return { imported: 0, errors: 0 };

  if (!Array.isArray(courses)) {
    console.error(`❌ El archivo ${filename} debe contener un array JSON.`);
    return { imported: 0, errors: 1 };
  }

  console.log(`   📋 ${courses.length} curso${courses.length !== 1 ? 's' : ''} encontrado${courses.length !== 1 ? 's' : ''}`);

  const rows = [];
  let errorCount = 0;

  for (const [i, course] of courses.entries()) {
    try {
      rows.push(buildRow(course));
    } catch (err) {
      console.error(`   ❌ Error en curso [${i}]: ${err.message}`);
      errorCount++;
    }
  }

  if (rows.length === 0) {
    console.warn('   ⚠️  Sin filas válidas para importar.');
    return { imported: 0, errors: errorCount };
  }

  // Preview
  console.log('\n   Vista previa (primeros 3):');
  for (const r of rows.slice(0, 3)) {
    console.log(`   • [${r.parque_visibility.join(',')}] ${r.title} (${r.difficulty ?? 'sin dificultad'})`);
  }
  if (rows.length > 3) console.log(`   ... y ${rows.length - 3} más`);

  if (DRY_RUN) {
    console.log('\n   🔍 DRY RUN — no se escribió nada en la base de datos.');
    return { imported: rows.length, errors: errorCount };
  }

  // Insert in batches of 50
  let totalImported = 0;
  const BATCH = 50;
  for (let start = 0; start < rows.length; start += BATCH) {
    const batch = rows.slice(start, start + BATCH);
    const { data, error } = await supabase.from('courses').insert(batch).select('id, title');
    if (error) {
      console.error(`   ❌ Error al insertar batch [${start}–${start + batch.length}]: ${error.message}`);
      errorCount += batch.length;
    } else {
      totalImported += data.length;
      console.log(`   ✅ Batch [${start + 1}–${start + data.length}] importado.`);
    }
  }

  return { imported: totalImported, errors: errorCount };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 RE/MAX Academia — Importador masivo de cursos');
  console.log('━'.repeat(50));
  if (DRY_RUN) console.log('⚠️  MODO DRY RUN — no se modificará la base de datos\n');

  let totalImported = 0;
  let totalErrors   = 0;

  if (!ONLY_P3) {
    const r = await importFile('academia1.json', 'Academia Parque 1');
    totalImported += r.imported;
    totalErrors   += r.errors;
  }

  if (!ONLY_P1) {
    const r = await importFile('academia3.json', 'Academia Parque 3');
    totalImported += r.imported;
    totalErrors   += r.errors;
  }

  console.log('\n' + '━'.repeat(50));
  console.log(`✅ Total importados: ${totalImported}`);
  if (totalErrors > 0) console.log(`❌ Total errores:     ${totalErrors}`);
  console.log('Done.\n');
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
