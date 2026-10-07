# PROGRESS — Nutrivid

Archivo de seguimiento de tareas. Actualizar a medida que se completen.

---

## Completado ✅

- [x] Exploración inicial del proyecto y análisis de código
- [x] Creación del PRD con objetivos y prioridades
- [x] Creación de este archivo de progreso
- [x] Número de WhatsApp movido a la variable de entorno WHATSAPP_NUMBER (ver .env.example)
- [x] Firebase Auth y Firestore habilitados en consola Firebase
- [x] Actualizar firebase.js con Auth + operaciones de escritura (addDoc, updateDoc, deleteDoc)
- [x] Conectar script.js a Firestore — productos se cargan dinámicamente (eliminado array hardcodeado)
- [x] Validación del nombre del cliente antes de enviar pedido por WhatsApp
- [x] Crear admin.html — panel con login, tabla de productos, modal de creación/edición/borrado *(reemplazado más adelante por el panel Django en `/panel/`, ver notas abajo)*
- [x] Agregar type="module" a script tags en index.html y catalogo.html
- [x] Migración completa a Django: modelos `Producto`/`Categoria`, API pública (`/api/productos/`, `/api/categorias/`), catálogo servido desde Django ORM/SQLite, panel de administración propio en `/panel/` (login, dashboard, CRUD de productos y categorías, activar/desactivar)
- [x] Eliminación de Firebase del repositorio (`firebase.js`, `admin.html`) — Django es ahora la única fuente de datos y el único sistema de administración
- [x] Configuración desde variables de entorno (`.env.example`) y estáticos con WhiteNoise (funciona con `DEBUG=False`)
- [x] Frontend público en templates de Django (base común) y JavaScript en módulos ES
- [x] Rediseño de la tienda (dirección "Granel"): CSS por partes con tokens, modo oscuro, fotos recortadas
- [x] Modal de detalle de producto, indicador de stock por sucursal, notas y confirmación del pedido, ordenamiento
- [x] Imágenes en WebP (recortes de producto y fotos subidas desde el panel)
- [x] README con instalación, producción y herramientas

---

## En progreso 🔄

_(ninguna tarea en curso)_

---

## Pendiente 📋

### Crítico (Must Have)
_(completado — ver "Migración completa a Django" y "Eliminación de Firebase" arriba)_

### Importante (Should Have)
_(completado — ver arriba)_

### Deseable (Could Have)
- [ ] Analítica básica para rastrear pedidos y búsquedas
- [ ] Service Worker para funcionalidad básica offline (PWA)
- [ ] Meta tags SEO y Open Graph para compartir en redes

---

## Notas y Decisiones

| Fecha      | Nota |
|------------|------|
| 2026-06-02 | Análisis inicial completado. Stack: HTML + CSS + Vanilla JS + Firebase sin integrar. 28 productos hardcodeados. |
| 2026-06-02 | PRD creado. Prioridad máxima: Firestore + admin panel + modularización. |
| 2026-06-02 | Firebase completamente integrado. Productos ahora vienen de Firestore. admin.html operativo. |
| 2026-08-19 | Migración completa a Django: modelos, API pública y panel de administración propio en `/panel/`, probados y aprobados. |
| 2026-08-19 | Firebase eliminado del repositorio (`firebase.js`, `admin.html`). Django queda como única fuente de datos y único sistema de administración. |
| 2026-10-07 | Rediseño del frontend público en la rama `rediseno-front`: templates de Django, módulos ES, dirección visual "Granel" y prioridades de UX del PRD. Backend, API y panel sin cambios salvo la conversión a WebP de las fotos subidas. |
| 2026-10-07 | `media/` deja de versionarse: `importar_productos` la regenera desde `static/tienda/img/productos/`. |
