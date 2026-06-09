import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import FirmaCanvas from './FirmaCanvas';
import PdfPreview from './PdfPreview';
import { agregarAlHistorial } from './HistorialSesion';

const SEDES = ['AKB68','AKB30','AKVIL','AKVEN','KTVIL','FOVIL','ALVIL','ALVI2','AKCEV','ALKRE','DIBOG','AKYOP'];

function getFechaActual() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2,'0');
  const m = String(now.getMonth()+1).padStart(2,'0');
  const y = now.getFullYear();
  return `${d}/${m}/${y}`;
}

function contarPalabras(texto) {
  if (!texto || !texto.trim()) return 0;
  return texto.trim().split(/\s+/).filter(Boolean).length;
}

function WordCounter({ texto, max }) {
  const count = contarPalabras(texto);
  const pct = count / max;
  const cls = pct >= 1 ? 'word-counter-over' : pct >= 0.85 ? 'word-counter-warn' : 'word-counter-ok';
  return (
    <span className={`word-counter ${cls}`}>
      {count}/{max} palabras{count > max ? ' (EXCEDIDO)' : ''}
    </span>
  );
}

function SectionHeader({ icon, title }) {
  return (
    <div className="section-header">
      <span className="text-lg">{icon}</span>
      <span>{title}</span>
    </div>
  );
}

export default function DiagnosticoForm({ usuario, onClose, onSuccess }) {
  const fecha = getFechaActual();
  const [firma, setFirma] = useState(null);
  const [firmaError, setFirmaError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfFilename, setPdfFilename] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      nombre_tecnico: usuario?.nombre || '',
      fecha
    }
  });

  const watchedFields = {
    descripcion_falla: watch('descripcion_falla', ''),
    acciones_realizadas: watch('acciones_realizadas', ''),
    diagnostico_final: watch('diagnostico_final', ''),
  };

  const handleFirmaChange = useCallback((dataUrl) => {
    setFirma(dataUrl);
    if (dataUrl) setFirmaError('');
  }, []);

  const onSubmit = async (data) => {
    // Validar firma
    if (!firma) {
      setFirmaError('La firma es obligatoria. Dibuje o cargue una imagen.');
      return;
    }
    // Validar contadores
    if (contarPalabras(data.descripcion_falla) > 40) return;
    if (contarPalabras(data.acciones_realizadas) > 100) return;
    if (contarPalabras(data.diagnostico_final) > 80) return;

    setLoading(true);
    setBackendError('');

    const payload = {
      ...data,
      fecha,
      firma_base64: firma,
    };

    try {
      const response = await fetch('/api/generar-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Error del servidor: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const filename = `Diagnostico_${data.etiqueta}_${data.serial}.pdf`;

      // Guardar en historial
      agregarAlHistorial({
        fecha,
        sede: data.sede,
        serial: data.serial,
        etiqueta: data.etiqueta,
        nombre_tecnico: data.nombre_tecnico,
      });

      setPdfFilename(filename);
      setPdfUrl(url);
      onSuccess?.();
    } catch (err) {
      setBackendError(err.message || 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (pdfUrl) {
    return (
      <PdfPreview
        pdfUrl={pdfUrl}
        filename={pdfFilename}
        onClose={() => {
          URL.revokeObjectURL(pdfUrl);
          setPdfUrl(null);
          onClose?.();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Encabezado */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Formulario de Diagnóstico Técnico</h2>
              <p className="text-white/50 text-sm mt-1">Complete todos los campos requeridos</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-white/60 text-xs">Fecha</p>
                <p className="text-white font-mono font-bold">{fecha}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-sm px-4 py-2"
              >
                ✕ Cancelar
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-card p-6 mb-5">
            {/* ── SECCIÓN 1: DATOS DEL USUARIO ── */}
            <SectionHeader icon="👤" title="Datos del Usuario" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Sede */}
              <div className="form-field">
                <label className="form-label">Sede *</label>
                <select
                  className={`form-select ${errors.sede ? 'form-input-error' : ''}`}
                  {...register('sede', { required: 'Seleccione una sede' })}
                >
                  <option value="">-- Seleccione --</option>
                  {SEDES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.sede && <p className="form-error">⚠ {errors.sede.message}</p>}
              </div>

              {/* Fecha (solo lectura) */}
              <div className="form-field">
                <label className="form-label">Fecha</label>
                <input
                  readOnly
                  value={fecha}
                  className="form-input bg-gray-100 cursor-not-allowed text-gray-500"
                />
              </div>

              {/* Nombre usuario */}
              <div className="form-field">
                <label className="form-label">Nombre del Usuario *</label>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  className={`form-input ${errors.nombre_usuario ? 'form-input-error' : ''}`}
                  {...register('nombre_usuario', { required: 'Requerido' })}
                />
                {errors.nombre_usuario && <p className="form-error">⚠ {errors.nombre_usuario.message}</p>}
              </div>

              {/* Cédula usuario */}
              <div className="form-field">
                <label className="form-label">Cédula del Usuario *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Solo números"
                  className={`form-input ${errors.cedula_usuario ? 'form-input-error' : ''}`}
                  {...register('cedula_usuario', {
                    required: 'Requerido',
                    pattern: { value: /^\d+$/, message: 'Solo números' }
                  })}
                />
                {errors.cedula_usuario && <p className="form-error">⚠ {errors.cedula_usuario.message}</p>}
              </div>

              {/* Área */}
              <div className="form-field">
                <label className="form-label">Área del Usuario *</label>
                <input
                  type="text"
                  placeholder="Departamento o área"
                  className={`form-input ${errors.area_usuario ? 'form-input-error' : ''}`}
                  {...register('area_usuario', { required: 'Requerido' })}
                />
                {errors.area_usuario && <p className="form-error">⚠ {errors.area_usuario.message}</p>}
              </div>

              {/* Ubicación física */}
              <div className="form-field">
                <label className="form-label">Ubicación Física * <span className="text-gray-400 text-xs normal-case">(5 caracteres)</span></label>
                <input
                  type="text"
                  placeholder="Ej: A1001"
                  maxLength={5}
                  className={`form-input font-mono ${errors.ubicacion_fisica ? 'form-input-error' : ''}`}
                  {...register('ubicacion_fisica', {
                    required: 'Requerido',
                    minLength: { value: 5, message: 'Exactamente 5 caracteres' },
                    maxLength: { value: 5, message: 'Exactamente 5 caracteres' },
                  })}
                />
                {errors.ubicacion_fisica && <p className="form-error">⚠ {errors.ubicacion_fisica.message}</p>}
              </div>
            </div>

            {/* ── SECCIÓN 2: DATOS DEL EQUIPO ── */}
            <SectionHeader icon="💻" title="Datos del Equipo" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Marca */}
              <div className="form-field">
                <label className="form-label">Marca *</label>
                <input type="text" placeholder="Dell, HP, Lenovo…" className={`form-input ${errors.marca ? 'form-input-error' : ''}`}
                  {...register('marca', { required: 'Requerido' })} />
                {errors.marca && <p className="form-error">⚠ {errors.marca.message}</p>}
              </div>

              {/* Modelo */}
              <div className="form-field">
                <label className="form-label">Modelo *</label>
                <input type="text" placeholder="Modelo del equipo" className={`form-input ${errors.modelo ? 'form-input-error' : ''}`}
                  {...register('modelo', { required: 'Requerido' })} />
                {errors.modelo && <p className="form-error">⚠ {errors.modelo.message}</p>}
              </div>

              {/* Serial */}
              <div className="form-field">
                <label className="form-label">Serial *</label>
                <input type="text" placeholder="Número de serie" className={`form-input font-mono ${errors.serial ? 'form-input-error' : ''}`}
                  {...register('serial', { required: 'Requerido' })} />
                {errors.serial && <p className="form-error">⚠ {errors.serial.message}</p>}
              </div>

              {/* Etiqueta */}
              <div className="form-field">
                <label className="form-label">Etiqueta * <span className="text-gray-400 text-xs normal-case">(7 dígitos)</span></label>
                <input type="text" inputMode="numeric" placeholder="1234567" maxLength={7}
                  className={`form-input font-mono ${errors.etiqueta ? 'form-input-error' : ''}`}
                  {...register('etiqueta', {
                    required: 'Requerido',
                    pattern: { value: /^\d{7}$/, message: 'Exactamente 7 dígitos numéricos' }
                  })} />
                {errors.etiqueta && <p className="form-error">⚠ {errors.etiqueta.message}</p>}
              </div>

              {/* Procesador */}
              <div className="form-field">
                <label className="form-label">Procesador Tipo y Velocidad *</label>
                <input type="text" placeholder="Intel Core i5 2.4GHz" className={`form-input ${errors.procesador ? 'form-input-error' : ''}`}
                  {...register('procesador', { required: 'Requerido' })} />
                {errors.procesador && <p className="form-error">⚠ {errors.procesador.message}</p>}
              </div>

              {/* RAM */}
              <div className="form-field">
                <label className="form-label">RAM *</label>
                <input type="text" placeholder="8 GB DDR4" className={`form-input ${errors.ram ? 'form-input-error' : ''}`}
                  {...register('ram', { required: 'Requerido' })} />
                {errors.ram && <p className="form-error">⚠ {errors.ram.message}</p>}
              </div>

              {/* SO */}
              <div className="form-field">
                <label className="form-label">Sistema Operativo *</label>
                <input type="text" placeholder="Windows 10 Pro" className={`form-input ${errors.sistema_operativo ? 'form-input-error' : ''}`}
                  {...register('sistema_operativo', { required: 'Requerido' })} />
                {errors.sistema_operativo && <p className="form-error">⚠ {errors.sistema_operativo.message}</p>}
              </div>

              {/* HD */}
              <div className="form-field">
                <label className="form-label">HD *</label>
                <input type="text" placeholder="SSD 256 GB" className={`form-input ${errors.hd ? 'form-input-error' : ''}`}
                  {...register('hd', { required: 'Requerido' })} />
                {errors.hd && <p className="form-error">⚠ {errors.hd.message}</p>}
              </div>

              {/* Versión SO */}
              <div className="form-field">
                <label className="form-label">Versión SO *</label>
                <input type="text" placeholder="21H2 / Build 19044" className={`form-input ${errors.version_so ? 'form-input-error' : ''}`}
                  {...register('version_so', { required: 'Requerido' })} />
                {errors.version_so && <p className="form-error">⚠ {errors.version_so.message}</p>}
              </div>

              {/* Nombre equipo */}
              <div className="form-field">
                <label className="form-label">Nombre del Equipo *</label>
                <input type="text" placeholder="PC-001-VENTAS" className={`form-input font-mono ${errors.nombre_equipo ? 'form-input-error' : ''}`}
                  {...register('nombre_equipo', { required: 'Requerido' })} />
                {errors.nombre_equipo && <p className="form-error">⚠ {errors.nombre_equipo.message}</p>}
              </div>

              {/* Versión Office */}
              <div className="form-field">
                <label className="form-label">Versión de Office *</label>
                <input type="text" placeholder="Microsoft 365 / 2019" className={`form-input ${errors.version_office ? 'form-input-error' : ''}`}
                  {...register('version_office', { required: 'Requerido' })} />
                {errors.version_office && <p className="form-error">⚠ {errors.version_office.message}</p>}
              </div>

              {/* Apps mayor uso */}
              <div className="form-field">
                <label className="form-label">Aplicaciones de Mayor Uso *</label>
                <input type="text" placeholder="Chrome, SAP, Teams…" className={`form-input ${errors.aplicaciones_mayor_uso ? 'form-input-error' : ''}`}
                  {...register('aplicaciones_mayor_uso', { required: 'Requerido' })} />
                {errors.aplicaciones_mayor_uso && <p className="form-error">⚠ {errors.aplicaciones_mayor_uso.message}</p>}
              </div>

              {/* Apps fuera estándar (opcional) */}
              <div className="form-field sm:col-span-2">
                <label className="form-label">Aplicaciones Fuera del Estándar <span className="text-gray-400 text-xs normal-case">(opcional)</span></label>
                <input type="text" placeholder="Software no estándar instalado" className="form-input"
                  {...register('aplicaciones_estandar')} />
              </div>
            </div>

            {/* ── SECCIÓN 3: REPORTE DE FALLA ── */}
            <SectionHeader icon="🔍" title="Reporte de Falla y Diagnóstico" />
            <div className="space-y-5 mb-6">
              {/* Descripción de la falla */}
              <div className="form-field">
                <div className="flex justify-between items-center mb-1">
                  <label className="form-label">Descripción de la Falla *</label>
                  <WordCounter texto={watchedFields.descripcion_falla} max={40} />
                </div>
                <textarea rows={3} placeholder="Describa el problema reportado por el usuario (máx. 40 palabras)"
                  className={`form-textarea ${errors.descripcion_falla ? 'form-input-error' : ''}`}
                  {...register('descripcion_falla', {
                    required: 'Requerido',
                    validate: v => contarPalabras(v) <= 40 || 'Máximo 40 palabras'
                  })} />
                {errors.descripcion_falla && <p className="form-error">⚠ {errors.descripcion_falla.message}</p>}
              </div>

              {/* Acciones realizadas */}
              <div className="form-field">
                <div className="flex justify-between items-center mb-1">
                  <label className="form-label">Acciones Realizadas *</label>
                  <WordCounter texto={watchedFields.acciones_realizadas} max={100} />
                </div>
                <textarea rows={4} placeholder="Detalle las acciones técnicas realizadas (máx. 100 palabras)"
                  className={`form-textarea ${errors.acciones_realizadas ? 'form-input-error' : ''}`}
                  {...register('acciones_realizadas', {
                    required: 'Requerido',
                    validate: v => contarPalabras(v) <= 100 || 'Máximo 100 palabras'
                  })} />
                {errors.acciones_realizadas && <p className="form-error">⚠ {errors.acciones_realizadas.message}</p>}
              </div>

              {/* Diagnóstico final */}
              <div className="form-field">
                <div className="flex justify-between items-center mb-1">
                  <label className="form-label">Diagnóstico Final *</label>
                  <WordCounter texto={watchedFields.diagnostico_final} max={80} />
                </div>
                <textarea rows={3} placeholder="Diagnóstico conclusivo luego de las acciones realizadas (máx. 80 palabras)"
                  className={`form-textarea ${errors.diagnostico_final ? 'form-input-error' : ''}`}
                  {...register('diagnostico_final', {
                    required: 'Requerido',
                    validate: v => contarPalabras(v) <= 80 || 'Máximo 80 palabras'
                  })} />
                {errors.diagnostico_final && <p className="form-error">⚠ {errors.diagnostico_final.message}</p>}
              </div>
            </div>

            {/* ── SECCIÓN 4: FIRMA ── */}
            <SectionHeader icon="✍️" title="Firma del Técnico Responsable" />
            <div className="mb-6">
              <FirmaCanvas onChange={handleFirmaChange} />
              {firmaError && (
                <p className="form-error mt-2">⚠ {firmaError}</p>
              )}
            </div>

            {/* ── SECCIÓN 5: DATOS DEL TÉCNICO ── */}
            <SectionHeader icon="🧑‍💼" title="Datos del Técnico" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="form-field">
                <label className="form-label">Nombre Técnico *</label>
                <input type="text" className={`form-input ${errors.nombre_tecnico ? 'form-input-error' : ''}`}
                  {...register('nombre_tecnico', { required: 'Requerido' })} />
                {errors.nombre_tecnico && <p className="form-error">⚠ {errors.nombre_tecnico.message}</p>}
              </div>
              <div className="form-field">
                <label className="form-label">Cédula Técnico *</label>
                <input type="text" inputMode="numeric" placeholder="Solo números" className={`form-input font-mono ${errors.cedula_tecnico ? 'form-input-error' : ''}`}
                  {...register('cedula_tecnico', {
                    required: 'Requerido',
                    pattern: { value: /^\d+$/, message: 'Solo números' }
                  })} />
                {errors.cedula_tecnico && <p className="form-error">⚠ {errors.cedula_tecnico.message}</p>}
              </div>
              <div className="form-field">
                <label className="form-label">Cargo *</label>
                <input type="text" placeholder="Técnico de Soporte" className={`form-input ${errors.cargo_tecnico ? 'form-input-error' : ''}`}
                  {...register('cargo_tecnico', { required: 'Requerido' })} />
                {errors.cargo_tecnico && <p className="form-error">⚠ {errors.cargo_tecnico.message}</p>}
              </div>
            </div>
          </div>

          {/* Error de backend */}
          {backendError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-red-700 text-sm">
              <strong>⚠ Error al generar el PDF:</strong> {backendError}
            </div>
          )}

          {/* Botones de envío */}
          <div className="flex items-center justify-end gap-4 pb-8">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-gold flex items-center gap-2 px-8 py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="spinner w-5 h-5" />
                  Generando documento…
                </>
              ) : (
                <>
                  📄 Generar PDF
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
