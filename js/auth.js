/**
 * ============================================================
 * AUTH.JS — Sistema de Préstamo de Equipos | UAS FIM
 * ============================================================
 * Maneja la lógica completa de autenticación:
 *  - Cambio de rol (Empleado / Alumno·Maestro)
 *  - Validación del formulario
 *  - Autenticación contra localStorage
 *  - Gestión de sesión en sessionStorage
 *  - Redirección según rol
 * ============================================================
 */

// ─── Clave para la sesión activa ─────────────────────────────
const SESSION_KEY = 'uas_session';

// ─── Rutas de redirección por rol ────────────────────────────
const ROUTES = {
  Empleado: 'dashboard_empleado.html',
  Alumno:   'vista_usuario.html',
  Maestro:  'vista_usuario.html',
};

// ─── Estado local de la pantalla de login ────────────────────
const loginState = {
  rolSeleccionado: 'Empleado',   // Valor inicial al cargar
};

// ─── Referencias al DOM ──────────────────────────────────────
const DOM = {
  // Toggles de rol
  btnEmpleado:  () => document.getElementById('toggle-empleado'),
  btnAlumno:    () => document.getElementById('toggle-alumno'),

  // Etiqueta dinámica del campo usuario
  labelUsuario: () => document.getElementById('label-usuario'),

  // Inputs
  inputUsuario:  () => document.getElementById('input-usuario'),
  inputPassword: () => document.getElementById('input-password'),

  // Ícono de mostrar/ocultar contraseña
  btnShowPass: () => document.getElementById('btn-show-pass'),

  // Botón de login
  btnLogin: () => document.getElementById('btn-login'),

  // Contenedor de errores
  errorMsg: () => document.getElementById('error-msg'),

  // Indicador de carga
  spinner: () => document.getElementById('login-spinner'),
};

// ─── Inicialización cuando el DOM está listo ─────────────────
document.addEventListener('DOMContentLoaded', () => {
  verificarSesionExistente();
  bindEventos();
  actualizarUI();
});

/**
 * Si ya existe una sesión activa, redirige directamente
 * sin mostrar el login.
 */
function verificarSesionExistente() {
  try {
    const sesion = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    if (sesion && sesion.userId && sesion.tipo) {
      redirigirPorRol(sesion.tipo);
    }
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

/**
 * Registra todos los listeners de eventos de la página.
 */
function bindEventos() {
  // Toggles de rol
  DOM.btnEmpleado().addEventListener('click', () => cambiarRol('Empleado'));
  DOM.btnAlumno().addEventListener('click',   () => cambiarRol('Alumno'));

  // Login via botón
  DOM.btnLogin().addEventListener('click', manejarLogin);

  // Login via Enter en cualquier input
  DOM.inputUsuario().addEventListener('keydown',  e => { if (e.key === 'Enter') manejarLogin(); });
  DOM.inputPassword().addEventListener('keydown', e => { if (e.key === 'Enter') manejarLogin(); });

  // Mostrar / ocultar contraseña
  DOM.btnShowPass().addEventListener('click', toggleMostrarPassword);

  // Limpiar error al escribir
  DOM.inputUsuario().addEventListener('input', limpiarError);
  DOM.inputPassword().addEventListener('input', limpiarError);
}

/**
 * Cambia el rol seleccionado y actualiza la UI.
 * @param {'Empleado'|'Alumno'} rol
 */
function cambiarRol(rol) {
  loginState.rolSeleccionado = rol;
  actualizarUI();
  DOM.inputUsuario().focus();
  limpiarError();
}

/**
 * Sincroniza los elementos visuales con el estado actual.
 */
function actualizarUI() {
  const esEmpleado = loginState.rolSeleccionado === 'Empleado';

  DOM.btnEmpleado().classList.toggle('active', esEmpleado);
  DOM.btnAlumno().classList.toggle('active', !esEmpleado);

  DOM.labelUsuario().textContent = esEmpleado ? 'Usuario' : 'Matrícula';
  DOM.inputUsuario().placeholder = esEmpleado
    ? 'Ej. admin o mlopez'
    : 'Ej. 2021080001';
}

/**
 * Alterna visibilidad de la contraseña.
 */
function toggleMostrarPassword() {
  const input = DOM.inputPassword();
  const btn   = DOM.btnShowPass();
  const visible = input.type === 'text';

  input.type = visible ? 'password' : 'text';
  btn.innerHTML = visible
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
}

/**
 * Muestra un mensaje de error con animación.
 * @param {string} msg
 */
function mostrarError(msg) {
  const el = DOM.errorMsg();
  el.textContent = msg;
  el.classList.add('visible');
  // Efecto shake en los inputs
  [DOM.inputUsuario(), DOM.inputPassword()].forEach(inp => {
    inp.classList.remove('shake');
    void inp.offsetWidth; // reflow para reiniciar animación
    inp.classList.add('shake');
  });
}

/**
 * Elimina el mensaje de error.
 */
function limpiarError() {
  const el = DOM.errorMsg();
  el.classList.remove('visible');
  el.textContent = '';
  [DOM.inputUsuario(), DOM.inputPassword()].forEach(i => i.classList.remove('shake'));
}

/**
 * Activa / desactiva el estado de carga del botón.
 * @param {boolean} cargando
 */
function setCargando(cargando) {
  const btn = DOM.btnLogin();
  const spinner = DOM.spinner();

  btn.disabled = cargando;
  spinner.style.display = cargando ? 'inline-block' : 'none';
  btn.querySelector('.btn-text').style.opacity = cargando ? '0' : '1';
}

/**
 * Función principal de login.
 * Valida entradas → autentica → crea sesión → redirige.
 */
function manejarLogin() {
  limpiarError();

  const username = DOM.inputUsuario().value.trim();
  const password = DOM.inputPassword().value;
  const rol      = loginState.rolSeleccionado;

  // ── Validación de campos vacíos ──────────────────────────
  if (!username || !password) {
    mostrarError('Por favor, completa todos los campos.');
    return;
  }

  setCargando(true);

  // Simulamos una pequeña demora para feedback visual
  setTimeout(() => {
    const usuario = DB.autenticarUsuario(username, password);

    if (!usuario) {
      setCargando(false);
      mostrarError('Credenciales incorrectas. Verifica tu usuario y contraseña.');
      return;
    }

    // ── Validar que el rol coincida con el toggle ────────────
    // Empleados sólo pueden entrar con toggle "Empleado"
    // Alumnos y Maestros con toggle "Alumno/Maestro"
    const esEmpleadoRol  = usuario.tipo === 'Empleado';
    const toggleEmpleado = rol === 'Empleado';

    if (esEmpleadoRol !== toggleEmpleado) {
      setCargando(false);
      mostrarError(
        esEmpleadoRol
          ? 'Este usuario es un Empleado. Selecciona el rol correcto.'
          : 'Este usuario es un Alumno/Maestro. Selecciona el rol correcto.'
      );
      return;
    }

    // ── Enriquecer datos de sesión ───────────────────────────
    const carrera = usuario.carreraId ? DB.getCarreraById(usuario.carreraId) : null;
    const unidad  = usuario.unidadId  ? DB.getUnidadById(usuario.unidadId)   : null;

    const sesion = {
      userId:    usuario.id,
      nombre:    usuario.nombre,
      username:  usuario.username,
      tipo:      usuario.tipo,
      carrera:   carrera ? carrera.nombre : null,
      unidad:    unidad  ? unidad.nombre  : null,
      grupo:     usuario.grupo,
      loginAt:   new Date().toISOString(),
    };

    // ── Guardar sesión ────────────────────────────────────────
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sesion));

    // ── Redirigir ─────────────────────────────────────────────
    redirigirPorRol(usuario.tipo);

  }, 600); // 600ms de delay intencional para feedback visual
}

/**
 * Redirige al dashboard correcto según el tipo de usuario.
 * @param {string} tipo — 'Empleado' | 'Alumno' | 'Maestro'
 */
function redirigirPorRol(tipo) {
  const destino = ROUTES[tipo] || ROUTES['Alumno'];
  window.location.href = destino;
}

// ─── Utilidad global: cerrar sesión ──────────────────────────
/**
 * Limpia la sesión y vuelve al login.
 * Puede llamarse desde cualquier otra página.
 */
function cerrarSesion() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = 'index.html';
}

/**
 * Obtiene el objeto de sesión actual, o null si no hay sesión.
 * @returns {object|null}
 */
function getSesionActiva() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
}
