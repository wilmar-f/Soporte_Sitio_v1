import { useEffect, useState } from 'react';

const HISTORIAL_KEY = 'corbeta_historial';

export function getHistorial() {
  try {
    return JSON.parse(sessionStorage.getItem(HISTORIAL_KEY) || '[]');
  } catch {
    return [];
  }
}

export function agregarAlHistorial(registro) {
  const actual = getHistorial();
  actual.unshift(registro);
  sessionStorage.setItem(HISTORIAL_KEY, JSON.stringify(actual));
}

export default function HistorialSesion({ refreshKey }) {
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    setHistorial(getHistorial());
  }, [refreshKey]);

  if (historial.length === 0) {
    return (
      <div className="text-center py-10 text-white/40">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-sm">No hay diagnósticos en esta sesión.</p>
        <p className="text-xs mt-1">Los registros aparecerán aquí después de generar un PDF.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
      {historial.map((item, idx) => (
        <div key={idx} className="historial-row">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#2563a8]/50 flex items-center justify-center text-xs font-bold text-white">
            {idx + 1}
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div>
              <span className="text-white/40 block text-[10px] uppercase tracking-wide">Fecha</span>
              <span className="text-white/90 font-medium">{item.fecha}</span>
            </div>
            <div>
              <span className="text-white/40 block text-[10px] uppercase tracking-wide">Sede</span>
              <span className="text-white/90 font-medium">{item.sede}</span>
            </div>
            <div>
              <span className="text-white/40 block text-[10px] uppercase tracking-wide">Serial</span>
              <span className="text-white/90 font-mono">{item.serial}</span>
            </div>
            <div>
              <span className="text-white/40 block text-[10px] uppercase tracking-wide">Etiqueta</span>
              <span className="text-white/90 font-mono">{item.etiqueta}</span>
            </div>
            <div>
              <span className="text-white/40 block text-[10px] uppercase tracking-wide">Técnico</span>
              <span className="text-white/90">{item.nombre_tecnico}</span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <span className="badge badge-tecnico">PDF ✓</span>
          </div>
        </div>
      ))}
    </div>
  );
}
