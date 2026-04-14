// ─── Cost calculation ──────────────────────────────────────────────────────────
const COSTO_KM = {
    TORTON: 18,
    RABON: 14,
    VAN: 10,
    PICKUP: 8,
    PLATAFORMA: 20,
};
export function calcularCostoSolicitud(sol, cfg) {
    const totalEtiq = sol.etiquetasPieza * sol.cantidad + sol.etiquetasColectivo;
    const costoMat = totalEtiq * cfg.costoEtiqueta +
        sol.tarimas * cfg.costoTarima +
        sol.papeletas * cfg.costoPapeleta +
        (sol.cajaColectiva ? cfg.costoCajaColectiva : 0) +
        (sol.playo ? cfg.costoPlayo * 10 : 0) +
        (sol.poliBurbuja ? cfg.costoPoliBurbuja * 10 : 0);
    const costoRuta = (sol.distanciaKm || 0) * (COSTO_KM[sol.tipoTransporte || ''] || 0);
    return Math.round((costoMat + costoRuta) * 100) / 100;
}
// ─── Formatting ───────────────────────────────────────────────────────────────
export function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
}
export function formatDate(date) {
    return new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(date));
}
export function formatDateTime(date) {
    return new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}
export function formatRelativeTime(date) {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);
    if (diffMin < 1)
        return 'hace un momento';
    if (diffMin < 60)
        return `hace ${diffMin}m`;
    if (diffHrs < 24)
        return `hace ${diffHrs}h`;
    if (diffDays < 7)
        return `hace ${diffDays}d`;
    return formatDate(date);
}
export function formatTiempo(minutos) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    if (h === 0)
        return `${m} min`;
    if (m === 0)
        return `${h}h`;
    return `${h}h ${m}min`;
}
// ─── Status helpers ────────────────────────────────────────────────────────────
export const ESTADO_SOL_LABEL = {
    PENDIENTE: 'Pendiente',
    ASIGNADA: 'Asignada',
    EN_RUTA: 'En Ruta',
    COMPLETADA: 'Completada',
    RECHAZADA: 'Rechazada',
    INCIDENCIA: 'Incidencia',
};
export const ESTADO_COND_LABEL = {
    DISPONIBLE: 'Disponible',
    EN_RUTA: 'En Ruta',
    INACTIVO: 'Inactivo',
};
export const TIPO_SOL_LABEL = {
    DISTRIBUCION: 'Distribución',
    RECOLECCION: 'Recolección',
    TRANSFERENCIA: 'Transferencia',
    ULTIMA_MILLA: 'Última Milla',
};
export const TIPO_VEH_LABEL = {
    TORTON: 'Tórtón',
    RABON: 'Rabón',
    VAN: 'Van',
    PICKUP: 'Pick-up',
    PLATAFORMA: 'Plataforma',
};
// ─── OT generator ─────────────────────────────────────────────────────────────
export function generateOT() {
    const now = new Date();
    const y = now.getFullYear().toString().slice(-2);
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
    return `OT-${y}${m}${d}-${rand}`;
}
