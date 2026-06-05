# 🎓 UAS — Sistema de Préstamo de Equipos
### Facultad de Ingeniería Mochis · Centro de Cómputo

---

## Estructura del Proyecto

```
uas-prestamos/
├── index.html              ← Pantalla de login (Fase 1 ✅)
├── style.css               ← Estilos institucionales UAS (Fase 1 ✅)
├── database.js             ← Base de datos en localStorage (Fase 1 ✅)
├── auth.js                 ← Lógica de autenticación (Fase 1 ✅)
├── dashboard_empleado.html ← Panel del Empleado (Fase 2 🔜)
├── vista_usuario.html      ← Portal Alumno/Maestro (Fase 2 🔜)
└── vercel.json             ← Configuración de despliegue
```

---

## Fase 1 — Completada ✅

### Credenciales de prueba

| Rol      | Usuario      | Contraseña   |
|----------|--------------|--------------|
| Empleado | `admin`      | `admin123`   |
| Empleado | `mlopez`     | `empleado456`|
| Alumno   | `2021080001` | `alumno123`  |
| Alumno   | `2020070042` | `alumno456`  |
| Maestro  | `rinzunza`   | `maestro123` |
| Maestro  | `lvaldez`    | `maestro456` |

### Flujo de autenticación
1. El usuario elige su rol con los toggles (Empleado / Alumno·Maestro).
2. Ingresa sus credenciales.
3. Se valida contra `localStorage` (inicializado por `database.js`).
4. Si la autenticación es exitosa, la sesión se guarda en `sessionStorage`.
5. Se redirige al dashboard correspondiente.
6. Las páginas de destino verifican la sesión al cargar; si no existe, redirigen al login.

---

## Tecnologías
- **HTML5** + **CSS3 puro** (sin frameworks)
- **JavaScript ES6+** (módulos IIFE, arrow functions, destructuring)
- **localStorage** — persistencia de datos
- **sessionStorage** — sesión activa

## Despliegue en Vercel
1. Subir los archivos a un repositorio GitHub.
2. Importar el repo en [vercel.com](https://vercel.com).
3. Vercel detectará automáticamente el `vercel.json` y servirá los archivos estáticos.
4. ¡Listo! No se necesita backend.

---

## Fase 2 — Próximos módulos
- [ ] CRUD de equipos (alta, edición, baja lógica)
- [ ] Registro de préstamo con fecha/hora y firma
- [ ] Gestión de devoluciones
- [ ] Historial y reportes por usuario/equipo
- [ ] Panel de administración de usuarios
- [ ] Notificaciones de vencimiento
