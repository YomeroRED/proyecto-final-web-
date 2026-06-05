/**
 * ============================================================
 * DATABASE.JS — Sistema de Préstamo de Equipos | UAS FIM
 * ============================================================
 * Inicializa y gestiona los datos semilla en localStorage.
 * Se ejecuta en cada carga de página; sólo inserta los datos
 * si las colecciones no existen previamente (idempotente).
 * ============================================================
 */

const DB = (() => {

  // ─── Claves de almacenamiento ────────────────────────────
  const KEYS = {
    UNIDADES:  'uas_unidades',
    CARRERAS:  'uas_carreras',
    USUARIOS:  'uas_usuarios',
    EQUIPOS:   'uas_equipos',
    PRESTAMOS: 'uas_prestamos',
  };

  // ─── Datos semilla ───────────────────────────────────────

  const SEED_UNIDADES = [
    { id: 'u1', nombre: 'Facultad de Ingeniería Mochis' },
    { id: 'u2', nombre: 'Facultad de Enfermería'        },
    { id: 'u3', nombre: 'Facultad de Medicina'          },
  ];

  const SEED_CARRERAS = [
    // Ingeniería Mochis
    { id: 'c1', nombre: 'Ingeniería en Software',          unidadId: 'u1' },
    { id: 'c2', nombre: 'Ingeniería Civil',                unidadId: 'u1' },
    { id: 'c3', nombre: 'Ingeniería Industrial',           unidadId: 'u1' },
    { id: 'c4', nombre: 'Ingeniería en Sistemas',          unidadId: 'u1' },
    { id: 'c5', nombre: 'Ingeniería Eléctrica',            unidadId: 'u1' },
    // Enfermería
    { id: 'c6', nombre: 'Licenciatura en Enfermería',      unidadId: 'u2' },
    { id: 'c7', nombre: 'Licenciatura en Nutrición',       unidadId: 'u2' },
    // Medicina
    { id: 'c8', nombre: 'Medicina General',                unidadId: 'u3' },
    { id: 'c9', nombre: 'Odontología',                     unidadId: 'u3' },
  ];

  const SEED_USUARIOS = [
    // ── Empleados (administradores del sistema) ──────────
    {
      id:         'emp1',
      nombre:     'Administrador Principal',
      username:   'admin',
      password:   'admin123',          // En producción usar hash
      tipo:       'Empleado',
      carreraId:  null,
      unidadId:   'u1',
      grupo:      null,
      activo:     true,
    },
    {
      id:         'emp2',
      nombre:     'María López Sánchez',
      username:   'mlopez',
      password:   'empleado456',
      tipo:       'Empleado',
      carreraId:  null,
      unidadId:   'u1',
      grupo:      null,
      activo:     true,
    },

    // ── Alumnos ──────────────────────────────────────────
    {
      id:         'alu1',
      nombre:     'Carlos Ramírez Torres',
      username:   '2021080001',        // Matrícula como usuario
      password:   'alumno123',
      tipo:       'Alumno',
      carreraId:  'c1',
      unidadId:   'u1',
      grupo:      '5-A',
      activo:     true,
    },
    {
      id:         'alu2',
      nombre:     'Ana Sofía Beltrán',
      username:   '2020070042',
      password:   'alumno456',
      tipo:       'Alumno',
      carreraId:  'c3',
      unidadId:   'u1',
      grupo:      '7-B',
      activo:     true,
    },
    {
      id:         'alu3',
      nombre:     'Diego Morales Félix',
      username:   '2022090015',
      password:   'alumno789',
      tipo:       'Alumno',
      carreraId:  'c6',
      unidadId:   'u2',
      grupo:      '3-C',
      activo:     true,
    },

    // ── Maestros ─────────────────────────────────────────
    {
      id:         'mae1',
      nombre:     'Dr. Roberto Inzunza Leyva',
      username:   'rinzunza',
      password:   'maestro123',
      tipo:       'Maestro',
      carreraId:  'c1',
      unidadId:   'u1',
      grupo:      null,
      activo:     true,
    },
    {
      id:         'mae2',
      nombre:     'Dra. Lucía Valdez Osuna',
      username:   'lvaldez',
      password:   'maestro456',
      tipo:       'Maestro',
      carreraId:  'c8',
      unidadId:   'u3',
      grupo:      null,
      activo:     true,
    },
  ];

  const SEED_EQUIPOS = [
    // ── Proyectores ──────────────────────────────────────
    {
      id:          'eq01',
      nombre:      'Proyector Epson PowerLite X49',
      categoria:   'Proyector',
      numeroSerie: 'EPS-X49-001',
      descripcion: 'Proyector de video 3600 lúmenes, resolución XGA',
      unidadId:    'u1',
      estado:      'Disponible',        // Disponible | Prestado | Mantenimiento
      imagen:      '📽️',
    },
    {
      id:          'eq02',
      nombre:      'Proyector BenQ MX535',
      categoria:   'Proyector',
      numeroSerie: 'BNQ-MX535-002',
      descripcion: 'Proyector de video 3600 lúmenes, HDMI, VGA',
      unidadId:    'u1',
      estado:      'Disponible',
      imagen:      '📽️',
    },
    {
      id:          'eq03',
      nombre:      'Proyector Cañón para Enfermería',
      categoria:   'Proyector',
      numeroSerie: 'CAN-ENF-003',
      descripcion: 'Proyector portátil para uso en aulas de enfermería',
      unidadId:    'u2',
      estado:      'Disponible',
      imagen:      '📽️',
    },

    // ── Laptops ──────────────────────────────────────────
    {
      id:          'eq04',
      nombre:      'Laptop Dell Inspiron 15',
      categoria:   'Laptop',
      numeroSerie: 'DELL-INS15-001',
      descripcion: 'Intel Core i5, 8GB RAM, 256GB SSD, Windows 11',
      unidadId:    'u1',
      estado:      'Disponible',
      imagen:      '💻',
    },
    {
      id:          'eq05',
      nombre:      'Laptop Dell Latitude 5420',
      categoria:   'Laptop',
      numeroSerie: 'DELL-LAT54-002',
      descripcion: 'Intel Core i7, 16GB RAM, 512GB SSD, Windows 11 Pro',
      unidadId:    'u1',
      estado:      'Disponible',
      imagen:      '💻',
    },
    {
      id:          'eq06',
      nombre:      'Laptop HP ProBook 450',
      categoria:   'Laptop',
      numeroSerie: 'HP-PRO450-003',
      descripcion: 'Intel Core i5, 8GB RAM, 512GB SSD',
      unidadId:    'u1',
      estado:      'Mantenimiento',
      imagen:      '💻',
    },

    // ── Redes ────────────────────────────────────────────
    {
      id:          'eq07',
      nombre:      'Router TP-Link Archer AX73',
      categoria:   'Red',
      numeroSerie: 'TPL-AX73-001',
      descripcion: 'Router inalámbrico Wi-Fi 6, doble banda',
      unidadId:    'u1',
      estado:      'Disponible',
      imagen:      '📡',
    },
    {
      id:          'eq08',
      nombre:      'Switch Cisco SG110-16',
      categoria:   'Red',
      numeroSerie: 'CSC-SG110-002',
      descripcion: 'Switch 16 puertos Gigabit no administrado',
      unidadId:    'u1',
      estado:      'Disponible',
      imagen:      '🔌',
    },

    // ── Periféricos / Otros ───────────────────────────────
    {
      id:          'eq09',
      nombre:      'Pantalla de Proyección Portatil',
      categoria:   'Accesorio',
      numeroSerie: 'PNT-PORT-001',
      descripcion: 'Pantalla 100" enrollable con trípode',
      unidadId:    'u1',
      estado:      'Disponible',
      imagen:      '🖥️',
    },
    {
      id:          'eq10',
      nombre:      'Extensión Multicontacto Profesional',
      categoria:   'Accesorio',
      numeroSerie: 'EXT-MULT-001',
      descripcion: 'Extensión 5m, 6 contactos con protección de sobrecarga',
      unidadId:    'u1',
      estado:      'Disponible',
      imagen:      '🔋',
    },
    {
      id:          'eq11',
      nombre:      'Tablet Samsung Galaxy Tab S6',
      categoria:   'Tablet',
      numeroSerie: 'SAM-TABS6-001',
      descripcion: '10.5", 6GB RAM, 128GB, Android 12',
      unidadId:    'u1',
      estado:      'Disponible',
      imagen:      '📱',
    },
    {
      id:          'eq12',
      nombre:      'Cámara Web Logitech C920',
      categoria:   'Accesorio',
      numeroSerie: 'LOG-C920-001',
      descripcion: 'Webcam Full HD 1080p, micrófono integrado',
      unidadId:    'u1',
      estado:      'Disponible',
      imagen:      '📷',
    },
  ];

  // ─── Métodos de la base de datos ─────────────────────────

  /**
   * Lee una colección del localStorage.
   * @param {string} key - Clave de la colección
   * @returns {Array}
   */
  function getCollection(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  }

  /**
   * Escribe una colección completa en localStorage.
   * @param {string} key
   * @param {Array}  data
   */
  function setCollection(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  /**
   * Inicializa una colección con datos semilla
   * sólo si todavía no existe en localStorage.
   */
  function seedIfEmpty(key, seedData) {
    if (!localStorage.getItem(key)) {
      setCollection(key, seedData);
      console.info(`[DB] Colección "${key}" inicializada con ${seedData.length} registros.`);
    }
  }

  /**
   * Punto de entrada principal.
   * Llama a seedIfEmpty para cada colección.
   */
  function init() {
    seedIfEmpty(KEYS.UNIDADES,  SEED_UNIDADES);
    seedIfEmpty(KEYS.CARRERAS,  SEED_CARRERAS);
    seedIfEmpty(KEYS.USUARIOS,  SEED_USUARIOS);
    seedIfEmpty(KEYS.EQUIPOS,   SEED_EQUIPOS);
    seedIfEmpty(KEYS.PRESTAMOS, []);           // Sin préstamos iniciales
    console.info('[DB] Base de datos lista.');
  }

  // ─── API pública del módulo ───────────────────────────────
  return {
    KEYS,
    init,
    getCollection,
    setCollection,

    // ── Helpers de colecciones específicas ──────────────

    getUnidades:  () => getCollection(KEYS.UNIDADES),
    getCarreras:  () => getCollection(KEYS.CARRERAS),
    getUsuarios:  () => getCollection(KEYS.USUARIOS),
    getEquipos:   () => getCollection(KEYS.EQUIPOS),
    getPrestamos: () => getCollection(KEYS.PRESTAMOS),

    saveUsuarios:  (data) => setCollection(KEYS.USUARIOS,  data),
    saveEquipos:   (data) => setCollection(KEYS.EQUIPOS,   data),
    savePrestamos: (data) => setCollection(KEYS.PRESTAMOS, data),

    /**
     * Busca un usuario por username y contraseña.
     * @param {string} username
     * @param {string} password
     * @returns {object|null}
     */
    autenticarUsuario(username, password) {
      const usuarios = getCollection(KEYS.USUARIOS);
      return usuarios.find(
        u => u.username === username.trim() &&
             u.password === password        &&
             u.activo   === true
      ) || null;
    },

    /**
     * Devuelve la carrera de un usuario.
     * @param {string} carreraId
     * @returns {object|null}
     */
    getCarreraById(carreraId) {
      return getCollection(KEYS.CARRERAS).find(c => c.id === carreraId) || null;
    },

    /**
     * Devuelve la unidad académica de un usuario.
     * @param {string} unidadId
     * @returns {object|null}
     */
    getUnidadById(unidadId) {
      return getCollection(KEYS.UNIDADES).find(u => u.id === unidadId) || null;
    },
  };

})();

// Auto-inicializar al cargar el script
DB.init();
