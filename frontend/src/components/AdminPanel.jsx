import { useState, useEffect } from 'react';

export default function AdminPanel({ usuario, onBack }) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const fetchInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/plantilla');
      const data = await res.json();
      setInfo(data);
    } catch {
      setInfo(null);
    }
    setLoading(false);
  };

  useEffect(() => { fetchInfo(); }, []);

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setMensaje('');
    setError('');
    const formData = new FormData();
    formData.append('plantilla', uploadFile);
    try {
      const res = await fetch('/api/admin/plantilla', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.ok) {
        setMensaje('✅ Plantilla actualizada correctamente. Todos los diagnósticos futuros usarán el nuevo formato.');
        setUploadFile(null);
        await fetchInfo();
      } else {
        setError(data.error || 'Error desconocido al subir la plantilla.');
      }
    } catch (e) {
      setError('No se pudo conectar con el servidor: ' + e.message);
    }
    setUploading(false);
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/D';
    const d = new Date(isoString);
    return d.toLocaleString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#e8a900] flex items-center justify-center text-[#0d1f35] font-bold text-lg">
                ⚙
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Panel de Administración</h2>
                <p className="text-white/50 text-sm">{usuario.nombre} · {usuario.correo}</p>
              </div>
            </div>
            <button onClick={onBack} className="btn-secondary text-sm">
              ← Volver al Dashboard
            </button>
          </div>
        </div>

        {/* Plantilla activa */}
        <div className="form-card p-6 mb-5">
          <h3 className="text-lg font-bold text-[#1a3a5c] mb-4 flex items-center gap-2">
            <span>📊</span> Plantilla de diagnóstico activa
          </h3>

          {loading ? (
            <div className="flex items-center gap-3 py-4 text-gray-500">
              <div className="spinner w-5 h-5 border-gray-300 border-t-[#2563a8]" />
              Cargando información…
            </div>
          ) : info?.existe ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
              <span className="text-2xl">📗</span>
              <div>
                <p className="font-semibold text-emerald-800">{info.nombre}</p>
                <p className="text-emerald-600 text-sm mt-1">
                  Última modificación: <strong>{formatDate(info.fecha)}</strong>
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-amber-800">Plantilla no encontrada</p>
                <p className="text-amber-600 text-sm mt-1">
                  No se encontró el archivo <code>Plantilla_Diagnostico.xlsx</code> en el servidor.
                  Suba una plantilla para habilitar la generación de PDF.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Subir nueva plantilla */}
        <div className="form-card p-6">
          <h3 className="text-lg font-bold text-[#1a3a5c] mb-2 flex items-center gap-2">
            <span>⬆️</span> Subir nueva plantilla
          </h3>

          {/* Advertencia */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-amber-800 text-sm">
            <strong>⚠ Importante:</strong> Asegúrese de que la nueva plantilla contenga los mismos marcadores{' '}
            <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">{'{{variable}}'}</code>{' '}
            en las celdas correspondientes. De lo contrario, los campos quedarán en blanco en el PDF generado.
          </div>

          {/* Input de archivo */}
          <div className="mb-4">
            <label
              htmlFor="plantilla-upload"
              className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-[#2563a8] hover:bg-blue-50/50 transition-all duration-200"
            >
              <span className="text-4xl">{uploadFile ? '📗' : '📁'}</span>
              <div className="text-center">
                {uploadFile ? (
                  <>
                    <p className="text-sm font-semibold text-[#1a3a5c]">{uploadFile.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{(uploadFile.size / 1024).toFixed(1)} KB · Haga clic para cambiar</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-gray-700">Haga clic para seleccionar</p>
                    <p className="text-xs text-gray-400 mt-1">Solo archivos .xlsx</p>
                  </>
                )}
              </div>
              <input
                id="plantilla-upload"
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={e => {
                  setUploadFile(e.target.files?.[0] || null);
                  setMensaje('');
                  setError('');
                }}
              />
            </label>
          </div>

          {/* Mensajes */}
          {mensaje && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 text-emerald-700 text-sm">
              {mensaje}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-red-700 text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Botón subir */}
          <button
            onClick={handleUpload}
            disabled={!uploadFile || uploading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <div className="spinner w-5 h-5" />
                Subiendo plantilla…
              </>
            ) : (
              '⬆ Subir nueva plantilla'
            )}
          </button>
        </div>

        {/* Tabla de marcadores */}
        <div className="form-card p-6 mt-5">
          <h3 className="text-base font-bold text-[#1a3a5c] mb-3 flex items-center gap-2">
            <span>🗺</span> Mapa de marcadores requeridos en la plantilla
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#1a3a5c] text-white">
                  <th className="px-3 py-2 rounded-tl-lg">Celda</th>
                  <th className="px-3 py-2">Campo</th>
                  <th className="px-3 py-2 rounded-tr-lg">Marcador</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['C5','Sede','{{sede}}'],['F5','Fecha','{{fecha}}'],
                  ['C7','Nombre usuario','{{nombre_usuario}}'],['F7','Área usuario','{{area_usuario}}'],
                  ['C8','Cédula usuario','{{cedula_usuario}}'],['F8','Ubicación física','{{ubicacion_fisica}}'],
                  ['C10','Marca','{{marca}}'],['F10','Serial','{{serial}}'],
                  ['C11','Modelo','{{modelo}}'],['F11','Etiqueta','{{etiqueta}}'],
                  ['C13','Procesador','{{procesador}}'],['F13','Versión SO','{{version_so}}'],
                  ['C14','RAM','{{ram}}'],['F14','Nombre equipo','{{nombre_equipo}}'],
                  ['C15','Sistema Operativo','{{sistema_operativo}}'],['F15','Versión Office','{{version_office}}'],
                  ['C16','HD','{{hd}}'],['F16','Apps mayor uso','{{aplicaciones_mayor_uso}}'],
                  ['C17','Apps fuera estándar','{{aplicaciones_estandar}}'],
                  ['A19','Descripción de falla','{{descripcion_falla}}'],
                  ['A21','Acciones realizadas','{{acciones_realizadas}}'],
                  ['A23','Diagnóstico final','{{diagnostico_final}}'],
                  ['B31','Nombre técnico','{{nombre_tecnico}}'],
                  ['B32','Cédula técnico','{{cedula_tecnico}}'],
                  ['B33','Cargo técnico','{{cargo_tecnico}}'],
                  ['A30','Firma (imagen)','{{firma}}'],
                ].map(([celda, campo, marcador], i) => (
                  <tr key={celda} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-3 py-1.5 font-mono font-bold text-[#1a3a5c]">{celda}</td>
                    <td className="px-3 py-1.5 text-gray-700">{campo}</td>
                    <td className="px-3 py-1.5">
                      <code className="bg-[#ffd966]/40 px-1.5 py-0.5 rounded text-[#1a3a5c] font-mono">{marcador}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
