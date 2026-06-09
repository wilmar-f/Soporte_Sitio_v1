'use strict';

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const XlsxTemplate = require('xlsx-template');

const app = express();
const PORT = 3001;

// ─── CORS ──────────────────────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json({ limit: '10mb' }));

// ─── RUTAS DE DIRECTORIOS ──────────────────────────────────────────────────
const PLANTILLA_DIR  = path.join(__dirname, 'plantilla');
const PLANTILLA_PATH = path.join(PLANTILLA_DIR, 'Plantilla_Diagnostico.xlsx');
const TMP_DIR        = path.join(__dirname, 'tmp');

// Crea los directorios si no existen
[PLANTILLA_DIR, TMP_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ─── BUSCAR LIBREOFFICE EN WINDOWS ────────────────────────────────────────
function getLibreOfficePath() {
  // 1. Variable de entorno (mayor prioridad)
  if (process.env.LIBREOFFICE_PATH) return process.env.LIBREOFFICE_PATH;

  // 2. Rutas comunes en Windows
  const windowsPaths = [
    'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files\\LibreOffice 7\\program\\soffice.exe',
    'C:\\Program Files\\LibreOffice 6\\program\\soffice.exe',
  ];
  for (const p of windowsPaths) {
    if (fs.existsSync(p)) return `"${p}"`;
  }

  // 3. Intentar con el comando global (Linux/Mac o PATH configurado)
  return 'soffice';
}

// ─── GENERAR PLANTILLA DE EJEMPLO SI NO EXISTE ────────────────────────────
function ensurePlantilla() {
  if (fs.existsSync(PLANTILLA_PATH)) return;

  console.log('⚠️  Plantilla no encontrada. Creando plantilla de ejemplo con marcadores...');
  try {
    // Usamos exceljs si está disponible, sino creamos un stub
    const ExcelJS = require('exceljs');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Diagnostico');

    // Estilos corporativos básicos
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3A5C' } };
    const headerFont = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
    const labelFill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD966' } };
    const thinBorder = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    };

    // Configurar anchos de columna
    ws.columns = [
      { width: 4 },  // A
      { width: 18 }, // B
      { width: 25 }, // C
      { width: 4 },  // D
      { width: 18 }, // E
      { width: 25 }, // F
      { width: 4 },  // G
    ];

    // ── Fila 1: Título principal
    ws.mergeCells('A1:G1');
    ws.getCell('A1').value = 'CORBETA COLOMBIANA DE COMERCIO S.A.';
    ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getCell('A1').fill = headerFill;
    ws.getCell('A1').font = { ...headerFont, size: 13 };
    ws.getRow(1).height = 22;

    // ── Fila 2: Subtítulo
    ws.mergeCells('A2:G2');
    ws.getCell('A2').value = 'DIAGNÓSTICO TÉCNICO DE EQUIPO';
    ws.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getCell('A2').fill = headerFill;
    ws.getCell('A2').font = { ...headerFont, size: 11 };
    ws.getRow(2).height = 18;

    // ── Fila 3: Versión
    ws.mergeCells('A3:G3');
    ws.getCell('A3').value = 'Versión 2.0';
    ws.getCell('A3').alignment = { horizontal: 'right', vertical: 'middle' };
    ws.getRow(3).height = 14;

    // ── Fila 4: Separador
    ws.getRow(4).height = 6;

    // ── Fila 5: SEDE | FECHA
    ws.getCell('B5').value = 'SEDE:';
    ws.getCell('B5').font = { bold: true };
    ws.getCell('C5').value = '{{sede}}';
    ws.getCell('C5').fill = labelFill;
    ws.getCell('C5').border = thinBorder;
    ws.getCell('E5').value = 'FECHA:';
    ws.getCell('E5').font = { bold: true };
    ws.getCell('F5').value = '{{fecha}}';
    ws.getCell('F5').fill = labelFill;
    ws.getCell('F5').border = thinBorder;

    // ── Fila 6: Separador sección usuario
    ws.mergeCells('A6:G6');
    ws.getCell('A6').value = 'DATOS DEL USUARIO';
    ws.getCell('A6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB8CCE4' } };
    ws.getCell('A6').font = { bold: true };
    ws.getCell('A6').alignment = { horizontal: 'center' };

    // ── Fila 7: Nombre | Área
    ws.getCell('B7').value = 'Nombre:';  ws.getCell('B7').font = { bold: true };
    ws.getCell('C7').value = '{{nombre_usuario}}'; ws.getCell('C7').fill = labelFill; ws.getCell('C7').border = thinBorder;
    ws.getCell('E7').value = 'Área:';    ws.getCell('E7').font = { bold: true };
    ws.getCell('F7').value = '{{area_usuario}}';   ws.getCell('F7').fill = labelFill; ws.getCell('F7').border = thinBorder;

    // ── Fila 8: Cédula | Ubicación
    ws.getCell('B8').value = 'Cédula:';   ws.getCell('B8').font = { bold: true };
    ws.getCell('C8').value = '{{cedula_usuario}}'; ws.getCell('C8').fill = labelFill; ws.getCell('C8').border = thinBorder;
    ws.getCell('E8').value = 'Ubicación:'; ws.getCell('E8').font = { bold: true };
    ws.getCell('F8').value = '{{ubicacion_fisica}}'; ws.getCell('F8').fill = labelFill; ws.getCell('F8').border = thinBorder;

    // ── Fila 9: Separador sección equipo
    ws.getRow(9).height = 6;
    ws.mergeCells('A9:G9');
    ws.getCell('A9').value = 'DATOS DEL EQUIPO';
    ws.getCell('A9').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB8CCE4' } };
    ws.getCell('A9').font = { bold: true };
    ws.getCell('A9').alignment = { horizontal: 'center' };

    // ── Fila 10: Marca | Serial
    ws.getCell('B10').value = 'Marca:';   ws.getCell('B10').font = { bold: true };
    ws.getCell('C10').value = '{{marca}}'; ws.getCell('C10').fill = labelFill; ws.getCell('C10').border = thinBorder;
    ws.getCell('E10').value = 'Serial:';  ws.getCell('E10').font = { bold: true };
    ws.getCell('F10').value = '{{serial}}'; ws.getCell('F10').fill = labelFill; ws.getCell('F10').border = thinBorder;

    // ── Fila 11: Modelo | Etiqueta
    ws.getCell('B11').value = 'Modelo:';   ws.getCell('B11').font = { bold: true };
    ws.getCell('C11').value = '{{modelo}}'; ws.getCell('C11').fill = labelFill; ws.getCell('C11').border = thinBorder;
    ws.getCell('E11').value = 'Etiqueta:'; ws.getCell('E11').font = { bold: true };
    ws.getCell('F11').value = '{{etiqueta}}'; ws.getCell('F11').fill = labelFill; ws.getCell('F11').border = thinBorder;

    // ── Fila 12: separador
    ws.getRow(12).height = 6;

    // ── Fila 13: Procesador | Versión SO
    ws.getCell('B13').value = 'Procesador:'; ws.getCell('B13').font = { bold: true };
    ws.getCell('C13').value = '{{procesador}}'; ws.getCell('C13').fill = labelFill; ws.getCell('C13').border = thinBorder;
    ws.getCell('E13').value = 'Versión SO:'; ws.getCell('E13').font = { bold: true };
    ws.getCell('F13').value = '{{version_so}}'; ws.getCell('F13').fill = labelFill; ws.getCell('F13').border = thinBorder;

    // ── Fila 14: RAM | Nombre equipo
    ws.getCell('B14').value = 'RAM:';        ws.getCell('B14').font = { bold: true };
    ws.getCell('C14').value = '{{ram}}';     ws.getCell('C14').fill = labelFill; ws.getCell('C14').border = thinBorder;
    ws.getCell('E14').value = 'Nombre equipo:'; ws.getCell('E14').font = { bold: true };
    ws.getCell('F14').value = '{{nombre_equipo}}'; ws.getCell('F14').fill = labelFill; ws.getCell('F14').border = thinBorder;

    // ── Fila 15: SO | Versión Office
    ws.getCell('B15').value = 'Sistema Operativo:'; ws.getCell('B15').font = { bold: true };
    ws.getCell('C15').value = '{{sistema_operativo}}'; ws.getCell('C15').fill = labelFill; ws.getCell('C15').border = thinBorder;
    ws.getCell('E15').value = 'Versión Office:'; ws.getCell('E15').font = { bold: true };
    ws.getCell('F15').value = '{{version_office}}'; ws.getCell('F15').fill = labelFill; ws.getCell('F15').border = thinBorder;

    // ── Fila 16: HD | Apps mayor uso
    ws.getCell('B16').value = 'HD:';         ws.getCell('B16').font = { bold: true };
    ws.getCell('C16').value = '{{hd}}';      ws.getCell('C16').fill = labelFill; ws.getCell('C16').border = thinBorder;
    ws.getCell('E16').value = 'Apps mayor uso:'; ws.getCell('E16').font = { bold: true };
    ws.getCell('F16').value = '{{aplicaciones_mayor_uso}}'; ws.getCell('F16').fill = labelFill; ws.getCell('F16').border = thinBorder;

    // ── Fila 17: Apps estándar
    ws.getCell('B17').value = 'Apps fuera estándar:'; ws.getCell('B17').font = { bold: true };
    ws.mergeCells('C17:F17');
    ws.getCell('C17').value = '{{aplicaciones_estandar}}'; ws.getCell('C17').fill = labelFill; ws.getCell('C17').border = thinBorder;

    // ── Fila 18: separador
    ws.getRow(18).height = 6;

    // ── Fila 18 header: Diagnóstico
    ws.mergeCells('A18:G18');
    ws.getCell('A18').value = 'REPORTE DE FALLA Y DIAGNÓSTICO';
    ws.getCell('A18').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB8CCE4' } };
    ws.getCell('A18').font = { bold: true };
    ws.getCell('A18').alignment = { horizontal: 'center' };

    // ── Fila 19: Descripción de falla (label)
    ws.mergeCells('A19:G19');
    ws.getCell('A19').value = '{{descripcion_falla}}';
    ws.getCell('A19').fill = labelFill;
    ws.getCell('A19').border = thinBorder;
    ws.getCell('A19').alignment = { wrapText: true };
    ws.getRow(19).height = 40;

    // Agregar label sobre A19
    ws.getRow(18).getCell(1).value = 'Descripción de la falla (máx. 40 palabras):';
    ws.getRow(18).getCell(1).font = { bold: true };

    // ── Fila 20: label acciones
    ws.mergeCells('A20:G20');
    ws.getCell('A20').value = 'Acciones realizadas (máx. 100 palabras):';
    ws.getCell('A20').font = { bold: true };

    // ── Fila 21: Acciones realizadas
    ws.mergeCells('A21:G21');
    ws.getCell('A21').value = '{{acciones_realizadas}}';
    ws.getCell('A21').fill = labelFill;
    ws.getCell('A21').border = thinBorder;
    ws.getCell('A21').alignment = { wrapText: true };
    ws.getRow(21).height = 60;

    // ── Fila 22: label diagnóstico
    ws.mergeCells('A22:G22');
    ws.getCell('A22').value = 'Diagnóstico luego de las acciones (máx. 80 palabras):';
    ws.getCell('A22').font = { bold: true };

    // ── Fila 23: Diagnóstico final
    ws.mergeCells('A23:G23');
    ws.getCell('A23').value = '{{diagnostico_final}}';
    ws.getCell('A23').fill = labelFill;
    ws.getCell('A23').border = thinBorder;
    ws.getCell('A23').alignment = { wrapText: true };
    ws.getRow(23).height = 50;

    // ── Filas 24-28: espacio firma
    for (let r = 24; r <= 28; r++) ws.getRow(r).height = 8;

    // ── Fila 29: Header firma
    ws.mergeCells('A29:G29');
    ws.getCell('A29').value = 'FIRMA DEL TÉCNICO RESPONSABLE';
    ws.getCell('A29').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB8CCE4' } };
    ws.getCell('A29').font = { bold: true };
    ws.getCell('A29').alignment = { horizontal: 'center' };

    // ── Fila 30: Firma (imagen) y datos técnico
    ws.mergeCells('A30:A33');
    ws.getCell('A30').value = '{{firma}}';
    ws.getCell('A30').alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(30).height = 60;
    ws.getRow(31).height = 16;
    ws.getRow(32).height = 16;
    ws.getRow(33).height = 16;

    ws.getCell('B31').value = '{{nombre_tecnico}}'; ws.getCell('B31').fill = labelFill; ws.getCell('B31').border = thinBorder;
    ws.getCell('B32').value = '{{cedula_tecnico}}';  ws.getCell('B32').fill = labelFill; ws.getCell('B32').border = thinBorder;
    ws.getCell('B33').value = '{{cargo_tecnico}}';   ws.getCell('B33').fill = labelFill; ws.getCell('B33').border = thinBorder;
    ws.getCell('A31').value = 'Nombre:';   ws.getCell('A31').font = { bold: true };
    ws.getCell('A32').value = 'Cédula:';   ws.getCell('A32').font = { bold: true };
    ws.getCell('A33').value = 'Cargo:';    ws.getCell('A33').font = { bold: true };

    // Guardar la plantilla
    wb.xlsx.writeFile(PLANTILLA_PATH)
      .then(() => console.log('✅ Plantilla de ejemplo creada en:', PLANTILLA_PATH))
      .catch(err => console.error('❌ Error creando plantilla:', err));
  } catch (e) {
    console.warn('⚠️  No se pudo crear la plantilla automáticamente (exceljs no disponible). Por favor coloque manualmente Plantilla_Diagnostico.xlsx en backend/plantilla/');
  }
}

// ─── ENDPOINT: INFO DE PLANTILLA ──────────────────────────────────────────
app.get('/api/admin/plantilla', (req, res) => {
  try {
    if (!fs.existsSync(PLANTILLA_PATH)) {
      return res.json({ existe: false, nombre: null, fecha: null });
    }
    const stats = fs.statSync(PLANTILLA_PATH);
    res.json({
      existe: true,
      nombre: 'Plantilla_Diagnostico.xlsx',
      fecha: stats.mtime.toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo obtener información de la plantilla.' });
  }
});

// ─── MULTER: UPLOAD PLANTILLA ──────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PLANTILLA_DIR),
  filename:    (_req, _file, cb) => cb(null, 'Plantilla_Diagnostico.xlsx')
});
const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ok = file.originalname.endsWith('.xlsx') ||
               file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (ok) cb(null, true);
    else cb(new Error('Solo se permiten archivos .xlsx'));
  }
});

// ─── ENDPOINT: SUBIR NUEVA PLANTILLA (ADMIN) ─────────────────────────────
app.post('/api/admin/plantilla', upload.single('plantilla'), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: 'No se recibió ningún archivo.' });
  res.json({ ok: true, mensaje: 'Plantilla actualizada correctamente.' });
});

// ─── ENDPOINT: GENERAR PDF ────────────────────────────────────────────────
app.post('/api/generar-pdf', async (req, res) => {
  const body = req.body;
  const timestamp = Date.now();
  const tmpXlsx = path.join(TMP_DIR, `diag_${timestamp}.xlsx`);
  const tmpPdf  = path.join(TMP_DIR, `diag_${timestamp}.pdf`);

  try {
    // 1. Verificar que existe la plantilla
    if (!fs.existsSync(PLANTILLA_PATH)) {
      return res.status(500).json({
        error: 'Plantilla no encontrada. Por favor suba la plantilla desde el Panel de Administración.'
      });
    }

    // 2. Cargar plantilla
    const templateBuf = fs.readFileSync(PLANTILLA_PATH);
    const template = new XlsxTemplate(templateBuf);

    // 3. Preparar valores
    const values = {
      sede:                   body.sede                   || '',
      fecha:                  body.fecha                  || '',
      nombre_usuario:         body.nombre_usuario         || '',
      area_usuario:           body.area_usuario           || '',
      cedula_usuario:         body.cedula_usuario         || '',
      ubicacion_fisica:       body.ubicacion_fisica       || '',
      marca:                  body.marca                  || '',
      modelo:                 body.modelo                 || '',
      serial:                 body.serial                 || '',
      etiqueta:               body.etiqueta               || '',
      procesador:             body.procesador             || '',
      ram:                    body.ram                    || '',
      sistema_operativo:      body.sistema_operativo      || '',
      hd:                     body.hd                     || '',
      aplicaciones_estandar:  body.aplicaciones_estandar  || '',
      version_so:             body.version_so             || '',
      nombre_equipo:          body.nombre_equipo          || '',
      version_office:         body.version_office         || '',
      aplicaciones_mayor_uso: body.aplicaciones_mayor_uso || '',
      descripcion_falla:      body.descripcion_falla      || '',
      acciones_realizadas:    body.acciones_realizadas    || '',
      diagnostico_final:      body.diagnostico_final      || '',
      nombre_tecnico:         body.nombre_tecnico         || '',
      cedula_tecnico:         body.cedula_tecnico         || '',
      cargo_tecnico:          body.cargo_tecnico          || '',
    };

    // 4. Procesar firma (base64 → buffer)
    if (body.firma_base64 && body.firma_base64.includes(',')) {
      const b64 = body.firma_base64.split(',')[1];
      values.firma = {
        _type:   'image',
        _format: 'png',
        _data:   Buffer.from(b64, 'base64')
      };
    } else if (body.firma_base64) {
      values.firma = {
        _type:   'image',
        _format: 'png',
        _data:   Buffer.from(body.firma_base64, 'base64')
      };
    } else {
      values.firma = '[Sin firma]';
    }

    // 5. Sustituir en la hoja (intentar por nombre, luego por índice)
    try {
      template.substitute('Diagnostico', values);
    } catch {
      template.substitute(1, values);
    }

    // 6. Guardar Excel temporal
    const outputBuf = template.generate({ type: 'nodebuffer' });
    fs.writeFileSync(tmpXlsx, outputBuf);

    // 7. Convertir con LibreOffice
    const sofficePath = getLibreOfficePath();
    try {
      execSync(
        `${sofficePath} --headless --convert-to pdf --outdir "${TMP_DIR}" "${tmpXlsx}"`,
        { timeout: 60000 }
      );
    } catch (loErr) {
      console.error('Error LibreOffice:', loErr.message);
      // Limpiar xlsx temporal
      if (fs.existsSync(tmpXlsx)) fs.unlinkSync(tmpXlsx);
      return res.status(500).json({
        error: 'No se pudo convertir a PDF. Verifique que LibreOffice esté instalado y accesible.',
        detalle: loErr.message
      });
    }

    // 8. Verificar que el PDF existe
    if (!fs.existsSync(tmpPdf)) {
      if (fs.existsSync(tmpXlsx)) fs.unlinkSync(tmpXlsx);
      return res.status(500).json({ error: 'LibreOffice no generó el PDF esperado.' });
    }

    // 9. Enviar PDF como respuesta binaria
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Diagnostico_${body.etiqueta || timestamp}.pdf"`);

    const pdfStream = fs.createReadStream(tmpPdf);
    pdfStream.pipe(res);

    pdfStream.on('end', () => {
      // 10. Limpiar temporales
      try { if (fs.existsSync(tmpXlsx)) fs.unlinkSync(tmpXlsx); } catch {}
      try { if (fs.existsSync(tmpPdf))  fs.unlinkSync(tmpPdf);  } catch {}
    });

    pdfStream.on('error', (err) => {
      console.error('Error enviando PDF:', err);
      try { if (fs.existsSync(tmpXlsx)) fs.unlinkSync(tmpXlsx); } catch {}
      try { if (fs.existsSync(tmpPdf))  fs.unlinkSync(tmpPdf);  } catch {}
    });

  } catch (err) {
    console.error('Error general:', err);
    // Limpiar temporales en caso de error
    try { if (fs.existsSync(tmpXlsx)) fs.unlinkSync(tmpXlsx); } catch {}
    try { if (fs.existsSync(tmpPdf))  fs.unlinkSync(tmpPdf);  } catch {}
    res.status(500).json({ error: 'Error interno del servidor: ' + err.message });
  }
});

// ─── INICIO DEL SERVIDOR ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Backend Portal Soporte en Sitio corriendo en http://localhost:${PORT}`);
  console.log(`📂 Plantilla: ${PLANTILLA_PATH}`);
  console.log(`📁 Temporales: ${TMP_DIR}`);
  console.log(`🖨️  LibreOffice: ${getLibreOfficePath()}\n`);
  ensurePlantilla();
});
