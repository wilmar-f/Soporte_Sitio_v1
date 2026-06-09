import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';

const SESSION_KEY = 'corbeta_usuario';

function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSession(usuario) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
}

function clearSession() {
  sessionStorage.clear();
}

export default function App() {
  const [vista, setVista] = useState('login'); // 'login' | 'dashboard' | 'admin'
  const [usuario, setUsuario] = useState(null);

  // Restaurar sesión existente
  useEffect(() => {
    const saved = getSession();
    if (saved) {
      setUsuario(saved);
      setVista('dashboard');
    }
  }, []);

  const handleLogin = (user) => {
    setSession(user);
    setUsuario(user);
    setVista('dashboard');
  };

  const handleLogout = () => {
    clearSession();
    setUsuario(null);
    setVista('login');
  };

  const handleAdmin = () => {
    if (usuario?.rol === 'admin') setVista('admin');
  };

  const handleBackToDashboard = () => {
    setVista('dashboard');
  };

  if (vista === 'login') {
    return <LoginForm onLogin={handleLogin} />;
  }

  if (vista === 'admin' && usuario?.rol === 'admin') {
    return <AdminPanel usuario={usuario} onBack={handleBackToDashboard} />;
  }

  return (
    <Dashboard
      usuario={usuario}
      onLogout={handleLogout}
      onAdmin={handleAdmin}
    />
  );
}
