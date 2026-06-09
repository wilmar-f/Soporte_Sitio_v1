import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { USUARIOS } from '../config/usuarios';

const LogoBar = () => (
  <div className="flex items-center justify-center gap-6 mb-8 flex-wrap">
    {['alkomprar', 'alkosto', 'akt', 'ktronix', 'corbeta'].map((logo) => (
      <img
        key={logo}
        src={`/logos/${logo}.jpg`}
        alt={logo}
        className="h-8 w-auto object-contain"
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
    ))}
  </div>
);

export default function LoginForm({ onLogin }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 400));
    const usuario = USUARIOS.find(
      u => u.correo === data.correo && u.password === data.password
    );
    if (usuario) {
      onLogin(usuario);
    } else {
      setError('Correo o contraseña incorrectos. Verifique sus credenciales.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Card principal */}
      <div className="glass-card w-full max-w-md p-8">
        {/* Logos */}
        <LogoBar />

        {/* Título */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white leading-tight">
            Portal Soporte en Sitio
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Corbeta Colombiana de Comercio S.A.
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Correo */}
          <div className="form-field">
            <label className="text-white/80 text-sm font-medium mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="usuario@corbeta.com"
              className={`w-full px-4 py-3 rounded-xl bg-white/10 border text-white placeholder-white/40
                focus:outline-none focus:ring-2 focus:ring-[#e8a900]/60 transition-all duration-200
                ${errors.correo ? 'border-red-400' : 'border-white/20 focus:border-[#e8a900]/80'}`}
              {...register('correo', {
                required: 'El correo es obligatorio',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Ingrese un correo válido'
                }
              })}
            />
            {errors.correo && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <span>⚠</span> {errors.correo.message}
              </p>
            )}
          </div>

          {/* Contraseña */}
          <div className="form-field">
            <label className="text-white/80 text-sm font-medium mb-1">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className={`w-full px-4 py-3 rounded-xl bg-white/10 border text-white placeholder-white/40
                focus:outline-none focus:ring-2 focus:ring-[#e8a900]/60 transition-all duration-200
                ${errors.password ? 'border-red-400' : 'border-white/20 focus:border-[#e8a900]/80'}`}
              {...register('password', {
                required: 'La contraseña es obligatoria'
              })}
            />
            {errors.password && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <span>⚠</span> {errors.password.message}
              </p>
            )}
          </div>

          {/* Error de credenciales */}
          {error && (
            <div className="bg-red-500/20 border border-red-400/40 rounded-xl px-4 py-3 text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-gold py-3 text-base font-bold rounded-xl mt-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="spinner w-5 h-5" />
                Ingresando...
              </>
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </form>

        {/* Credenciales de ayuda (MVP) */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <p className="text-white/40 text-xs text-center mb-3">Credenciales de prueba</p>
          <div className="space-y-2">
            {USUARIOS.map(u => (
              <div key={u.correo} className="bg-white/5 rounded-lg px-3 py-2 text-xs text-white/50 flex justify-between">
                <span>{u.correo}</span>
                <span className={`badge ${u.rol === 'admin' ? 'badge-admin' : 'badge-tecnico'}`}>
                  {u.rol}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-white/30 text-xs mt-6">MVP v2.0 — Solo navegador local</p>
    </div>
  );
}
