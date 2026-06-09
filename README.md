# Portal Soporte en Sitio — MVP 2.0
**Corbeta Colombiana de Comercio S.A.**

Aplicación web full-stack para automatizar el diligenciamiento del formato de diagnóstico técnico de computadores. El técnico llena un formulario web → los datos se inyectan en una plantilla Excel → se convierte a PDF con LibreOffice → el técnico descarga o imprime el PDF.

---

## Requisitos Previos

| Requisito | Versión mínima |
|-----------|---------------|
| Node.js   | 18.x o superior |
| npm       | 9.x o superior |
| LibreOffice | 7.x o superior |

### Instalar LibreOffice (Windows)
Descargue e instale desde: https://www.libreoffice.org/download/libreoffice/

El backend busca LibreOffice automáticamente en:
- `C:\Program Files\LibreOffice\program\soffice.exe`
- `C:\Program Files (x86)\LibreOffice\program\soffice.exe`

Si está instalado en otra ruta, cree un archivo `.env` en `/backend/` con:
```
LIBREOFFICE_PATH=C:\ruta\a\soffice.exe
```

---

## Estructura del Proyecto

```
Diagnostico01/
├── frontend/               ← Aplicación React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── DiagnosticoForm.jsx
│   │   │   ├── FirmaCanvas.jsx
│   │   │   ├── HistorialSesion.jsx
│   │   │   ├── PdfPreview.jsx
│   │   │   └── AdminPanel.jsx
│   │   ├── config/
│   │   │   └── usuarios.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── public/
│       └── logos/          ← ⚠ Coloque los logos aquí (ver abajo)
└── backend/
    ├── plantilla/
    │   └── Plantilla_Diagnostico.xlsx  ← Plantilla con marcadores
    ├── tmp/                ← Archivos temporales (auto-gestionado)
    ├── server.js
    └── package.json
```

---

## Instalación y Arranque

### 1. Backend

```bash
cd backend
npm install
node server.js
```

El backend correrá en: `http://localhost:3001`

### 2. Frontend (en otra terminal)

```bash
cd frontend
npm install
npm run dev
```

El frontend correrá en: `http://localhost:5173`

### 3. Abrir en el navegador

Navegue a: **http://localhost:5173**

---

## Credenciales de Acceso (MVP)

| Correo | Contraseña | Rol |
|--------|-----------|-----|
| administrador@corbeta.com | C0rb3t4 | Admin |
| tecnico1@corbeta.com | tecnico1 | Técnico |

---

## Colocar los Logos

Coloque los logos de las marcas en la carpeta `frontend/public/logos/`:

| Archivo | Marca |
|---------|-------|
| `alkomprar.jpg` | Alkomprar |
| `alkosto.jpg` | Alkosto |
| `akt.jpg` | AKT Motos |
| `ktronix.jpg` | Ktronix |
| `corbeta.jpg` | Corbeta |

> Los logos son opcionales para la funcionalidad. La interfaz funciona sin ellos.

---

## Preparación de la Plantilla Excel

Si desea usar su propia plantilla Excel oficial, abra `backend/plantilla/Plantilla_Diagnostico.xlsx` y reemplace el contenido de cada celda amarilla con el marcador correspondiente:

| Celda | Campo | Marcador |
|-------|-------|----------|
| C5 | Sede | `{{sede}}` |
| F5 | Fecha | `{{fecha}}` |
| C7 | Nombre usuario | `{{nombre_usuario}}` |
| F7 | Área del usuario | `{{area_usuario}}` |
| C8 | Cédula usuario | `{{cedula_usuario}}` |
| F8 | Ubicación física | `{{ubicacion_fisica}}` |
| C10 | Marca | `{{marca}}` |
| F10 | Serial | `{{serial}}` |
| C11 | Modelo | `{{modelo}}` |
| F11 | Etiqueta | `{{etiqueta}}` |
| C13 | Procesador | `{{procesador}}` |
| F13 | Versión SO | `{{version_so}}` |
| C14 | RAM | `{{ram}}` |
| F14 | Nombre del equipo | `{{nombre_equipo}}` |
| C15 | Sistema Operativo | `{{sistema_operativo}}` |
| F15 | Versión de Office | `{{version_office}}` |
| C16 | HD | `{{hd}}` |
| F16 | Aplicaciones de mayor uso | `{{aplicaciones_mayor_uso}}` |
| C17 | Apps fuera del estándar | `{{aplicaciones_estandar}}` |
| A19 | Descripción de la falla | `{{descripcion_falla}}` |
| A21 | Acciones realizadas | `{{acciones_realizadas}}` |
| A23 | Diagnóstico final | `{{diagnostico_final}}` |
| B31 | Nombre técnico | `{{nombre_tecnico}}` |
| B32 | Cédula técnico | `{{cedula_tecnico}}` |
| B33 | Cargo técnico | `{{cargo_tecnico}}` |
| A30 | Firma (imagen) | `{{firma}}` |

> **Tip:** La celda con `{{firma}}` debe ser una celda combinada lo suficientemente grande para acomodar la imagen de la firma.

Alternativamente, puede subir su propia plantilla desde el **Panel de Administración** (solo accesible con rol admin).

---

## Flujo de la Aplicación

```
Técnico llena formulario
         ↓
POST /api/generar-pdf
         ↓
Backend: carga plantilla .xlsx
         ↓
xlsx-template inyecta datos y firma
         ↓
LibreOffice convierte a PDF
         ↓
PDF devuelto como binario
         ↓
Frontend muestra previsualización
         ↓
Técnico descarga / imprime
```

---

## Solución de Problemas

**Error: "No se pudo convertir a PDF"**
- Verifique que LibreOffice esté instalado.
- Si está en una ruta no estándar, configure `LIBREOFFICE_PATH` en `backend/.env`.

**Los campos del PDF aparecen en blanco**
- Verifique que la plantilla tenga los marcadores `{{variable}}` exactos en las celdas correctas.
- Use el Panel de Administración para subir una plantilla actualizada.

**Error de CORS**
- Asegúrese de que el backend esté corriendo en `http://localhost:3001`.
- El frontend usa un proxy de Vite para las peticiones a `/api/`.
