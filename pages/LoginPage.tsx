
import React, { useState } from 'react';
import { useAuth } from '../App';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError('Credenciales inválidas. Verifica tus datos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#b10000] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md p-10 md:p-14">
        <div className="text-center mb-12">
          <div className="flex flex-col items-center justify-center brand-logo-text leading-[0.75]">
            <span className="text-5xl">La</span>
            <span className="text-7xl mt-2">Dupla</span>
          </div>
          <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-8">Portal de Clientes</p>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-100 text-red-700 px-5 py-4 rounded-2xl flex items-center gap-3 text-sm font-bold">
            <AlertCircle size={20} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Correo Clínico</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                required
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 pl-14 pr-6 focus:ring-4 focus:ring-red-100 focus:border-[#b10000] outline-none transition-all font-bold text-gray-900"
                placeholder="tu@agencia.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                required
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 pl-14 pr-6 focus:ring-4 focus:ring-red-100 focus:border-[#b10000] outline-none transition-all font-bold text-gray-900"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#b10000] hover:bg-[#8e0000] text-white font-black py-6 rounded-[2rem] transition-all shadow-2xl shadow-red-200 flex items-center justify-center gap-3 disabled:opacity-70 uppercase tracking-widest text-sm active:scale-95"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Acceder al Tablero'}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          <p>© {new Date().getFullYear()} La Dupla - Marketing de Resultados</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
