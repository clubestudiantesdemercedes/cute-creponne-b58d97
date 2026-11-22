/**
 * Dashboard de la temporada — Pileta CAE.
 * Consultas de lectura protegidas por sesión. No modifica datos.
 */

function getDashboardData(token) {
  getSession_(token);
  const today = Utilities.formatDate(new Date(), APP_CONFIG.timezone, 'yyyy-MM-dd');
  const people = readTable_('Personas');
  const permits = readTable_('Permisos');
  const plans = readTable_('Planes');
  const members = readTable_('Socios');
  const sales = readTable_('Ventas');
  const entries = readTable_('Ingresos');

  const peopleById = new Map(people.map(p => [String(p.id), p]));
  const plansById = new Map(plans.map(p => [String(p.id), p]));
  const memberIds = new Set(members
    .filter(m => String(m.estado_socio || '').toLowerCase() === 'activo')
    .map(m => String(m.persona_id)));

  const activePermitPeople = new Set();
  permits.forEach(permit => {
    const status = String(permit.estado || '').toLowerCase();
    const start = dashboardDate_(permit.fecha_desde);
    const end = dashboardDate_(permit.fecha_hasta);
    const person = peopleById.get(String(permit.persona_id));
    if (status === 'anulado' || status === 'anulada' || !person ||
        String(person.estado || '').toLowerCase() !== 'activo') return;
    if (start && end && start <= today && end >= today) {
      activePermitPeople.add(String(person.id));
    }
  });

  const enabledMembers = Array.from(activePermitPeople).filter(id => memberIds.has(id)).length;
  const enabledPeople = activePermitPeople.size;
  const salesToday = sales.filter(s => {
    const status = String(s.estado || '').toLowerCase();
    return status !== 'anulada' && status !== 'anulado' &&
      dashboardDate_(s.creada_en) === today;
  });
  const entriesToday = entries.filter(e => dashboardDate_(e.fecha_hora) === today);
  const revenue = salesToday.reduce((sum, sale) => sum + dashboardNumber_(sale.importe_total), 0);

  const todayDate = new Date(today + 'T12:00:00');
  const fromExpired = dashboardShiftDate_(todayDate, -7);
  const tomorrow = dashboardShiftDate_(todayDate, 1);
  const nextWeek = dashboardShiftDate_(todayDate, 7);
  const groups = { vencidos: [], hoy: [], proximaSemana: [] };

  permits.forEach(permit => {
    const status = String(permit.estado || '').toLowerCase();
    const end = dashboardDate_(permit.fecha_hasta);
    const person = peopleById.get(String(permit.persona_id));
    if (status === 'anulado' || status === 'anulada' || !end || !person ||
        String(person.estado || '').toLowerCase() !== 'activo') return;

    let group = '';
    if (end >= fromExpired && end < today) group = 'vencidos';
    else if (end === today) group = 'hoy';
    else if (end >= tomorrow && end <= nextWeek) group = 'proximaSemana';
    if (!group) return;

    const plan = plansById.get(String(permit.plan_id));
    groups[group].push({
      permitId: String(permit.id || ''),
      personId: String(person.id || ''),
      personName: (String(person.apellido || '') + ', ' + String(person.nombre || '')).trim(),
      planName: String(plan && plan.nombre || 'Plan sin nombre'),
      endDate: end
    });
  });

  Object.keys(groups).forEach(key => groups[key].sort((a,b) =>
    a.endDate.localeCompare(b.endDate) || a.personName.localeCompare(b.personName, 'es')));

  return {
    stats: {
      personasHabilitadas: enabledPeople,
      socios: enabledMembers,
      noSocios: enabledPeople - enabledMembers,
      ventasHoy: salesToday.length,
      ingresosHoy: entriesToday.length,
      recaudacionHoy: revenue
    },
    vencimientos: groups,
    fechaActualizacion: new Date().toISOString()
  };
}

/** Datos del perfil y todos sus permisos no anulados, incluidos los vencidos. */
function getPersonDashboardProfile(token, personId) {
  getSession_(token);
  const person = getPersonById_(personId);
  if (!person) throw new Error('No se encontró la persona solicitada.');
  const plans = new Map(readTable_('Planes').map(p => [String(p.id), p]));
  const permits = readTable_('Permisos')
    .filter(p => String(p.persona_id) === String(personId) &&
      !['anulado', 'anulada'].includes(String(p.estado || '').toLowerCase()))
    .map(p => ({
      id: String(p.id || ''),
      codigo: String(p.codigo || ''),
      fechaDesde: dashboardDate_(p.fecha_desde),
      fechaHasta: dashboardDate_(p.fecha_hasta),
      estado: dashboardPermitStatus_(p, new Date()),
      plan: String((plans.get(String(p.plan_id)) || {}).nombre || 'Plan sin nombre')
    }))
    .sort((a,b) => b.fechaHasta.localeCompare(a.fechaHasta));
  return { person: person, permits: permits };
}

function dashboardDate_(value) {
  if (!value) return '';
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, APP_CONFIG.timezone, 'yyyy-MM-dd');
  }
  const text = String(value).trim();
  const iso = /^(\d{4}-\d{2}-\d{2})/.exec(text);
  if (iso) return iso[1];
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? '' :
    Utilities.formatDate(parsed, APP_CONFIG.timezone, 'yyyy-MM-dd');
}

function dashboardShiftDate_(date, days) {
  const shifted = new Date(date.getTime());
  shifted.setDate(shifted.getDate() + days);
  return Utilities.formatDate(shifted, APP_CONFIG.timezone, 'yyyy-MM-dd');
}

function dashboardNumber_(value) {
  if (typeof value === 'number') return isFinite(value) ? value : 0;
  const parsed = Number(String(value || '').replace(',', '.'));
  return isFinite(parsed) ? parsed : 0;
}

function dashboardPermitStatus_(permit, now) {
  const today = Utilities.formatDate(now, APP_CONFIG.timezone, 'yyyy-MM-dd');
  const start = dashboardDate_(permit.fecha_desde);
  const end = dashboardDate_(permit.fecha_hasta);
  if (end && end < today) return 'Vencido';
  if (start && start > today) return 'Pendiente';
  return 'Vigente';
}
