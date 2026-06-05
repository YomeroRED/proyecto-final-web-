/**
 * ============================================================
 * REPORTES.JS — Módulo de Reportes | UAS FIM
 * ============================================================
 * Maneja:
 *  - Panel de filtros combinables (fecha, carrera, equipo, tipo)
 *  - Tabla dinámica de resultados
 *  - Contador de registros encontrados
 *  - Exportación / Impresión nativa con @media print
 * ============================================================
 */

// ─── Estado interno del módulo ────────────────────────────────
const Reportes = (() => {

  // Filtros activos
  let _filtros = {
    fechaDesde: '',
    fechaHasta: '',
    carreraId:  '',
    equipoId:   '',
    tipoUsuario: '',
  };

  // ─── Inicialización ─────────────────────────────────────────
  function init() {
    _poblarSelectCarreras();
    _poblarSelectEquipos();
    _attachEventos();
    renderTablaReportes();
  }

  // ─── Poblar select de Carreras ───────────────────────────────
  function _poblarSelectCarreras() {
    const sel = document.getElementById('rep-filtro-carrera');
    if (!sel) return;
    const carreras = DB.getCarreras();
    carreras.forEach(c => {
      const opt = document.createElement('option');
      opt.value       = c.id;
      opt.textContent = c.nombre;
      sel.appendChild(opt);
    });
  }

  // ─── Poblar select de Equipos ────────────────────────────────
  function _poblarSelectEquipos() {
    const sel = document.getElementById('rep-filtro-equipo');
    if (!sel) return;
    const equipos = DB.getEquipos();
    equipos.forEach(e => {
      const opt = document.createElement('option');
      opt.value       = e.id;
      opt.textContent = e.nombre;
      sel.appendChild(opt);
    });
  }

  // ─── Listeners ───────────────────────────────────────────────
  function _attachEventos() {
    const ids = [
      'rep-filtro-desde',
      'rep-filtro-hasta',
      'rep-filtro-carrera',
      'rep-filtro-equipo',
      'rep-filtro-tipo',
    ];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', _onFiltroChange);
    });
  }

  function _onFiltroChange() {
    _filtros.fechaDesde  = document.getElementById('rep-filtro-desde').value;
    _filtros.fechaHasta  = document.getElementById('rep-filtro-hasta').value;
    _filtros.carreraId   = document.getElementById('rep-filtro-carrera').value;
    _filtros.equipoId    = document.getElementById('rep-filtro-equipo').value;
    _filtros.tipoUsuario = document.getElementById('rep-filtro-tipo').value;
    renderTablaReportes();
  }

  // ─── Limpiar filtros ─────────────────────────────────────────
  function limpiarFiltros() {
    _filtros = { fechaDesde: '', fechaHasta: '', carreraId: '', equipoId: '', tipoUsuario: '' };

    document.getElementById('rep-filtro-desde').value   = '';
    document.getElementById('rep-filtro-hasta').value   = '';
    document.getElementById('rep-filtro-carrera').value = '';
    document.getElementById('rep-filtro-equipo').value  = '';
    document.getElementById('rep-filtro-tipo').value    = '';

    renderTablaReportes();
  }

  // ─── Aplicar filtros al arreglo de préstamos ─────────────────
  function _aplicarFiltros(prestamos) {
    return prestamos.filter(p => {

      // ── Rango de fechas (usa fechaSolicitud como referencia) ──
      if (_filtros.fechaDesde) {
        const desde = new Date(_filtros.fechaDesde + 'T00:00:00');
        const fecha = new Date(p.fechaSolicitud);
        if (fecha < desde) return false;
      }
      if (_filtros.fechaHasta) {
        const hasta = new Date(_filtros.fechaHasta + 'T23:59:59');
        const fecha = new Date(p.fechaSolicitud);
        if (fecha > hasta) return false;
      }

      // ── Por equipo ────────────────────────────────────────────
      if (_filtros.equipoId && p.equipoId !== _filtros.equipoId) return false;

      // ── Por carrera (necesita leer el usuario) ────────────────
      if (_filtros.carreraId) {
        const usuarios = DB.getUsuarios();
        const u = usuarios.find(u => u.id === p.usuarioId);
        if (!u || u.carreraId !== _filtros.carreraId) return false;
      }

      // ── Por tipo de usuario ───────────────────────────────────
      if (_filtros.tipoUsuario) {
        const usuarios = DB.getUsuarios();
        const u = usuarios.find(u => u.id === p.usuarioId);
        if (!u || u.tipo !== _filtros.tipoUsuario) return false;
      }

      return true;
    });
  }

  // ─── Render principal de la tabla ────────────────────────────
  function renderTablaReportes() {
    const contenedor = document.getElementById('rep-tabla-container');
    if (!contenedor) return;

    const todos      = DB.getPrestamos();
    const filtrados  = _aplicarFiltros(todos);
    const usuarios   = DB.getUsuarios();
    const carreras   = DB.getCollection(DB.KEYS.CARRERAS);

    // Actualizar contador
    const contador = document.getElementById('rep-contador');
    if (contador) {
      contador.textContent = `Total de registros encontrados: ${filtrados.length}`;
    }

    // Estado vacío
    if (filtrados.length === 0) {
      contenedor.innerHTML = `
        <div class="rep-empty">
          <div class="rep-empty-icon">🔍</div>
          <p>No se encontraron préstamos con los filtros aplicados.</p>
        </div>`;
      return;
    }

    // Ordenar del más reciente al más antiguo
    const ordenados = [...filtrados].sort(
      (a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud)
    );

    const filas = ordenados.map(p => {
      const u          = usuarios.find(u => u.id === p.usuarioId) || {};
      const carrera    = carreras.find(c => c.id === u.carreraId);
      const carreraNom = carrera ? carrera.nombre : (u.tipo === 'Empleado' ? '—' : 'Sin carrera');
      const grupo      = u.grupo  || '—';
      const tipo       = u.tipo   || '—';

      // Badge de estado
      const { cls, texto } = _estadoBadge(p.estado);

      // Fecha principal de referencia
      const fechaStr = _formatFecha(p.fechaSolicitud);

      return `
        <tr>
          <td class="rep-td-fecha">${fechaStr}</td>
          <td><strong>${p.usuario || '—'}</strong></td>
          <td><span class="rep-tipo-badge rep-tipo-${tipo.toLowerCase()}">${tipo}</span></td>
          <td>${carreraNom}</td>
          <td>${grupo}</td>
          <td class="rep-td-equipo">${p.equipo || '—'}</td>
          <td><span class="rep-estado-badge ${cls}">${texto}</span></td>
        </tr>`;
    }).join('');

    contenedor.innerHTML = `
      <div class="tabla-wrapper">
        <table class="rep-tabla" aria-label="Tabla de reporte de préstamos">
          <thead>
            <tr>
              <th>Fecha / Hora</th>
              <th>Nombre del Usuario</th>
              <th>Tipo</th>
              <th>Carrera</th>
              <th>Grupo</th>
              <th>Equipo Solicitado</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
      </div>`;
  }

  // ─── Helpers ─────────────────────────────────────────────────
  function _estadoBadge(estado) {
    const mapa = {
      'Devuelto':  { cls: 'rep-estado--devuelto',  texto: 'Devuelto'  },
      'Activo':    { cls: 'rep-estado--activo',     texto: 'Activo'    },
      'Pendiente': { cls: 'rep-estado--pendiente',  texto: 'Pendiente' },
      'Rechazado': { cls: 'rep-estado--rechazado',  texto: 'Rechazado' },
    };
    return mapa[estado] || { cls: 'rep-estado--pendiente', texto: estado || '—' };
  }

  function _formatFecha(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', {
      day:   '2-digit',
      month: '2-digit',
      year:  '2-digit',
    }) + ' ' + d.toLocaleTimeString('es-MX', {
      hour:   '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  // ─── Imprimir ─────────────────────────────────────────────────
  function imprimirReporte() {
    window.print();
  }

  // ─── API pública ──────────────────────────────────────────────
  return { init, limpiarFiltros, renderTablaReportes, imprimirReporte };

})();
