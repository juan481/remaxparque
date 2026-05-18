import { NextResponse } from 'next/server';

type TemplateData = Record<string, string>;

const TEMPLATES: Record<string, { name: string; generate: (d: TemplateData) => string }> = {
  'recibo-sena': {
    name: 'Recibo de Sena',
    generate: (d) => [
      '<h1>RECIBO DE SENA</h1>',
      '<p><strong>Fecha:</strong> ' + (d.fecha ?? '') + '</p>',
      '<hr/>',
      '<p>Consta que <strong>' + (d.comprador ?? '') + '</strong> entrega en concepto de sena la suma de <strong>$' + (d.monto ?? '') + '</strong> al propietario <strong>' + (d.propietario ?? '') + '</strong> por el inmueble en <strong>' + (d.direccion ?? '') + '</strong>.</p>',
      d.agente ? '<p><strong>Agente:</strong> ' + d.agente + '</p>' : '',
      '<div class="firma"><div class="firma-box"><p>Firma comprador</p><p>' + (d.comprador ?? '') + '</p></div><div class="firma-box"><p>Firma propietario</p><p>' + (d.propietario ?? '') + '</p></div></div>',
    ].join('\n'),
  },
  'contrato-alquiler': {
    name: 'Contrato de Alquiler',
    generate: (d) => [
      '<h1>CONTRATO DE LOCACION</h1>',
      '<p><strong>Locador:</strong> ' + (d.propietario ?? '') + '</p>',
      '<p><strong>Locatario:</strong> ' + (d.inquilino ?? '') + ' DNI ' + (d.dni ?? '') + '</p>',
      '<p><strong>Inmueble:</strong> ' + (d.direccion ?? '') + '</p>',
      '<p><strong>Duracion:</strong> ' + (d.duracion ?? '') + ' meses desde ' + (d.inicio ?? '') + ' | Canon mensual: $' + (d.monto ?? '') + '</p>',
      '<p>Las demas condiciones se rigen por el Codigo Civil y Comercial y la Ley 27.551.</p>',
      d.agente ? '<p><strong>Agente:</strong> ' + d.agente + '</p>' : '',
      '<div class="firma"><div class="firma-box"><p>Firma Locador</p><p>' + (d.propietario ?? '') + '</p></div><div class="firma-box"><p>Firma Locatario</p><p>' + (d.inquilino ?? '') + '</p></div></div>',
    ].join('\n'),
  },
  'reserva-propiedad': {
    name: 'Reserva de Propiedad',
    generate: (d) => [
      '<h1>RESERVA DE PROPIEDAD</h1>',
      '<p><strong>Fecha:</strong> ' + (d.fecha ?? '') + '</p><hr/>',
      '<p><strong>' + (d.reservante ?? '') + '</strong> (DNI ' + (d.dni ?? '') + ') reserva el inmueble en <strong>' + (d.direccion ?? '') + '</strong> a un precio de <strong>$' + (d.precio ?? '') + '</strong>. Monto de reserva: <strong>$' + (d.reserva ?? '') + '</strong>.</p>',
      d.agente ? '<p><strong>Agente:</strong> ' + d.agente + '</p>' : '',
      '<div class="firma"><div class="firma-box"><p>Firma reservante</p><p>' + (d.reservante ?? '') + '</p></div><div class="firma-box"><p>Sello RE/MAX Parque</p></div></div>',
    ].join('\n'),
  },
  'autorizacion-visita': {
    name: 'Autorizacion de Visita',
    generate: (d) => [
      '<h1>AUTORIZACION DE VISITA</h1><hr/>',
      '<p><strong>' + (d.propietario ?? '') + '</strong> autoriza la visita del inmueble en <strong>' + (d.direccion ?? '') + '</strong> a <strong>' + (d.visitante ?? '') + '</strong>.</p>',
      '<p><strong>Fecha y hora:</strong> ' + (d.fecha ?? '') + '</p>',
      d.agente ? '<p><strong>Agente:</strong> ' + d.agente + '</p>' : '',
      '<div class="firma"><div class="firma-box"><p>Firma propietario</p><p>' + (d.propietario ?? '') + '</p></div><div class="firma-box"><p>Firma visitante</p><p>' + (d.visitante ?? '') + '</p></div></div>',
    ].join('\n'),
  },
  'recibo-alquiler': {
    name: 'Recibo de Alquiler Mensual',
    generate: (d) => [
      '<h1>RECIBO DE ALQUILER</h1>',
      '<p><strong>Periodo:</strong> ' + (d.mes ?? '') + ' | <strong>Fecha de pago:</strong> ' + (d.fecha_pago ?? '') + '</p><hr/>',
      '<p>Se recibe de <strong>' + (d.inquilino ?? '') + '</strong> la suma de <strong>$' + (d.monto ?? '') + '</strong> en concepto de alquiler del periodo <strong>' + (d.mes ?? '') + '</strong> del inmueble en <strong>' + (d.direccion ?? '') + '</strong>.</p>',
      d.agente ? '<p><strong>Agente:</strong> ' + d.agente + '</p>' : '',
      '<div class="firma"><div class="firma-box"><p>Firma propietario</p></div><div class="firma-box"><p>Sello RE/MAX Parque</p></div></div>',
    ].join('\n'),
  },
};

function buildHtml(title: string, body: string): string {
  return '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>' + title + '</title><style>' +
    'body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:20px;color:#1a1a1a;line-height:1.7}' +
    'h1{text-align:center;font-size:20px;letter-spacing:2px;border-bottom:2px solid #0C2749;padding-bottom:12px;color:#0C2749}' +
    'hr{border:none;border-top:1px solid #e5e7eb;margin:16px 0}' +
    'p{margin:8px 0;font-size:14px}' +
    '.firma{display:flex;gap:40px;margin-top:60px}' +
    '.firma-box{flex:1;border-top:1px solid #333;padding-top:8px;text-align:center;font-size:12px;color:#555}' +
    '@media print{body{margin:20mm}.no-print{display:none}}' +
    '</style></head><body>' +
    '<div class="no-print" style="background:#0C2749;color:white;padding:10px 16px;margin-bottom:20px;border-radius:8px;font-family:sans-serif;font-size:13px;">RE/MAX Parque &mdash; ' + title + ' &mdash; <button onclick="window.print()" style="background:#0043ff;color:white;border:none;padding:4px 12px;border-radius:4px;cursor:pointer;margin-left:8px;">Imprimir / Guardar PDF</button></div>' +
    body + '</body></html>';
}

export async function POST(request: Request) {
  try {
    const { template_slug, data } = await request.json();
    const tpl = TEMPLATES[template_slug];
    if (!tpl) return NextResponse.json({ error: 'Template no encontrado.' }, { status: 400 });
    const html = buildHtml(tpl.name, tpl.generate(data ?? {}));
    const filename = template_slug + '-' + new Date().toISOString().slice(0, 10) + '.html';
    return NextResponse.json({ html, filename });
  } catch (e) {
    console.error('generate-doc error:', e);
    return NextResponse.json({ error: 'Error al generar el documento.' }, { status: 500 });
  }
}