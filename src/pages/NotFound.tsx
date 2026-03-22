import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#070510] relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-radial-gradient from-transparent to-[#070510]/80 pointer-events-none" />
      
      <div className="text-center relative z-10 space-y-6">
        <div className="flex justify-center mb-4 text-pink-500 animate-pulse">
          <AlertTriangle size={64} />
        </div>
        <h1 className="text-6xl font-bold text-white tracking-widest shadow-pink-500/20 drop-shadow-2xl">
          404
        </h1>
        <p className="text-sm uppercase tracking-[0.2em] text-pink-400 font-medium pb-2">
          Página não encontrada
        </p>
        
        <Link 
          to="/" 
          className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-400 text-white text-sm font-semibold rounded-xl shadow-[0_4px_14px_0_rgba(236,72,153,0.39)] hover:shadow-[0_6px_20px_rgba(236,72,153,0.23)] active:scale-[0.98] transition-all duration-200"
        >
          Voltar ao Painel
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
