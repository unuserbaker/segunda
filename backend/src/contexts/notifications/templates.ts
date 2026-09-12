/**
 * Templates simples versionados en código (sin motor de plantillas externo, string
 * placeholders). No hay requerimiento de editar copy sin release en Mes 1.
 */
type TemplateFn = (vars: Record<string, unknown>) => { subject: string; body: string };

const templates: Record<string, TemplateFn> = {
  appointment_confirmed: (v) => ({
    subject: 'Tu cita fue agendada',
    body: `Tu cita para el vehículo ${v.vehicleId} quedó agendada para ${v.scheduledAt}.`,
  }),
  reminder_24h: (v) => ({
    subject: 'Recordatorio: tu cita es en 24 horas',
    body: `Recuerda tu cita programada para ${v.scheduledAt}. Por favor confirma tu asistencia.`,
  }),
  reminder_2h: (v) => ({
    subject: 'Recordatorio: tu cita es en 2 horas',
    body: `Tu cita es en 2 horas (${v.scheduledAt}).`,
  }),
  rsvp_request: (v) => ({
    subject: 'Confirma tu asistencia',
    body: `Por favor confirma si asistirás a tu cita del ${v.scheduledAt}.`,
  }),
  appointment_closed_link: (v) => ({
    subject: '¿Cómo te fue en tu visita?',
    body: `Cuéntanos si asististe a tu cita: ${v.link}`,
  }),
  sale_cancelled_alternatives: (v) => ({
    subject: 'El vehículo ya fue vendido',
    body: `El vehículo que agendaste ya fue vendido. Aquí tienes alternativas: ${JSON.stringify(v.alternatives)}`,
  }),
};

export function renderTemplate(
  templateKey: string,
  variables: Record<string, unknown>,
): { subject: string; body: string } {
  const fn = templates[templateKey];
  if (!fn) {
    return { subject: templateKey, body: JSON.stringify(variables) };
  }
  return fn(variables);
}
