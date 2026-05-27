'use server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// ── Validation ────────────────────────────────────────────────
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',                                                              // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',        // .docx
  'application/vnd.ms-powerpoint',                                                  // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',      // .pptx
  'image/jpeg',
  'image/png',
]);
const MAX_BYTES = 30 * 1024 * 1024; // 30 MB

function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function revalidateAll() {
  revalidatePath('/admin/documentos');
  revalidatePath('/legales');
}

// ── File upload helper ────────────────────────────────────────
async function uploadFile(
  file: File,
  displayName?: string
): Promise<{ url: string; sizeKb: number; fileName: string }> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error('Formato no permitido. Usá: PDF, DOC, DOCX, PPT, JPG o PNG.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('El archivo supera el límite de 30 MB.');
  }
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const safeName = (displayName ?? file.name).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._\-]/g, '');
  const storagePath = `${Date.now()}_${safeName || 'documento'}`;
  const { data, error } = await adminClient()
    .storage.from('documents')
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });
  if (error) throw new Error('Error al subir archivo: ' + error.message);
  const { data: { publicUrl } } = adminClient().storage.from('documents').getPublicUrl(data.path);
  return { url: publicUrl, sizeKb: Math.round(buffer.length / 1024), fileName: displayName ?? file.name };
}

// ── Create ────────────────────────────────────────────────────
export async function createDocument(formData: FormData) {
  const file = formData.get('file') as File | null;
  const title = (formData.get('title') as string)?.trim();
  if (!title) throw new Error('El título es obligatorio.');

  let file_url: string | null = null;
  let file_size_kb: number | null = null;
  let file_name: string | null = null;

  if (file && file.size > 0) {
    const up = await uploadFile(file, title);
    file_url = up.url;
    file_size_kb = up.sizeKb;
    file_name = up.fileName;
  }

  const pv = formData.getAll('parque_visibility') as string[];
  const { error } = await adminClient().from('documents').insert({
    title,
    type: (formData.get('type') as string) || null,
    category: (formData.get('category') as string) || null,
    parque_visibility: pv.length ? pv : ['parque1', 'parque3'],
    status: (formData.get('status') as string) || 'borrador',
    version: (formData.get('version') as string) || null,
    changelog_summary: (formData.get('changelog_summary') as string) || null,
    effective_date: (formData.get('effective_date') as string) || null,
    location_slug: (formData.get('location_slug') as string) || null,
    file_url, file_size_kb, file_name,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidateAll();
}

// ── Update metadata ───────────────────────────────────────────
export async function updateDocument(id: string, formData: FormData) {
  const title = (formData.get('title') as string)?.trim();
  const pv = formData.getAll('parque_visibility') as string[];

  const update: Record<string, unknown> = {
    title,
    type: (formData.get('type') as string) || null,
    category: (formData.get('category') as string) || null,
    parque_visibility: pv.length ? pv : [],
    status: (formData.get('status') as string) || 'borrador',
    version: (formData.get('version') as string) || null,
    changelog_summary: (formData.get('changelog_summary') as string) || null,
    effective_date: (formData.get('effective_date') as string) || null,
    location_slug: (formData.get('location_slug') as string) || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await adminClient().from('documents').update(update).eq('id', id);
  if (error) throw new Error(error.message);
  revalidateAll();
}

// ── Upload new version (replaces file, keeps metadata) ────────
export async function uploadDocumentVersion(id: string, formData: FormData) {
  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) throw new Error('Seleccioná un archivo para la nueva versión.');
  const customName = (formData.get('display_name') as string)?.trim() || undefined;
  const { url, sizeKb, fileName } = await uploadFile(file, customName);

  const update: Record<string, unknown> = {
    file_url: url,
    file_size_kb: sizeKb,
    file_name: fileName,
    updated_at: new Date().toISOString(),
  };
  const newVersion = (formData.get('version') as string)?.trim();
  const changelog = (formData.get('changelog_summary') as string)?.trim();
  if (newVersion) update.version = newVersion;
  if (changelog) update.changelog_summary = changelog;

  const { error } = await adminClient().from('documents').update(update).eq('id', id);
  if (error) throw new Error(error.message);
  revalidateAll();
}

// ── Quick status toggle ───────────────────────────────────────
export async function updateDocumentStatus(id: string, status: string) {
  const { error } = await adminClient()
    .from('documents')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidateAll();
}

// ── Delete ────────────────────────────────────────────────────
export async function deleteDocument(id: string) {
  const { error } = await adminClient().from('documents').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidateAll();
}
