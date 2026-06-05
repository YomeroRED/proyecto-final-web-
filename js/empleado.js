/**
 * ============================================================
 * EMPLEADO.JS — Dashboard del Empleado | UAS FIM
 * ============================================================
 * Maneja:
 *  - Validación y carga de sesión
 *  - Navegación por pestañas (tabs)
 *  - Pestaña 1: Solicitudes Pendientes (Aprobar / Rechazar)
 *  - Pestaña 2: Bitácora de Préstamos Activos (Registrar Entrega)
 *  - Reloj en tiempo real
 *  - Modal de confirmación
 *  - Toast de feedback
 * ============================================================
 */

// ─── Sesión ───────────────────────────────────────────────────
let sesion = null;

(function init() {
  // 1. Validar sesión
  try {
    sesion = JSON.parse(sessionStorage.getItem('uas_session') || 'null');
  } catch { sesion = null; }

  if (!sesion || sesion.tipo !== 'Empleado') {
    window.location.href = 'index.html';
    return;
  }

  // 2. Poblar datos del empleado en el UI
  document.getElementById('nav-nombre').textContent  = sesion.nombre.split(' ')[0];
  document.getElementById('sidebar-name').textContent = sesion.nombre;
  document.getElementById('sidebar-avatar').textContent =
    sesion.nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();

  // 3. Reloj
  actualizarReloj();
  setInterval(actualizarReloj, 1000);

  // 4. Renderizar tab inicial
  renderPendientes();
  renderBitacora();

})();

// ─── Reloj ────────────────────────────────────────────────────
function actualizarReloj() {
  const ahora = new Date();
  const hora  = ahora.toLocaleTimeString('es-MX', { hour12: false });
  const fecha = ahora.toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  const relojEl = document.getElementById('reloj');
  const fechaEl = document.getElementById('fecha-hoy');
  if (relojEl) relojEl.textContent = hora;
  if (fechaEl) fechaEl.textContent = fecha.charAt(0).toUpperCase() + fecha.slice(1);
}

// ─── Navegación por tabs ──────────────────────────────────────
function cambiarTab(tabId, btnEl) {
  // Desactivar todos
  document.querySelectorAll('.emp-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.emp-nav-item').forEach(b => b.classList.remove('active'));

  // Activar el seleccionado
  document.getElementById('tab-' + tabId).classList.add('active');
  btnEl.classList.add('active');

  // Re-renderizar según tab
  if (tabId === 'pendientes') renderPendientes();
  if (tabId === 'bitacora')   renderBitacora();
}

// ─── Helpers de datos ─────────────────────────────────────────
function getPrestamos() { return DB.getPrestamos();  }
function getEquipos()   { return DB.getEquipos();    }
function getUsuarios()  { return DB.getUsuarios();   }
function getCarreras()  { return DB.getCollection(DB.KEYS.CARRERAS); }

function getUsuarioPorId(id) {
  return getUsuarios().find(u => u.id === id) || null;
}

function getEquipoPorId(id) {
  return getEquipos().find(e => e.id === id) || null;
}

function getCarreraPorId(id) {
  return getCarreras().find(c => c.id === id) || null;
}

function formatFecha(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' })
    + ' ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function tiempoTranscurrido(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 1)   return 'Hace unos segundos';
  if (min < 60)  return `Hace ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24)  return `Hace ${hrs} h`;
  return `Hace ${Math.floor(hrs / 24)} día(s)`;
}

// ─── Actualizar badges del nav ────────────────────────────────
function actualizarBadges() {
  const pendientes = getPrestamos().filter(p => p.estado === 'Pendiente').length;
  const activos    = getPrestamos().filter(p => p.estado === 'Activo').length;

  const bP = document.getElementById('badge-pendientes');
  const bA = document.getElementById('badge-activos');

  if (bP) {
    bP.textContent = pendientes || '';
    bP.style.display = pendientes ? '' : 'none';
  }
  if (bA) {
    bA.textContent = activos || '';
    bA.style.display = activos ? '' : 'none';
  }
}

// ════════════════════════════════════════════════════════════
// PESTAÑA 1 — Solicitudes Pendientes
// ════════════════════════════════════════════════════════════

function renderPendientes() {
  const contenedor = document.getElementById('lista-pendientes');
  if (!contenedor) return;

  const pendientes = getPrestamos().filter(p => p.estado === 'Pendiente');
  actualizarBadges();

  if (pendientes.length === 0) {
    contenedor.innerHTML = `
      <div class="emp-empty">
        <span class="emp-empty-icon">✅</span>
        <h3>No hay solicitudes pendientes</h3>
        <p>Todas las solicitudes han sido atendidas.</p>
      </div>`;
    return;
  }

  const items = pendientes.map((p, i) => {
    const usuario = getUsuarioPorId(p.usuarioId);
    const equipo  = getEquipoPorId(p.equipoId);
    const carrera = usuario?.carreraId ? getCarreraPorId(usuario.carreraId) : null;

    const nombreUsuario = usuario?.nombre    || p.usuario  || 'Usuario desconocido';
    const tipoUsuario   = usuario?.tipo      || 'Alumno';
    const carreraNombre = carrera?.nombre    || '—';
    const grupo         = usuario?.grupo     || '—';
    const equipoNombre  = equipo?.nombre     || p.equipo   || 'Equipo desconocido';
    const equipoIcon    = equipo?.imagen     || '💻';

    return `
      <div class="solicitud-card" id="solicitud-${p.id}" style="animation-delay:${i * 0.05}s">
        <div class="solicitud-urgente"></div>
        <div class="solicitud-equipo-icon">${equipoIcon}</div>
        <div class="solicitud-datos">
          <div class="solicitud-equipo-nombre">${equipoNombre}</div>
          <div class="solicitud-meta">
            <span><strong>${nombreUsuario}</strong></span>
            <span>${tipoUsuario}</span>
            ${carreraNombre !== '—' ? `<span>${carreraNombre}</span>` : ''}
            ${grupo !== '—' ? `<span>Grupo ${grupo}</span>` : ''}
          </div>
          <div class="solicitud-tiempo">
            🕐 ${tiempoTranscurrido(p.fechaSolicitud)}
            &nbsp;·&nbsp; ${formatFecha(p.fechaSolicitud)}
          </div>
        </div>
        <div class="solicitud-acciones">
          <button class="btn-aprobar"
            onclick="confirmarAccion('aprobar', '${p.id}', '${equipoNombre.replace(/'/g, "\\'")}', '${nombreUsuario.replace(/'/g, "\\'")}')">
            ✓ Aprobar
          </button>
          <button class="btn-rechazar"
            onclick="confirmarAccion('rechazar', '${p.id}', '${equipoNombre.replace(/'/g, "\\'")}', '${nombreUsuario.replace(/'/g, "\\'")}')">
            ✕ Rechazar
          </button>
        </div>
      </div>`;
  }).join('');

  contenedor.innerHTML = `<div class="solicitudes-lista">${items}</div>`;
}

// ════════════════════════════════════════════════════════════
// PESTAÑA 2 — Bitácora de Préstamos Activos
// ════════════════════════════════════════════════════════════

function renderBitacora() {
  const wrapper = document.getElementById('wrapper-bitacora');
  if (!wrapper) return;

  const activos = getPrestamos().filter(p => p.estado === 'Activo');
  actualizarBadges();

  if (activos.length === 0) {
    wrapper.innerHTML = `
      <div class="emp-empty">
        <span class="emp-empty-icon">📖</span>
        <h3>Bitácora vacía</h3>
        <p>No hay equipos en préstamo en este momento.</p>
      </div>`;
    return;
  }

  const filas = activos.map(p => {
    const usuario = getUsuarioPorId(p.usuarioId);
    const carrera = usuario?.carreraId ? getCarreraPorId(usuario.carreraId) : null;

    const nombre  = usuario?.nombre || p.usuario || '—';
    const tipo    = usuario?.tipo   || 'Alumno';
    const carreraNombre = carrera?.nombre || '—';
    const grupo   = usuario?.grupo  || '—';
    const equipo  = p.equipo        || '—';
    const horaSal = formatFecha(p.fechaPrestamo || p.fechaSolicitud);

    const tipoClass = tipo === 'Maestro' ? 'tipo-badge--maestro' : 'tipo-badge--alumno';
    const tipoAbr   = tipo === 'Maestro' ? 'P' : 'A';   // P = Profesor, A = Alumno

    return `
      <tr id="fila-${p.id}">
        <td><strong>${nombre}</strong></td>
        <td><span class="tipo-badge ${tipoClass}">${tipoAbr}</span></td>
        <td>${carreraNombre}</td>
        <td>${grupo}</td>
        <td class="equipo-cell">${equipo}</td>
        <td class="hora-cell">${horaSal}</td>
        <td>
          <button class="btn-devolver"
            onclick="confirmarAccion('devolver', '${p.id}', '${equipo.replace(/'/g, "\\'")}', '${nombre.replace(/'/g, "\\'")}')">
            📥 Registrar Entrega
          </button>
        </td>
      </tr>`;
  }).join('');

  wrapper.innerHTML = `
    <table class="tabla-bitacora" aria-label="Bitácora de préstamos activos">
      <thead>
        <tr>
          <th>Nombre Usuario</th>
          <th>Tipo</th>
          <th>Carrera</th>
          <th>Grupo</th>
          <th>Equipo</th>
          <th>Fecha y Hora Salida</th>
          <th>Acción</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>`;
}

// ════════════════════════════════════════════════════════════
// LÓGICA DE ACCIONES (Aprobar / Rechazar / Devolver)
// ════════════════════════════════════════════════════════════

/**
 * Abre modal de confirmación antes de ejecutar la acción.
 */
function confirmarAccion(tipo, prestamoId, equipoNombre, usuarioNombre) {
  const cfg = {
    aprobar: {
      icon:    '✅',
      titulo:  '¿Entregar equipo?',
      texto:   `Se marcará como <strong>Activo</strong> y el equipo <em>${equipoNombre}</em> quedará registrado en préstamo a <em>${usuarioNombre}</em>.`,
      btnText: '✓ Aprobar y Entregar',
      clase:   'success',
      fn:      () => aprobarPrestamo(prestamoId),
    },
    rechazar: {
      icon:    '🚫',
      titulo:  '¿Rechazar solicitud?',
      texto:   `Se cancelará la solicitud de <em>${usuarioNombre}</em> para el equipo <em>${equipoNombre}</em> y quedará disponible nuevamente.`,
      btnText: '✕ Rechazar',
      clase:   'danger',
      fn:      () => rechazarPrestamo(prestamoId),
    },
    devolver: {
      icon:    '📥',
      titulo:  '¿Registrar devolución?',
      texto:   `Se confirmará la entrega de <em>${equipoNombre}</em> por parte de <em>${usuarioNombre}</em> y el equipo quedará disponible.`,
      btnText: '📥 Registrar Entrega',
      clase:   '',
      fn:      () => registrarDevolucion(prestamoId),
    },
  };

  const c = cfg[tipo];
  document.getElementById('modal-icon').textContent    = c.icon;
  document.getElementById('modal-titulo').textContent  = c.titulo;
  document.getElementById('modal-texto').innerHTML     = c.texto;

  const confirmBtn = document.getElementById('modal-confirm-btn');
  confirmBtn.textContent = c.btnText;
  confirmBtn.className   = 'modal-btn-confirm ' + c.clase;
  confirmBtn.onclick     = () => { cerrarModal(); c.fn(); };

  abrirModal();
}

function abrirModal() {
  document.getElementById('modal-overlay').classList.add('visible');
}

function cerrarModal() {
  document.getElementById('modal-overlay').classList.remove('visible');
}

// ── Aprobar préstamo ──────────────────────────────────────────
function aprobarPrestamo(prestamoId) {
  const prestamos = getPrestamos();
  const idx = prestamos.findIndex(p => p.id === prestamoId);
  if (idx === -1) return;

  const prestamo = prestamos[idx];

  // 1. Actualizar préstamo → Activo
  prestamos[idx].estado        = 'Activo';
  prestamos[idx].fechaPrestamo = new Date().toISOString();
  DB.savePrestamos(prestamos);

  // 2. Actualizar equipo → Prestado
  const equipos = getEquipos();
  const eqIdx   = equipos.findIndex(e => e.id === prestamo.equipoId);
  if (eqIdx !== -1) {
    equipos[eqIdx].estado = 'Prestado';
    DB.saveEquipos(equipos);
  }

  // 3. Refrescar vistas y notificar
  renderPendientes();
  renderBitacora();
  mostrarToast('✅', '¡Préstamo registrado!',
    `Equipo entregado a ${prestamo.usuario}. Hora: ${new Date().toLocaleTimeString('es-MX', { hour12: false })}`);
}

// ── Rechazar préstamo ─────────────────────────────────────────
function rechazarPrestamo(prestamoId) {
  const prestamos = getPrestamos();
  const idx = prestamos.findIndex(p => p.id === prestamoId);
  if (idx === -1) return;

  const prestamo = prestamos[idx];

  // 1. Actualizar préstamo → Rechazado
  prestamos[idx].estado         = 'Rechazado';
  prestamos[idx].fechaRechazo   = new Date().toISOString();
  DB.savePrestamos(prestamos);

  // 2. Devolver equipo → Disponible
  const equipos = getEquipos();
  const eqIdx   = equipos.findIndex(e => e.id === prestamo.equipoId);
  if (eqIdx !== -1) {
    equipos[eqIdx].estado = 'Disponible';
    DB.saveEquipos(equipos);
  }

  // 3. Refrescar y notificar
  renderPendientes();
  renderBitacora();
  mostrarToast('🚫', 'Solicitud rechazada',
    `La solicitud de ${prestamo.usuario} fue cancelada.`, 'var(--error)');
}

// ── Registrar devolución ──────────────────────────────────────
function registrarDevolucion(prestamoId) {
  const prestamos = getPrestamos();
  const idx = prestamos.findIndex(p => p.id === prestamoId);
  if (idx === -1) return;

  const prestamo = prestamos[idx];

  // 1. Actualizar préstamo → Devuelto
  prestamos[idx].estado          = 'Devuelto';
  prestamos[idx].fechaDevolucion = new Date().toISOString();
  DB.savePrestamos(prestamos);

  // 2. Devolver equipo → Disponible
  const equipos = getEquipos();
  const eqIdx   = equipos.findIndex(e => e.id === prestamo.equipoId);
  if (eqIdx !== -1) {
    equipos[eqIdx].estado = 'Disponible';
    DB.saveEquipos(equipos);
  }

  // 3. Refrescar y notificar
  renderBitacora();
  renderPendientes();
  mostrarToast('📥', 'Devolución registrada',
    `${prestamo.equipo} devuelto. Hora: ${new Date().toLocaleTimeString('es-MX', { hour12: false })}`);
}

// ════════════════════════════════════════════════════════════
// TOAST
// ════════════════════════════════════════════════════════════
let _toastTimer = null;

function mostrarToast(icono, titulo, msg, accentColor) {
  const toast  = document.getElementById('toast');
  const border = accentColor || 'var(--verde)';
  toast.style.borderLeftColor = border;

  document.getElementById('toast-icon').textContent   = icono;
  document.getElementById('toast-titulo').textContent = titulo;
  document.getElementById('toast-msg').textContent    = msg;

  toast.classList.add('visible');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove('visible'), 4500);
}

// ── Cerrar sesión ─────────────────────────────────────────────
function cerrarSesion() {
  sessionStorage.removeItem('uas_session');
  window.location.href = 'index.html';
}
