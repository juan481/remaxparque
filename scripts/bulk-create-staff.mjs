#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// bulk-create-staff.mjs  —  Importación masiva de Staff desde Excel
//
// Uso:
//   node scripts/bulk-create-staff.mjs               → busca en carpeta Staff
//   node scripts/bulk-create-staff.mjs --no-email    → crea cuentas sin emails
//   node scripts/bulk-create-staff.mjs --only-email  → solo envía emails
//
// Columnas esperadas en el Excel: Nombre, Correo, Número de teléfono, Cargo, Parque
// ─────────────────────────────────────────────────────────────────────────────

import { writeFileSync, readdirSync } from 'fs';
import { resolve, extname } from 'path';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import XLSX from 'xlsx';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SITE_URL       = process.env.NEXT_PUBLIC_SITE_URL || 'https://academia.remax-parque.com.ar';
const FROM_EMAIL     = 'Academia RE/MAX Parque <academia@remax-parque.com.ar>';

const DEFAULT_EXCEL_DIR = 'C:/Users/Juanc/Documents/JustCreate/Clientes/Claude Proyectos/Remax/Staff';

const NO_EMAIL   = process.argv.includes('--no-email');
const ONLY_EMAIL = process.argv.includes('--only-email');

const DELAY_EMAIL_MS  = 1500;
const BATCH_SIZE      = 15;
const DELAY_BATCH_MS  = 60_000;

if (!SUPABASE_URL || !SUPABASE_KEY || !RESEND_API_KEY) {
  console.error('\n❌ Faltan variables de entorno en .env.local'); process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const resend   = new Resend(RESEND_API_KEY);

// ── Helpers ───────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function mapParque(parqueRaw) {
  const p = String(parqueRaw || '').toLowerCase();
  if (p.includes('3') || p.includes('iii')) return 'parque3';
  return 'parque1';
}

function mapRole(cargo) {
  const c = String(cargo || '').toLowerCase();
  if (c.includes('broker') || c.includes('director')) return 'admin';
  return 'staff';
}

function getExcelPath(arg) {
  if (arg) {
    const ext = extname(arg).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') return resolve(arg);
    const files = readdirSync(arg).filter(f => /\.(xlsx|xls)$/i.test(f));
    if (!files.length) { console.error(`❌ Sin archivos Excel en: ${arg}`); process.exit(1); }
    console.log(`📂 Archivo: ${files[0]}`);
    return resolve(arg, files[0]);
  }
  const files = readdirSync(DEFAULT_EXCEL_DIR).filter(f => /\.(xlsx|xls)$/i.test(f));
  if (!files.length) { console.error(`❌ Sin archivos Excel en: ${DEFAULT_EXCEL_DIR}`); process.exit(1); }
  console.log(`📂 Usando: ${files[0]}`);
  return resolve(DEFAULT_EXCEL_DIR, files[0]);
}

function buildEmail(nombre, email, password, cargo) {
  const html = `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f7f5ee;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0"
  style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <tr>
    <td style="background:linear-gradient(135deg,#0C2749,#000e35);padding:32px;text-align:center;">
      <p style="margin:0;color:#fff;font-size:22px;font-weight:900;letter-spacing:3px;">ACADEMIA</p>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:13px;">RE/MAX Parque</p>
    </td>
  </tr>
  <tr><td style="padding:36px;">
    <p style="margin:0 0 8px;color:#0C2749;font-size:24px;font-weight:900;">Hola, ${nombre}</p>
    <p style="color:#6B7280;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Tu cuenta de <strong style="color:#0C2749;">Staff en Academia RE/MAX Parque</strong> fue creada.
      A partir de ahora podés acceder a todos los recursos y herramientas del equipo.
    </p>
    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 12px;color:#0C2749;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;">Credenciales de acceso</p>
      <table cellpadding="0" cellspacing="0">
        <tr><td style="padding:4px 16px 4px 0;color:#9CA3AF;font-size:13px;">Cargo</td>
            <td style="padding:4px 0;color:#0C2749;font-size:14px;font-weight:600;">${cargo}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#9CA3AF;font-size:13px;">Email</td>
            <td style="padding:4px 0;color:#0C2749;font-size:14px;font-weight:600;">${email}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#9CA3AF;font-size:13px;">Contraseña</td>
            <td style="padding:4px 0;color:#0C2749;font-size:14px;font-weight:700;font-family:monospace;letter-spacing:1px;">${password}</td></tr>
      </table>
    </div>
    <p style="color:#D97706;font-size:13px;background:#FFFBEB;padding:12px 16px;border-radius:8px;border-left:3px solid #D97706;margin:0 0 24px;">
      <strong>Primera vez:</strong> al ingresar se te pedirá que establezcas tu propia contraseña.
    </p>
    <a href="${SITE_URL}/login" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#0043ff,#0C2749);color:#fff;font-size:14px;font-weight:700;text-decoration:none;border-radius:12px;">
      Ingresar a Academia →
    </a>
  </td></tr>
  <tr>
    <td style="background:#F8FAFC;padding:20px 32px;border-top:1px solid #E2E8F0;text-align:center;">
      <p style="margin:0;color:#9CA3AF;font-size:12px;">© 2026 RE/MAX Parque</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body></html>`;

  const text = `Hola ${nombre},\n\nTu cuenta de Staff fue creada en Academia RE/MAX Parque.\n\nCargo: ${cargo}\nEmail: ${email}\nContraseña temporal: ${password}\n\nAl ingresar deberás cambiar tu contraseña.\n\n${SITE_URL}/login`;
  return { html, text };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const excelArg  = process.argv.slice(2).find(a => !a.startsWith('--'));
  const excelPath = getExcelPath(excelArg);

  const workbook = XLSX.readFile(excelPath);
  const sheet    = workbook.Sheets[workbook.SheetNames[0]];
  const rows     = XLSX.utils.sheet_to_json(sheet);

  const mode = NO_EMAIL ? '👤 SOLO CUENTAS' : ONLY_EMAIL ? '📧 SOLO EMAILS' : '👤📧 CUENTAS + EMAILS';
  console.log(`\n✅ Excel: ${rows.length} filas   |   Modo: ${mode}\n`);
  console.log('─'.repeat(65));

  // Pre-cargar lista de usuarios existentes para detección de duplicados
  const { data: authList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existingByEmail = new Map((authList?.users ?? []).map(u => [u.email?.toLowerCase(), u]));
  const existingByName  = new Map((authList?.users ?? []).map(u => [
    (u.user_metadata?.full_name ?? '').toLowerCase().trim(), u
  ]));

  const results = [];
  let created = 0, updated = 0, skipped = 0, errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const row      = rows[i];
    const nombre   = String(row['Nombre']               || '').trim();
    const email    = String(row['Correo']               || row['Email'] || row['Mail'] || '').trim().toLowerCase();
    const phone    = String(row['Número de teléfono']   || row['Telefono'] || row['Teléfono'] || '').trim();
    const cargo    = String(row['Cargo']                || '').trim();
    const parqueRaw= String(row['Parque']               || '').trim();
    const password = String(row['Pass']                 || row['Contraseña'] || 'Remax2024!').trim();

    const parque = mapParque(parqueRaw);
    const role   = mapRole(cargo);
    const label  = `[${String(i+1).padStart(3,'0')}/${rows.length}] ${nombre} <${email}>`;

    if (!email || !nombre) {
      console.log(`${label} — ⚠️  SALTADO (datos incompletos)`);
      results.push({ nombre, email, status: 'saltado', detalle: 'Datos incompletos' });
      skipped++;
      continue;
    }

    process.stdout.write(`${label} ... `);

    try {
      // ── Detección de duplicados ─────────────────────────────────────────────
      const existingByMail = existingByEmail.get(email);
      const existingByNm   = existingByName.get(nombre.toLowerCase());
      const existing       = existingByMail ?? existingByNm;

      let userId;

      if (!ONLY_EMAIL) {
        if (existing) {
          // Ya existe → actualizar rol y perfil
          userId = existing.id;
          await supabase.from('profiles').update({
            role, phone: phone || null, department: cargo, parque,
            full_name: nombre, email,
          }).eq('id', userId);
          process.stdout.write('(actualizado) ');
          updated++;
        } else {
          // Crear nuevo usuario
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email, password, email_confirm: true,
            user_metadata: { full_name: nombre },
          });
          if (authError) throw new Error(authError.message);
          userId = authData.user!.id;

          await supabase.from('profiles').upsert({
            id: userId, full_name: nombre, email, role, parque,
            phone: phone || null, department: cargo, password_changed: false,
          }, { onConflict: 'id' });

          // Agregar al mapa para evitar duplicados en la misma corrida
          existingByEmail.set(email, authData.user!);
          existingByName.set(nombre.toLowerCase(), authData.user!);
          created++;
        }
      } else {
        userId = existing?.id;
        if (!userId) throw new Error('No encontrado — corré sin --only-email primero');
      }

      // ── Email de bienvenida ─────────────────────────────────────────────────
      if (!NO_EMAIL && !existing) {
        const { html, text } = buildEmail(nombre, email, password, cargo);
        const emailResp = await resend.emails.send({
          from: FROM_EMAIL, to: email,
          subject: `Tu acceso a Academia RE/MAX Parque está listo, ${nombre}`,
          html, text,
          headers: { 'X-Entity-Ref-ID': userId },
          tags: [{ name: 'tipo', value: 'staff-bienvenida' }],
        });
        if (emailResp.error) {
          console.log(`✅ | ⚠️  email: ${emailResp.error.message}`);
          results.push({ nombre, email, status: 'ok_sin_email', detalle: emailResp.error.message });
          continue;
        }
      }

      console.log(existing ? '🔄 actualizado' : '✅ creado');
      results.push({ nombre, email, status: existing ? 'actualizado' : 'creado', detalle: '' });

    } catch (err) {
      console.log(`❌ ${err.message}`);
      results.push({ nombre, email, status: 'error', detalle: err.message });
      errors++;
    }

    if (i < rows.length - 1) {
      await sleep(DELAY_EMAIL_MS);
      if ((i + 1) % BATCH_SIZE === 0) {
        console.log(`\n⏸  Pausa anti-spam (${DELAY_BATCH_MS/1000}s)...\n`);
        await sleep(DELAY_BATCH_MS);
      }
    }
  }

  console.log('\n' + '═'.repeat(65));
  console.log(`✅ Creados:       ${created}`);
  console.log(`🔄 Actualizados:  ${updated}`);
  console.log(`⏭  Saltados:      ${skipped}`);
  console.log(`❌ Errores:       ${errors}`);
  console.log('═'.repeat(65));

  const csv = ['Nombre,Email,Estado,Detalle',
    ...results.map(r => `"${r.nombre}","${r.email}","${r.status}","${r.detalle.replace(/"/g, "'")}"`),
  ].join('\n');
  const csvPath = resolve(process.cwd(), `bulk-staff-log-${Date.now()}.csv`);
  writeFileSync(csvPath, csv, 'utf-8');
  console.log(`\n📄 Log: ${csvPath}\n`);
}

main().catch(err => { console.error('\n💥', err.message); process.exit(1); });
