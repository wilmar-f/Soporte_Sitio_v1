import { useState } from 'react';
import DiagnosticoForm from './DiagnosticoForm';
import HistorialSesion from './HistorialSesion';

const LogoBar = () => (
  <div className="flex items-center gap-4 flex-wrap">
    {['alkomprar', 'alkosto', 'akt', 'ktronix', 'corbeta'].map((logo) => (
      <img
        key={logo}
        src={`/logos/${logo}.jpg`}
        alt={logo}
        className="h-7 w-auto object-contain"
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    ))}
  </div>
);

export default function Dashboard({ usuario, onLogout, onAdmin }) {
  const [showForm, setShowForm] = useState(false);
  const [historialKey, setHistorialKey] = useState(0);

  const handleSuccess = () => {
    setHistorialKey(k => k + 1);
  };

  if (showForm) {
    return (
      <DiagnosticoForm
        usuario={usuario}
        onClose={() => setShowForm(false)}
        onSuccess={handleSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen py-6 px-4">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <LogoBar />
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-right">
                <p className="text-white font-semibold text-sm">{usuario.nombre}</p>
                <p className="text-white/50 text-xs">{usuario.correo}</p>
              </div>
              <span className={`badge ${usuario.rol === 'admin' ? 'badge-admin' : 'badge-tecnico'}`}>
                {usuario.rol}
              </span>
              {usuario.rol === 'admin' && (
                <button onClick={onAdmin} className="btn-gold text-sm flex items-center gap-1.5">
                  ⚙ Administración
                </button>
              )}
              <button onClick={onLogout} className="btn-danger text-sm flex items-center gap-1.5">
                🚪 Cerrar sesión
              </button>
            </div>
          </div>
        </div>

        {/* ── Título y CTA principal ── */}
        <div className="glass-card p-8 text-center">
          <div className="text-5xl mb-4">💻</div>
          <h1 className="text-3xl font-extrabold text-white mb-2">
            Portal Soporte en Sitio
          </h1>
          <p className="text-white/60 text-base mb-8 max-w-md mx-auto">
            Corbeta Colombiana de Comercio S.A. · Diagnóstico técnico de equipos
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-gold text-lg px-10 py-4 rounded-xl font-extrabold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            + Generar Diagnóstico
          </button>
          <p className="text-white/30 text-xs mt-4">
            Llene el formulario y obtenga el PDF listo para imprimir en segundos
          </p>
        </div>

        {/* ── Historial de sesión ── */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📋</span>
              Historial de esta sesión
            </h2>
            <span className="text-white/40 text-xs border border-white/10 rounded-lg px-3 py-1">
              Se borra al cerrar el navegador
            </span>
          </div>
          <HistorialSesion refreshKey={historialKey} />
        </div>

        {/* ── Info cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '🔒', title: 'Sin base de datos', desc: 'Todo corre localmente en su navegador' },
            { icon: '⚡', title: 'PDF instantáneo', desc: 'Generado automáticamente desde la plantilla Excel' },
            { icon: '📱', title: 'Responsivo', desc: 'Funciona en computador, tablet y celular' },
          ].map(card => (
            <div key={card.title} className="glass-card p-5 text-center">
              <div className="text-3xl mb-2">{card.icon}</div>
              <h3 className="text-white font-semibold text-sm mb-1">{card.title}</h3>
              <p className="text-white/40 text-xs">{card.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
