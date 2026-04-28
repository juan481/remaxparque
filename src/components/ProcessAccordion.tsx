'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Home as HomeIcon, Flag, Star, CheckSquare, Handshake, ClipboardList, Calculator, Phone, Search, Shield as ShieldIcon, FileText } from 'lucide-react';

interface Step { text: string; }
interface Process { id: string; title: string; badge: string; icon: typeof HomeIcon; steps: Step[]; docs: string[]; }
interface Section { title: string; items: Process[]; }

const BADGE_COLOR: Record<string,string> = { operativo: '#0043ff', administrativo: '#ff1200', legal: '#0C2749' };
const BADGE_BG: Record<string,string> = { operativo: '#EFF6FF', administrativo: '#FEF2F2', legal: '#F1F5F9' };

const SECTIONS: Section[] = [
  { title: 'Operatoria diaria', items: [
    { id: 'alta-prop', title: 'Alta de propiedades', badge: 'operativo', icon: HomeIcon,
      steps: [
        { text: 'Reunir la documentacion de captacion: escritura, cedula catastral, plano y documentos del titular.' },
        { text: 'Verificar datos en el sistema Tokko Broker y cargar la propiedad.' },
        { text: 'Subir fotos profesionales (minimo 10, maxima calidad, sin marcas de agua).' },
        { text: 'Activar en portales: Zonaprop, Argenprop, MercadoLibre.' },
      ],
      docs: ['Checklist documentacion de captacion', 'Formulario de alta de propiedad'],
    },
    { id: 'carteles', title: 'Carteles de venta y alquiler', badge: 'operativo', icon: Flag,
      steps: [
        { text: 'Solicitar cartel al responsable de marketing con al menos 48hs de anticipacion.' },
        { text: 'Confirmar direccion exacta y tipo (venta/alquiler).' },
        { text: 'El cartel se coloca dentro de las 24hs de aprobado.' },
        { text: 'Registrar la colocacion en el sistema.' },
      ],
      docs: ['Formulario de solicitud de cartel'],
    },
    { id: 'destacados', title: 'Destacados en portales', badge: 'operativo', icon: Star,
      steps: [
        { text: 'Identificar la propiedad a destacar y verificar que este activa en portales.' },
        { text: 'Solicitar al staff el upgrade a destacado (costo a cargo del agente o de oficina segun acuerdo).' },
        { text: 'El destacado tiene vigencia de 30 dias. Renovar antes del vencimiento.' },
      ],
      docs: [],
    },
    { id: 'guardias', title: 'Guardias RE/MAX Parque', badge: 'operativo', icon: CheckSquare,
      steps: [
        { text: 'El calendario de guardias se publica el lunes de cada semana.' },
        { text: 'La guardia es de 9:00 a 18:00hs en la oficina asignada.' },
        { text: 'Ante cualquier consulta de un cliente sin agente, el guardia atiende y registra los datos.' },
        { text: 'Completar el reporte de guardia al finalizar la jornada.' },
      ],
      docs: ['Reporte de guardia'],
    },
  ]},
  { title: 'Transacciones y cierre', items: [
    { id: 'reservas', title: 'Reservas, refuerzos y devoluciones', badge: 'operativo', icon: Handshake,
      steps: [
        { text: 'Verificar identidad del comprador (DNI, CUIL) y capacidad economica.' },
        { text: 'Preparar boleto de reserva con datos completos de la propiedad y condiciones.' },
        { text: 'El importe de reserva va a la cuenta de la inmobiliaria hasta cierre.' },
        { text: 'Enviar copia firmada al vendedor y al comprador dentro de las 24hs.' },
        { text: 'Si hay refuerzo: documentarlo como parte de precio y registrar en sistema.' },
      ],
      docs: ['Boleto de reserva', 'Formulario de refuerzo', 'Checklist de cierre'],
    },
    { id: 'gestion-cierre', title: 'Gestion administrativa del cierre', badge: 'operativo', icon: ClipboardList,
      steps: [
        { text: 'Coordinar con escribania los tiempos de escrituracion.' },
        { text: 'Solicitar informe de dominio e inhibicion con al menos 15 dias de anticipacion.' },
        { text: 'Verificar deudas de expensas, ABL, y servicios.' },
        { text: 'Preparar liquidacion de honorarios para cobro el dia de la escritura.' },
        { text: 'Registrar la operacion cerrada en el sistema y en Analytics.' },
      ],
      docs: ['Checklist de cierre', 'Modelo de liquidacion de honorarios'],
    },
  ]},
  { title: 'Administracion', items: [
    { id: 'cuenta-corriente', title: 'Cuenta corriente de oficina', badge: 'administrativo', icon: Calculator,
      steps: [
        { text: 'Los honorarios se liquidان la primera semana de cada mes.' },
        { text: 'Verificar tu estado de cuenta en el sistema antes del dia 5 de cada mes.' },
        { text: 'Los gastos de publicidad y destacados se descuentan de la liquidacion.' },
        { text: 'Ante discrepancias, informar al staff dentro de las 48hs.' },
      ],
      docs: ['Modelo de liquidacion', 'Politica de comisiones'],
    },
    { id: 'contactos', title: 'Contactos utiles y profesionales', badge: 'administrativo', icon: Phone,
      steps: [
        { text: 'Escribano de confianza: coordinar disponibilidad con al menos 30 dias de anticipacion.' },
        { text: 'Banco hipotecario: contactar al asesor asignado a la oficina para pre-aprobaciones.' },
        { text: 'Tasadores: solicitar via el staff con formulario de solicitud de tasacion.' },
      ],
      docs: ['Directorio de contactos profesionales'],
    },
  ]},
  { title: 'Administracion interna', items: [
    { id: 'informes-dominio', title: 'Informes de dominio e inhibicion', badge: 'legal', icon: Search,
      steps: [
        { text: 'Solicitar al staff con nombre completo y DNI del titular del inmueble.' },
        { text: 'El informe tarda 3-5 dias habiles en el Registro de la Propiedad Inmueble.' },
        { text: 'Verificar que el informe no tenga inhibiciones ni gravamenes.' },
        { text: 'Si hay inhibicion: informar inmediatamente al vendedor y al equipo legal.' },
      ],
      docs: ['Formulario de solicitud de informe', 'UIF en oficina'],
    },
    { id: 'uif-oficina', title: 'UIF en oficina', badge: 'legal', icon: ShieldIcon,
      steps: [
        { text: 'Toda operacion mayor a USD 50.000 debe completar el formulario UIF obligatoriamente.' },
        { text: 'Solicitar al cliente DNI, constancia de AFIP y documentacion de fondos.' },
        { text: 'El formulario debe presentarse dentro de los 10 dias habiles del cierre.' },
        { text: 'Guardar una copia en el legajo de la operacion.' },
      ],
      docs: ['Formulario UIF', 'Guia de prevencion de lavado'],
    },
  ]},
];

export default function ProcessAccordion() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {SECTIONS.map(section => (
        <section key={section.title}>
          <h2 className="text-lg font-black mb-4" style={{color:'#0C2749'}}>{section.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {section.items.map(item => {
              const isOpen = openId === item.id;
              const color = BADGE_COLOR[item.badge] ?? '#0043ff';
              const bg = BADGE_BG[item.badge] ?? '#EFF6FF';
              return (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200">
                  <button
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50/50 transition-colors duration-150 gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background: bg}}>
                        <item.icon className="w-5 h-5" style={{color}} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-base leading-tight truncate" style={{color:'#0C2749'}}>{item.title}</p>
                        <span className="inline-block mt-1 text-xs font-bold px-2.5 py-0.5 rounded-full capitalize" style={{background: bg, color}}>{item.badge}</span>
                      </div>
                    </div>
                    {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 border-t border-gray-50 animate-fade-in">
                      <div className="pt-4 space-y-3">
                        {item.steps.map((step, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0 mt-0.5" style={{background: color}}>{i+1}</span>
                            <p className="text-sm text-gray-600 leading-relaxed">{step.text}</p>
                          </div>
                        ))}
                      </div>
                      {item.docs.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-50">
                          <p className="text-xs font-bold text-gray-400 mb-2">Documentos relacionados</p>
                          <div className="flex flex-wrap gap-2">
                            {item.docs.map(doc => (
                              <button key={doc} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-200 hover:opacity-80"
                                style={{background: bg, color}}>
                                <FileText className="w-3.5 h-3.5" /> {doc}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
