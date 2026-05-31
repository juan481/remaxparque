#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// bulk-create-users.mjs  —  Creación masiva de usuarios desde Excel
//
// Modos de uso:
//   node scripts/bulk-create-users.mjs               → crea cuentas Y envía emails
//   node scripts/bulk-create-users.mjs --no-email    → solo crea cuentas, sin emails
//   node scripts/bulk-create-users.mjs --only-email  → solo envía emails (cuentas ya creadas)
//
// Requisitos previos:
//   npm install xlsx resend dotenv
//   Agregar RESEND_API_KEY en .env.local
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, extname } from 'path';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import XLSX from 'xlsx';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// ── Configuración ─────────────────────────────────────────────────────────────
const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY      = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY    = process.env.RESEND_API_KEY;
const SITE_URL          = process.env.NEXT_PUBLIC_SITE_URL || 'https://academia.remax-parque.com.ar';

// Remitente — debe ser un dominio verificado en Resend
const FROM_EMAIL = 'Academia RE/MAX Parque <academia@remax-parque.com.ar>';

// Anti-spam: throttling entre envíos
const DELAY_EMAIL_MS   = 1500;   // 1.5s entre cada email
const BATCH_SIZE       = 15;     // emails por lote
const DELAY_BATCH_MS   = 60_000; // 60s de pausa entre lotes

// Ruta por defecto al Excel (cambiá el nombre si es necesario)
const DEFAULT_EXCEL_DIR = 'C:/Users/Juanc/Documents/JustCreate/Clientes/Claude Proyectos/Remax/Usuarios';

// ── Modo de ejecución ─────────────────────────────────────────────────────────
const NO_EMAIL   = process.argv.includes('--no-email');    // crea cuentas, no envía emails
const ONLY_EMAIL = process.argv.includes('--only-email');  // solo envía emails, no crea cuentas

// ── Validaciones ──────────────────────────────────────────────────────────────
if (!SUPABASE_URL || !SUPABASE_KEY || !RESEND_API_KEY) {
  console.error('\n❌ Faltan variables de entorno en .env.local:');
  if (!SUPABASE_URL)   console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_KEY)   console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  if (!RESEND_API_KEY) console.error('   - RESEND_API_KEY');
  process.exit(1);
}

// ── Clientes ──────────────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const resend   = new Resend(RESEND_API_KEY);

// ── Helpers ───────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function mapParque(oficina) {
  const o = String(oficina || '').toLowerCase();
  if (o.includes('3') || o.includes('iii')) return 'parque3';
  return 'parque1';
}

function getExcelPath(arg) {
  if (arg) {
    const ext = extname(arg).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') return resolve(arg);
    // Es un directorio
    const files = readdirSync(arg).filter(f => /\.(xlsx|xls)$/i.test(f));
    if (!files.length) { console.error(`❌ Sin archivos Excel en: ${arg}`); process.exit(1); }
    console.log(`📂 Archivo encontrado: ${files[0]}`);
    return resolve(arg, files[0]);
  }
  // Buscar en directorio por defecto
  const files = readdirSync(DEFAULT_EXCEL_DIR).filter(f => /\.(xlsx|xls)$/i.test(f));
  if (!files.length) { console.error(`❌ Sin archivos Excel en: ${DEFAULT_EXCEL_DIR}`); process.exit(1); }
  console.log(`📂 Usando: ${files[0]}`);
  return resolve(DEFAULT_EXCEL_DIR, files[0]);
}

// ── Template de email ─────────────────────────────────────────────────────────
function buildEmail(nombre, email, password) {
  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Bienvenido/a a Academia RE/MAX</title></head>
<body style="margin:0;padding:0;background:#f7f5ee;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f7f5ee;padding:40px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" role="presentation"
  style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr>
    <td style="background:linear-gradient(135deg,#0C2749 0%,#000e35 100%);padding:32px 40px;text-align:center;">
      <table cellpadding="0" cellspacing="0" role="presentation" align="center" style="margin:0 auto 12px;">
        <tr>
          <td style="width:20px;height:40px;background:#ff1200;border-radius:20px 0 0 20px;"></td>
          <td style="width:20px;height:40px;background:#0043ff;border-radius:0 20px 20px 0;"></td>
        </tr>
      </table>
      <p style="margin:0;color:#ffffff;font-size:22px;font-weight:900;letter-spacing:3px;line-height:1.2;">ACADEMIA</p>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.65);font-size:13px;font-weight:300;">RE/MAX Parque</p>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="margin:0 0 6px;color:#0C2749;font-size:26px;font-weight:900;line-height:1.2;">¡Bienvenido/a,<br>${nombre}!</p>
      <p style="margin:16px 0 28px;color:#6B7280;font-size:15px;line-height:1.65;">
        Tu cuenta en <strong style="color:#0C2749;">Academia RE/MAX Parque</strong> fue creada con éxito.
        Ya podés acceder a toda la documentación, capacitaciones y herramientas del equipo.
      </p>

      <!-- Credentials -->
      <table cellpadding="0" cellspacing="0" role="presentation" width="100%"
        style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;margin-bottom:28px;">
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0 0 14px;color:#0C2749;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;">
              Tus credenciales de acceso
            </p>
            <table cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="padding:5px 16px 5px 0;color:#9CA3AF;font-size:13px;white-space:nowrap;">Email</td>
                <td style="padding:5px 0;color:#0C2749;font-size:14px;font-weight:600;">${email}</td>
              </tr>
              <tr>
                <td style="padding:5px 16px 5px 0;color:#9CA3AF;font-size:13px;white-space:nowrap;">Contraseña</td>
                <td style="padding:5px 0;color:#0C2749;font-size:14px;font-weight:700;font-family:monospace;letter-spacing:1px;">${password}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 28px;color:#D97706;font-size:13px;line-height:1.6;padding:12px 16px;background:#FFFBEB;border-radius:8px;border-left:3px solid #D97706;">
        <strong>Al ingresar por primera vez</strong> se te va a pedir que establezcas tu propia contraseña personal.
      </p>

      <!-- CTA -->
      <table cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="background:linear-gradient(135deg,#0043ff,#0C2749);border-radius:12px;">
            <a href="${SITE_URL}/login"
               style="display:inline-block;padding:15px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">
              Ingresar a Academia &rarr;
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#F8FAFC;padding:20px 40px;border-top:1px solid #E2E8F0;text-align:center;">
      <p style="margin:0;color:#9CA3AF;font-size:12px;line-height:1.6;">
        Este correo fue enviado a ${email} porque se creó una cuenta en Academia RE/MAX Parque.<br>
        &copy; 2026 RE/MAX Parque &mdash; Diseñado por
        <a href="https://justcreate.com.ar" style="color:#0043ff;text-decoration:none;">Just Create</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  const text = `¡Bienvenido/a ${nombre} a Academia RE/MAX Parque!

Tu cuenta fue creada. Estos son tus datos de acceso:

  Email:       ${email}
  Contraseña:  ${password}

Al ingresar por primera vez se te pedirá que establezcas tu propia contraseña personal.

Ingresar ahora: ${SITE_URL}/login

────────────────────────────────────
© 2026 RE/MAX Parque
`;

  return { html, text };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const excelArg  = process.argv.slice(2).find(a => !a.startsWith('--'));
  const excelPath = getExcelPath(excelArg);

  // Leer Excel
  const workbook = XLSX.readFile(excelPath);
  const sheet    = workbook.Sheets[workbook.SheetNames[0]];
  const rows     = XLSX.utils.sheet_to_json(sheet);

  const modeLabel = NO_EMAIL ? '👤 SOLO CUENTAS (sin emails)' : ONLY_EMAIL ? '📧 SOLO EMAILS (sin crear cuentas)' : '👤📧 CUENTAS + EMAILS';
  console.log(`\n✅ Excel cargado: ${rows.length} filas   |   Modo: ${modeLabel}\n`);
  console.log('─'.repeat(62));

  const results = [];
  let created = 0, skipped = 0, errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const row     = rows[i];
    const nombre  = String(row['Nombre']  || '').trim();
    const apellido= String(row['Apellido']|| '').trim();
    const email   = String(row['Mail']    || row['Email'] || row['email'] || '').trim().toLowerCase();
    const password= String(row['Pass']    || row['Contraseña'] || row['Password'] || '').trim();
    const oficina = String(row['Oficina'] || '').trim();

    const fullName = `${nombre} ${apellido}`.trim();
    const parque   = mapParque(oficina);
    const label    = `[${String(i + 1).padStart(3, '0')}/${rows.length}] ${fullName} <${email}>`;

    // Validar fila
    if (!email || !password || !nombre) {
      console.log(`${label} — ⚠️  SALTADO (datos incompletos)`);
      results.push({ fullName, email, status: 'saltado', detalle: 'Datos incompletos' });
      skipped++;
      continue;
    }

    process.stdout.write(`${label} ... `);

    try {
      let userId;

      // ── 1. Crear usuario en Supabase Auth ───────────────────────────────────
      if (!ONLY_EMAIL) {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });

        userId = authData?.user?.id;

        if (authError) {
          if (authError.message.toLowerCase().includes('already')) {
            const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
            const existing = listData?.users?.find(u => u.email === email);
            userId = existing?.id;
            if (!userId) throw new Error('Usuario duplicado pero no encontrado');
            process.stdout.write('(ya existía) ');
          } else {
            throw new Error(authError.message);
          }
        }

        // ── 2. Crear/actualizar perfil ────────────────────────────────────────
        await supabase.from('profiles').upsert({
          id: userId,
          full_name: fullName,
          email,
          role: 'agent',
          parque,
          password_changed: false,
        }, { onConflict: 'id' });

      } else {
        // Solo email: buscar el userId existente
        const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const existing = listData?.users?.find(u => u.email === email);
        if (!existing) throw new Error('Usuario no encontrado — crealo primero con --no-email');
        userId = existing.id;
      }

      // ── 3. Enviar email de bienvenida ───────────────────────────────────────
      if (!NO_EMAIL) {
        const { html, text } = buildEmail(nombre, email, password);
        const emailResp = await resend.emails.send({
          from:    FROM_EMAIL,
          to:      email,
          subject: `¡Bienvenido/a a Academia RE/MAX Parque, ${nombre}!`,
          html,
          text,
          headers: { 'X-Entity-Ref-ID': userId },
          tags: [
            { name: 'categoria', value: 'bienvenida' },
            { name: 'parque',    value: parque },
          ],
        });

        if (emailResp.error) {
          console.log(`✅ creado | ⚠️  email falló: ${emailResp.error.message}`);
          results.push({ fullName, email, status: 'creado_sin_email', detalle: emailResp.error.message });
          created++;
          continue;
        }
      }

      console.log(NO_EMAIL ? '✅ cuenta creada' : '✅ OK');
      results.push({ fullName, email, status: NO_EMAIL ? 'cuenta_creada' : 'ok', detalle: '' });
      created++;

    } catch (err) {
      console.log(`❌ ERROR: ${err.message}`);
      results.push({ fullName, email, status: 'error', detalle: err.message });
      errors++;
    }

    // ── Anti-spam throttling ──────────────────────────────────────────────────
    if (i < rows.length - 1) {
      await sleep(DELAY_EMAIL_MS);
      if ((i + 1) % BATCH_SIZE === 0) {
        const remaining = rows.length - (i + 1);
        console.log(`\n⏸  Pausa entre lotes (${DELAY_BATCH_MS / 1000}s) — quedan ${remaining} usuarios...\n`);
        await sleep(DELAY_BATCH_MS);
      }
    }
  }

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(62));
  console.log(`✅ Creados con éxito:  ${created}`);
  console.log(`⏭  Saltados:           ${skipped}`);
  console.log(`❌ Errores:            ${errors}`);
  console.log('═'.repeat(62));

  // ── Exportar log a CSV ────────────────────────────────────────────────────
  const csv = [
    'Nombre,Email,Estado,Detalle',
    ...results.map(r =>
      `"${r.fullName}","${r.email}","${r.status}","${r.detalle.replace(/"/g, "'")}"`
    ),
  ].join('\n');

  const csvPath = resolve(process.cwd(), `bulk-create-log-${Date.now()}.csv`);
  writeFileSync(csvPath, csv, 'utf-8');
  console.log(`\n📄 Log exportado: ${csvPath}\n`);
}

main().catch(err => {
  console.error('\n💥 Error fatal:', err.message);
  process.exit(1);
});
