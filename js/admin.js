/**
 * ============================================================
 * ADMIN.JS — Módulo de Administración (Fase 4) | UAS FIM
 * ============================================================
 * CRUDs completos para:
 *   1. Unidades Académicas
 *   2. Carreras
 *   3. Usuarios  (Alumnos / Maestros / Empleados)
 *   4. Equipos
 *
 * Todas las operaciones leen y escriben directamente sobre
 * localStorage a través de la API pública de DB (database.js).
 * ============================================================
 */

'use strict';

/* ══════════════════════════════════════════════════════════
   NAVEGACIÓN DE SUB-TABS
══════════════════════════════════════════════════════════ */

function cambiarSubTab(subTabId, btnEl) {
  document.querySelectorAll('.adm-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.adm-subtab').forEach(b => b.classList.remove('active'));
  document.getElementById('admpanel-' + subTabId).classList.add('active');
  btnEl.classList.add('active');

  // Renderizar la tabla del panel recién activado
  const renders = {
    unidades:  renderTablaUnidades,
    carreras:  renderTablaCarreras,
    usuarios:  renderTablaUsuarios,
    equipos:   renderTablaEquipos,
  };
  if (renders[subTabId]) renders[subTabId]();
}

/* ══════════════════════════════════════════════════════════
   UTILIDADES COMPARTIDAS
══════════════════════════════════════════════════════════ */

/** Genera un ID único simple tipo "u4", "c10", "eq13", etc. */
function generarId(prefijo, coleccion) {
  if (!coleccion.length) return prefijo + '1';
  const nums = coleccion
    .map(item => parseInt(item.id.replace(/\D/g, ''), 10))
    .filter(n => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return prefijo + (max + 1);
}

/** Muestra / oculta un campo de error en el formulario */
function setFieldError(fieldId, msg) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  const wrap = field.closest('.adm-field');
  const errEl = wrap ? wrap.querySelector('.field-error') : null;
  if (msg) {
    field.classList.add('error');
    if (wrap) wrap.classList.add('has-error');
    if (errEl) errEl.textContent = msg;
  } else {
    field.classList.remove('error');
    if (wrap) wrap.classList.remove('has-error');
    if (errEl) errEl.textContent = '';
  }
}

/** Limpia todos los errores de un contenedor */
function limpiarErrores(containerId) {
  const c = document.getElementById(containerId);
  if (!c) return;
  c.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  c.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
  c.querySelectorAll('.field-error').forEach(el => el.textContent = '');
}

/** Cierra el formulario inline de un contenedor */
function cerrarForm(containerId) {
  const c = document.getElementById(containerId);
  if (c) c.innerHTML = '';
}

/* ══════════════════════════════════════════════════════════
   1. UNIDADES ACADÉMICAS
══════════════════════════════════════════════════════════ */

function renderTablaUnidades() {
  const unidades = DB.getUnidades();
  const el = document.getElementById('tabla-unidades');
  const count = document.getElementById('count-unidades');
  if (count) count.textContent = `${unidades.length} registro${unidades.length !== 1 ? 's' : ''}`;

  if (!unidades.length) {
    el.innerHTML = `<div class="emp-empty"><span class="emp-empty-icon">🏛️</span><h3>Sin unidades registradas</h3></div>`;
    return;
  }

  const filas = unidades.map(u => `
    <tr id="row-u-${u.id}">
      <td class="muted" style="font-family:monospace;font-size:0.76rem;">${u.id}</td>
      <td><strong>${u.nombre}</strong></td>
      <td>
        <div class="td-acciones">
          <button class="btn-tbl-edit" onclick="abrirFormUnidad('${u.id}')">✏️ Editar</button>
          <button class="btn-tbl-del"  onclick="eliminarUnidad('${u.id}')">🗑 Eliminar</button>
        </div>
      </td>
    </tr>`).join('');

  el.innerHTML = `
    <table class="crud-table">
      <thead><tr>
        <th style="width:80px">ID</th>
        <th>Nombre de la Unidad</th>
        <th style="width:160px">Acciones</th>
      </tr></thead>
      <tbody>${filas}</tbody>
    </table>`;
}

function abrirFormUnidad(idEditar = null) {
  limpiarErrores('form-unidad-container');
  const unidades = DB.getUnidades();
  const obj = idEditar ? unidades.find(u => u.id === idEditar) : null;
  const titulo = obj ? `✏️ Editar Unidad — ${obj.nombre}` : '＋ Nueva Unidad Académica';

  document.getElementById('form-unidad-container').innerHTML = `
    <div class="adm-form-card">
      <div class="adm-form-title">${titulo}</div>
      <div class="adm-form-grid">
        <div class="adm-field">
          <label for="fu-nombre">Nombre de la Unidad *</label>
          <input id="fu-nombre" type="text" placeholder="Ej. Facultad de Ingeniería Mochis"
                 value="${obj ? obj.nombre : ''}" maxlength="120" />
          <span class="field-error"></span>
        </div>
      </div>
      <div class="adm-form-footer">
        <button class="btn-form-cancel" onclick="cerrarForm('form-unidad-container')">Cancelar</button>
        <button class="btn-form-save"   onclick="guardarUnidad('${idEditar || ''}')">
          ${obj ? '💾 Guardar cambios' : '＋ Crear Unidad'}
        </button>
      </div>
    </div>`;
  document.getElementById('fu-nombre').focus();
}

function guardarUnidad(idEditar) {
  limpiarErrores('form-unidad-container');
  const nombre = document.getElementById('fu-nombre').value.trim();
  let valido = true;

  if (!nombre) { setFieldError('fu-nombre', 'El nombre es obligatorio.'); valido = false; }

  if (!valido) return;

  const unidades = DB.getUnidades();

  if (idEditar) {
    const idx = unidades.findIndex(u => u.id === idEditar);
    if (idx !== -1) unidades[idx].nombre = nombre;
  } else {
    unidades.push({ id: generarId('u', unidades), nombre });
  }

  DB.setCollection(DB.KEYS.UNIDADES, unidades);
  cerrarForm('form-unidad-container');
  renderTablaUnidades();
  mostrarToast('🏛️', idEditar ? 'Unidad actualizada' : 'Unidad creada', nombre);
}

function eliminarUnidad(id) {
  const unidades = DB.getUnidades();
  const u = unidades.find(x => x.id === id);
  // Verificar si tiene carreras asociadas
  const carreras = DB.getCarreras();
  const enUso = carreras.filter(c => c.unidadId === id);

  confirmarAccion(
    'danger',
    '🗑 ¿Eliminar unidad?',
    enUso.length
      ? `La unidad <em>${u?.nombre}</em> tiene <strong>${enUso.length} carrera(s)</strong> asociadas. ¿Deseas eliminarla de todas formas?`
      : `Se eliminará la unidad <em>${u?.nombre}</em> permanentemente.`,
    '🗑 Eliminar',
    () => {
      const nuevas = DB.getUnidades().filter(x => x.id !== id);
      DB.setCollection(DB.KEYS.UNIDADES, nuevas);
      renderTablaUnidades();
      mostrarToast('🗑', 'Unidad eliminada', u?.nombre || id, 'var(--error)');
    }
  );
}

/* ══════════════════════════════════════════════════════════
   2. CARRERAS
══════════════════════════════════════════════════════════ */

function renderTablaCarreras() {
  const carreras = DB.getCarreras();
  const unidades = DB.getUnidades();
  const el = document.getElementById('tabla-carreras');
  const count = document.getElementById('count-carreras');
  if (count) count.textContent = `${carreras.length} registro${carreras.length !== 1 ? 's' : ''}`;

  if (!carreras.length) {
    el.innerHTML = `<div class="emp-empty"><span class="emp-empty-icon">🎓</span><h3>Sin carreras registradas</h3></div>`;
    return;
  }

  const filas = carreras.map(c => {
    const u = unidades.find(x => x.id === c.unidadId);
    return `
      <tr id="row-c-${c.id}">
        <td class="muted" style="font-family:monospace;font-size:0.76rem;">${c.id}</td>
        <td><strong>${c.nombre}</strong></td>
        <td>${u ? u.nombre : `<span class="muted">${c.unidadId}</span>`}</td>
        <td>
          <div class="td-acciones">
            <button class="btn-tbl-edit" onclick="abrirFormCarrera('${c.id}')">✏️ Editar</button>
            <button class="btn-tbl-del"  onclick="eliminarCarrera('${c.id}')">🗑 Eliminar</button>
          </div>
        </td>
      </tr>`;
  }).join('');

  el.innerHTML = `
    <table class="crud-table">
      <thead><tr>
        <th style="width:70px">ID</th>
        <th>Nombre de la Carrera</th>
        <th>Unidad Académica</th>
        <th style="width:160px">Acciones</th>
      </tr></thead>
      <tbody>${filas}</tbody>
    </table>`;
}

function abrirFormCarrera(idEditar = null) {
  limpiarErrores('form-carrera-container');
  const carreras = DB.getCarreras();
  const unidades = DB.getUnidades();
  const obj = idEditar ? carreras.find(c => c.id === idEditar) : null;
  const titulo = obj ? `✏️ Editar Carrera — ${obj.nombre}` : '＋ Nueva Carrera';

  const optsUnidad = unidades.map(u =>
    `<option value="${u.id}" ${obj && obj.unidadId === u.id ? 'selected' : ''}>${u.nombre}</option>`
  ).join('');

  document.getElementById('form-carrera-container').innerHTML = `
    <div class="adm-form-card">
      <div class="adm-form-title">${titulo}</div>
      <div class="adm-form-grid">
        <div class="adm-field">
          <label for="fc-nombre">Nombre de la Carrera *</label>
          <input id="fc-nombre" type="text" placeholder="Ej. Ingeniería en Software"
                 value="${obj ? obj.nombre : ''}" maxlength="120" />
          <span class="field-error"></span>
        </div>
        <div class="adm-field">
          <label for="fc-unidad">Unidad Académica *</label>
          <select id="fc-unidad">
            <option value="">— Selecciona una unidad —</option>
            ${optsUnidad}
          </select>
          <span class="field-error"></span>
        </div>
      </div>
      <div class="adm-form-footer">
        <button class="btn-form-cancel" onclick="cerrarForm('form-carrera-container')">Cancelar</button>
        <button class="btn-form-save"   onclick="guardarCarrera('${idEditar || ''}')">
          ${obj ? '💾 Guardar cambios' : '＋ Crear Carrera'}
        </button>
      </div>
    </div>`;
  document.getElementById('fc-nombre').focus();
}

function guardarCarrera(idEditar) {
  limpiarErrores('form-carrera-container');
  const nombre   = document.getElementById('fc-nombre').value.trim();
  const unidadId = document.getElementById('fc-unidad').value;
  let valido = true;

  if (!nombre)   { setFieldError('fc-nombre',  'El nombre es obligatorio.'); valido = false; }
  if (!unidadId) { setFieldError('fc-unidad',  'Selecciona una unidad.'); valido = false; }
  if (!valido) return;

  const carreras = DB.getCarreras();
  if (idEditar) {
    const idx = carreras.findIndex(c => c.id === idEditar);
    if (idx !== -1) { carreras[idx].nombre = nombre; carreras[idx].unidadId = unidadId; }
  } else {
    carreras.push({ id: generarId('c', carreras), nombre, unidadId });
  }

  DB.setCollection(DB.KEYS.CARRERAS, carreras);
  cerrarForm('form-carrera-container');
  renderTablaCarreras();
  mostrarToast('🎓', idEditar ? 'Carrera actualizada' : 'Carrera creada', nombre);
}

function eliminarCarrera(id) {
  const carreras = DB.getCarreras();
  const c = carreras.find(x => x.id === id);
  confirmarAccion(
    'danger',
    '🗑 ¿Eliminar carrera?',
    `Se eliminará la carrera <em>${c?.nombre}</em> permanentemente.`,
    '🗑 Eliminar',
    () => {
      DB.setCollection(DB.KEYS.CARRERAS, DB.getCarreras().filter(x => x.id !== id));
      renderTablaCarreras();
      mostrarToast('🗑', 'Carrera eliminada', c?.nombre || id, 'var(--error)');
    }
  );
}

/* ══════════════════════════════════════════════════════════
   3. USUARIOS
══════════════════════════════════════════════════════════ */

function renderTablaUsuarios() {
  const usuarios = DB.getUsuarios();
  const carreras = DB.getCarreras();
  const el = document.getElementById('tabla-usuarios');
  const count = document.getElementById('count-usuarios');
  if (count) count.textContent = `${usuarios.length} registro${usuarios.length !== 1 ? 's' : ''}`;

  if (!usuarios.length) {
    el.innerHTML = `<div class="emp-empty"><span class="emp-empty-icon">👥</span><h3>Sin usuarios registrados</h3></div>`;
    return;
  }

  const filas = usuarios.map(u => {
    const car = u.carreraId ? carreras.find(c => c.id === u.carreraId) : null;
    const tipoLow = u.tipo.toLowerCase();
    return `
      <tr id="row-usr-${u.id}">
        <td style="font-family:monospace;font-size:0.78rem;">${u.username}</td>
        <td><strong>${u.nombre}</strong></td>
        <td><span class="user-tipo-chip user-tipo-chip--${tipoLow}">${u.tipo}</span></td>
        <td class="muted">${car ? car.nombre : (u.tipo === 'Empleado' ? '—' : `<span style="color:var(--error);font-size:0.72rem">Sin carrera</span>`)}</td>
        <td class="muted">${u.grupo || '—'}</td>
        <td>
          <div class="td-acciones">
            <button class="btn-tbl-edit" onclick="abrirFormUsuario('${u.id}')">✏️ Editar</button>
            <button class="btn-tbl-del"  onclick="eliminarUsuario('${u.id}')">🗑 Eliminar</button>
          </div>
        </td>
      </tr>`;
  }).join('');

  el.innerHTML = `
    <table class="crud-table">
      <thead><tr>
        <th>Matrícula / Usuario</th>
        <th>Nombre Completo</th>
        <th>Tipo</th>
        <th>Carrera</th>
        <th>Grupo</th>
        <th style="width:160px">Acciones</th>
      </tr></thead>
      <tbody>${filas}</tbody>
    </table>`;
}

function abrirFormUsuario(idEditar = null) {
  limpiarErrores('form-usuario-container');
  const usuarios = DB.getUsuarios();
  const unidades = DB.getUnidades();
  const carreras = DB.getCarreras();
  const obj = idEditar ? usuarios.find(u => u.id === idEditar) : null;
  const titulo = obj ? `✏️ Editar Usuario — ${obj.nombre}` : '＋ Nuevo Usuario';

  const optsUnidad = unidades.map(u =>
    `<option value="${u.id}" ${obj && obj.unidadId === u.id ? 'selected' : ''}>${u.nombre}</option>`
  ).join('');

  // Carreras filtradas por unidad seleccionada (o todas si edición)
  const unidadInit = obj?.unidadId || '';
  const carrerasFiltradas = unidadInit
    ? carreras.filter(c => c.unidadId === unidadInit)
    : carreras;

  const optsCarrera = carrerasFiltradas.map(c =>
    `<option value="${c.id}" ${obj && obj.carreraId === c.id ? 'selected' : ''}>${c.nombre}</option>`
  ).join('');

  const tipoVal = obj?.tipo || 'Alumno';
  const mostrarCarrera = tipoVal !== 'Empleado';
  const mostrarGrupo   = tipoVal === 'Alumno';

  document.getElementById('form-usuario-container').innerHTML = `
    <div class="adm-form-card">
      <div class="adm-form-title">${titulo}</div>
      <div class="adm-form-grid">
        <div class="adm-field">
          <label for="fusr-username">Matrícula / Usuario *</label>
          <input id="fusr-username" type="text" placeholder="Ej. 2021080001 o mlopez"
                 value="${obj ? obj.username : ''}" maxlength="40" />
          <span class="field-error"></span>
        </div>
        <div class="adm-field">
          <label for="fusr-nombre">Nombre Completo *</label>
          <input id="fusr-nombre" type="text" placeholder="Ej. Carlos Ramírez Torres"
                 value="${obj ? obj.nombre : ''}" maxlength="100" />
          <span class="field-error"></span>
        </div>
        <div class="adm-field">
          <label for="fusr-tipo">Tipo de Usuario *</label>
          <select id="fusr-tipo" onchange="onTipoUsuarioChange()">
            <option value="Alumno"   ${tipoVal === 'Alumno'   ? 'selected' : ''}>Alumno</option>
            <option value="Maestro"  ${tipoVal === 'Maestro'  ? 'selected' : ''}>Maestro</option>
            <option value="Empleado" ${tipoVal === 'Empleado' ? 'selected' : ''}>Empleado</option>
          </select>
          <span class="field-error"></span>
        </div>
        <div class="adm-field">
          <label for="fusr-unidad">Unidad Académica *</label>
          <select id="fusr-unidad" onchange="onUnidadUsuarioChange()">
            <option value="">— Selecciona —</option>
            ${optsUnidad}
          </select>
          <span class="field-error"></span>
        </div>
        <div class="adm-field" id="fusr-carrera-wrap" style="${mostrarCarrera ? '' : 'display:none'}">
          <label for="fusr-carrera">Carrera</label>
          <select id="fusr-carrera">
            <option value="">— Selecciona carrera —</option>
            ${optsCarrera}
          </select>
          <span class="field-error"></span>
        </div>
        <div class="adm-field" id="fusr-grupo-wrap" style="${mostrarGrupo ? '' : 'display:none'}">
          <label for="fusr-grupo">Grupo</label>
          <input id="fusr-grupo" type="text" placeholder="Ej. 5-A"
                 value="${obj?.grupo || ''}" maxlength="10" />
          <span class="field-error"></span>
        </div>
        <div class="adm-field">
          <label for="fusr-password">Contraseña ${obj ? '(dejar vacío = sin cambios)' : '*'}</label>
          <input id="fusr-password" type="text" placeholder="${obj ? '••••••' : 'Contraseña'}"
                 maxlength="50" autocomplete="new-password" />
          <span class="field-error"></span>
        </div>
      </div>
      <div class="adm-form-footer">
        <button class="btn-form-cancel" onclick="cerrarForm('form-usuario-container')">Cancelar</button>
        <button class="btn-form-save"   onclick="guardarUsuario('${idEditar || ''}')">
          ${obj ? '💾 Guardar cambios' : '＋ Crear Usuario'}
        </button>
      </div>
    </div>`;
}

/** Muestra/oculta campos según el tipo seleccionado */
function onTipoUsuarioChange() {
  const tipo = document.getElementById('fusr-tipo')?.value;
  const carreraWrap = document.getElementById('fusr-carrera-wrap');
  const grupoWrap   = document.getElementById('fusr-grupo-wrap');
  if (carreraWrap) carreraWrap.style.display = tipo === 'Empleado' ? 'none' : '';
  if (grupoWrap)   grupoWrap.style.display   = tipo === 'Alumno'   ? '' : 'none';
}

/** Filtra las carreras cuando cambia la unidad seleccionada */
function onUnidadUsuarioChange() {
  const unidadId = document.getElementById('fusr-unidad')?.value;
  const sel = document.getElementById('fusr-carrera');
  if (!sel) return;

  const carreras = DB.getCarreras().filter(c => !unidadId || c.unidadId === unidadId);
  sel.innerHTML = '<option value="">— Selecciona carrera —</option>' +
    carreras.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
}

function guardarUsuario(idEditar) {
  limpiarErrores('form-usuario-container');
  const username  = document.getElementById('fusr-username').value.trim();
  const nombre    = document.getElementById('fusr-nombre').value.trim();
  const tipo      = document.getElementById('fusr-tipo').value;
  const unidadId  = document.getElementById('fusr-unidad').value;
  const carreraId = document.getElementById('fusr-carrera')?.value || null;
  const grupo     = document.getElementById('fusr-grupo')?.value.trim() || null;
  const password  = document.getElementById('fusr-password').value;

  let valido = true;
  if (!username) { setFieldError('fusr-username', 'La matrícula/usuario es obligatorio.'); valido = false; }
  if (!nombre)   { setFieldError('fusr-nombre',   'El nombre es obligatorio.'); valido = false; }
  if (!unidadId) { setFieldError('fusr-unidad',   'Selecciona una unidad.'); valido = false; }
  if (!idEditar && !password) { setFieldError('fusr-password', 'La contraseña es obligatoria.'); valido = false; }
  if (!valido) return;

  const usuarios = DB.getUsuarios();

  // Verificar username único
  const duplicado = usuarios.find(u => u.username === username && u.id !== idEditar);
  if (duplicado) { setFieldError('fusr-username', 'Ya existe un usuario con esa matrícula.'); return; }

  if (idEditar) {
    const idx = usuarios.findIndex(u => u.id === idEditar);
    if (idx !== -1) {
      usuarios[idx].username  = username;
      usuarios[idx].nombre    = nombre;
      usuarios[idx].tipo      = tipo;
      usuarios[idx].unidadId  = unidadId;
      usuarios[idx].carreraId = tipo !== 'Empleado' ? (carreraId || null) : null;
      usuarios[idx].grupo     = tipo === 'Alumno' ? (grupo || null) : null;
      if (password) usuarios[idx].password = password;
    }
  } else {
    usuarios.push({
      id:         generarId('usr', usuarios),
      username,
      nombre,
      tipo,
      unidadId,
      carreraId:  tipo !== 'Empleado' ? (carreraId || null) : null,
      grupo:      tipo === 'Alumno' ? (grupo || null) : null,
      password,
      activo:     true,
    });
  }

  DB.saveUsuarios(usuarios);
  cerrarForm('form-usuario-container');
  renderTablaUsuarios();
  mostrarToast('👤', idEditar ? 'Usuario actualizado' : 'Usuario creado', `${nombre} · ${tipo}`);
}

function eliminarUsuario(id) {
  const usuarios = DB.getUsuarios();
  const u = usuarios.find(x => x.id === id);

  // Verificar si tiene préstamos activos
  const prestamos = DB.getPrestamos();
  const tieneActivo = prestamos.some(p => p.usuarioId === id && p.estado === 'Activo');

  if (tieneActivo) {
    mostrarToast('⚠️', 'No se puede eliminar', `${u?.nombre} tiene un préstamo activo.`, '#D97706');
    return;
  }

  confirmarAccion(
    'danger',
    '🗑 ¿Eliminar usuario?',
    `Se eliminará el usuario <em>${u?.nombre}</em> (${u?.username}) permanentemente.`,
    '🗑 Eliminar',
    () => {
      DB.saveUsuarios(DB.getUsuarios().filter(x => x.id !== id));
      renderTablaUsuarios();
      mostrarToast('🗑', 'Usuario eliminado', u?.nombre || id, 'var(--error)');
    }
  );
}

/* ══════════════════════════════════════════════════════════
   4. EQUIPOS
══════════════════════════════════════════════════════════ */

const ESTADOS_BLOQUEADOS = ['Prestado', 'Solicitado'];

function renderTablaEquipos() {
  const equipos = DB.getEquipos();
  const el = document.getElementById('tabla-equipos');
  const count = document.getElementById('count-equipos');
  if (count) count.textContent = `${equipos.length} registro${equipos.length !== 1 ? 's' : ''}`;

  if (!equipos.length) {
    el.innerHTML = `<div class="emp-empty"><span class="emp-empty-icon">💻</span><h3>Sin equipos registrados</h3></div>`;
    return;
  }

  const filas = equipos.map(eq => {
    const bloqueado = ESTADOS_BLOQUEADOS.includes(eq.estado);
    const estadoLow = eq.estado.toLowerCase();
    const editBtn = bloqueado
      ? `<button class="btn-tbl-edit" disabled title="Equipo en uso — no editable"
           style="opacity:0.4;cursor:not-allowed;">✏️ Editar</button>`
      : `<button class="btn-tbl-edit" onclick="abrirFormEquipo('${eq.id}')">✏️ Editar</button>`;
    const delBtn = bloqueado
      ? `<button class="btn-tbl-del" disabled title="Equipo en uso — no eliminable">🗑 Eliminar</button>`
      : `<button class="btn-tbl-del" onclick="eliminarEquipo('${eq.id}')">🗑 Eliminar</button>`;

    return `
      <tr id="row-eq-${eq.id}">
        <td style="font-family:monospace;font-size:0.76rem;">${eq.numeroSerie || eq.id}</td>
        <td>
          <span style="font-size:1.2rem;margin-right:0.4rem;">${eq.imagen || '💻'}</span>
          <strong>${eq.nombre}</strong>
        </td>
        <td class="muted">${eq.categoria || '—'}</td>
        <td>
          <span class="equipo-estado-chip equipo-estado-chip--${estadoLow}">
            ${eq.estado}
          </span>
          ${bloqueado ? `<span class="adm-warn-inline" style="margin-left:0.4rem;">⚠️ En uso</span>` : ''}
        </td>
        <td>
          <div class="td-acciones">
            ${editBtn}
            ${delBtn}
          </div>
        </td>
      </tr>`;
  }).join('');

  el.innerHTML = `
    <table class="crud-table">
      <thead><tr>
        <th>N° Serie / ID</th>
        <th>Nombre del Equipo</th>
        <th>Categoría</th>
        <th>Estado</th>
        <th style="width:170px">Acciones</th>
      </tr></thead>
      <tbody>${filas}</tbody>
    </table>`;
}

function abrirFormEquipo(idEditar = null) {
  limpiarErrores('form-equipo-container');
  const equipos = DB.getEquipos();
  const obj = idEditar ? equipos.find(e => e.id === idEditar) : null;
  const titulo = obj ? `✏️ Editar Equipo — ${obj.nombre}` : '＋ Nuevo Equipo';

  const CATEGORIAS = ['Proyector', 'Laptop', 'Red', 'Tablet', 'Accesorio', 'Otro'];
  const EMOJIS = { Proyector:'📽️', Laptop:'💻', Red:'📡', Tablet:'📱', Accesorio:'🔌', Otro:'📦' };

  const optsCategoria = CATEGORIAS.map(cat =>
    `<option value="${cat}" ${obj && obj.categoria === cat ? 'selected' : ''}>${cat}</option>`
  ).join('');

  document.getElementById('form-equipo-container').innerHTML = `
    <div class="adm-form-card">
      <div class="adm-form-title">${titulo}</div>
      <div class="adm-form-grid">
        <div class="adm-field">
          <label for="feq-nombre">Nombre del Equipo *</label>
          <input id="feq-nombre" type="text" placeholder="Ej. Proyector Epson PowerLite"
                 value="${obj ? obj.nombre : ''}" maxlength="100" />
          <span class="field-error"></span>
        </div>
        <div class="adm-field">
          <label for="feq-serie">Número de Serie *</label>
          <input id="feq-serie" type="text" placeholder="Ej. EPS-X49-001"
                 value="${obj ? obj.numeroSerie : ''}" maxlength="60" />
          <span class="field-error"></span>
        </div>
        <div class="adm-field">
          <label for="feq-categoria">Categoría *</label>
          <select id="feq-categoria" onchange="onCategoriaChange()">
            <option value="">— Selecciona —</option>
            ${optsCategoria}
          </select>
          <span class="field-error"></span>
        </div>
        <div class="adm-field">
          <label for="feq-estado">Estado *</label>
          <select id="feq-estado">
            <option value="Disponible"    ${obj?.estado === 'Disponible'    ? 'selected' : ''}>Disponible</option>
            <option value="Mantenimiento" ${obj?.estado === 'Mantenimiento' ? 'selected' : ''}>Mantenimiento</option>
          </select>
          <span class="field-error"></span>
        </div>
        <div class="adm-field" style="grid-column:1/-1">
          <label for="feq-descripcion">Descripción</label>
          <input id="feq-descripcion" type="text" placeholder="Especificaciones del equipo"
                 value="${obj ? obj.descripcion : ''}" maxlength="200" />
        </div>
      </div>
      <div class="adm-form-footer">
        <button class="btn-form-cancel" onclick="cerrarForm('form-equipo-container')">Cancelar</button>
        <button class="btn-form-save"   onclick="guardarEquipo('${idEditar || ''}')">
          ${obj ? '💾 Guardar cambios' : '＋ Agregar Equipo'}
        </button>
      </div>
    </div>`;
  document.getElementById('feq-nombre').focus();
}

function onCategoriaChange() {
  // Reservado para lógica futura (ej. autocompletar emoji)
}

function guardarEquipo(idEditar) {
  limpiarErrores('form-equipo-container');
  const nombre      = document.getElementById('feq-nombre').value.trim();
  const numeroSerie = document.getElementById('feq-serie').value.trim();
  const categoria   = document.getElementById('feq-categoria').value;
  const estado      = document.getElementById('feq-estado').value;
  const descripcion = document.getElementById('feq-descripcion').value.trim();

  const EMOJIS = { Proyector:'📽️', Laptop:'💻', Red:'📡', Tablet:'📱', Accesorio:'🔌', Otro:'📦' };
  let valido = true;

  if (!nombre)      { setFieldError('feq-nombre',    'El nombre es obligatorio.');      valido = false; }
  if (!numeroSerie) { setFieldError('feq-serie',     'El número de serie es obligatorio.'); valido = false; }
  if (!categoria)   { setFieldError('feq-categoria', 'Selecciona una categoría.');       valido = false; }
  if (!valido) return;

  // Verificar número de serie único
  const equipos = DB.getEquipos();
  const dupSerie = equipos.find(e => e.numeroSerie === numeroSerie && e.id !== idEditar);
  if (dupSerie) { setFieldError('feq-serie', 'Ya existe un equipo con ese número de serie.'); return; }

  if (idEditar) {
    const idx = equipos.findIndex(e => e.id === idEditar);
    if (idx !== -1) {
      equipos[idx].nombre      = nombre;
      equipos[idx].numeroSerie = numeroSerie;
      equipos[idx].categoria   = categoria;
      equipos[idx].estado      = estado;
      equipos[idx].descripcion = descripcion;
      equipos[idx].imagen      = EMOJIS[categoria] || '💻';
    }
  } else {
    const unidades = DB.getUnidades();
    equipos.push({
      id:          generarId('eq', equipos),
      nombre,
      numeroSerie,
      categoria,
      descripcion,
      estado,
      unidadId:    unidades[0]?.id || 'u1',
      imagen:      EMOJIS[categoria] || '💻',
    });
  }

  DB.saveEquipos(equipos);
  cerrarForm('form-equipo-container');
  renderTablaEquipos();
  mostrarToast('💻', idEditar ? 'Equipo actualizado' : 'Equipo agregado', nombre);
}

function eliminarEquipo(id) {
  const equipos = DB.getEquipos();
  const eq = equipos.find(e => e.id === id);

  if (ESTADOS_BLOQUEADOS.includes(eq?.estado)) {
    mostrarToast('⚠️', 'No se puede eliminar', `El equipo está actualmente ${eq.estado}.`, '#D97706');
    return;
  }

  confirmarAccion(
    'danger',
    '🗑 ¿Eliminar equipo?',
    `Se eliminará <em>${eq?.nombre}</em> del inventario permanentemente.`,
    '🗑 Eliminar',
    () => {
      DB.saveEquipos(DB.getEquipos().filter(e => e.id !== id));
      renderTablaEquipos();
      mostrarToast('🗑', 'Equipo eliminado', eq?.nombre || id, 'var(--error)');
    }
  );
}

/* ══════════════════════════════════════════════════════════
   HOOK — Inicializar sub-tab de Admón. cuando se abre
══════════════════════════════════════════════════════════ */

// Sobrescribir cambiarTab para inicializar admin al entrar
const _cambiarTabOrig = typeof cambiarTab === 'function' ? cambiarTab : null;
if (_cambiarTabOrig) {
  window.cambiarTab = function(tabId, btnEl) {
    _cambiarTabOrig(tabId, btnEl);
    if (tabId === 'administracion') {
      // Renderizar el sub-tab activo actual
      const subActivo = document.querySelector('.adm-subtab.active');
      const subId = subActivo ? subActivo.dataset.subtab : 'unidades';
      const renders = {
        unidades: renderTablaUnidades,
        carreras: renderTablaCarreras,
        usuarios: renderTablaUsuarios,
        equipos:  renderTablaEquipos,
      };
      if (renders[subId]) renders[subId]();
    }
  };
}

