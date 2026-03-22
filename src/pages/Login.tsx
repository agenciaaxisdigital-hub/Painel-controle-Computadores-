import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Check } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Simple Hyperspeed Canvas Animation
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let w: number;
    let h: number;
    
    // Setup stars mapped for hyperspeed
    const numStars = 200;
    const fov = 100;
    const colors = ["#ec4899", "#f43f5e", "#c026d3", "#e879f9"];
    
    interface Star {
      x: number;
      y: number;
      z: number;
      pz: number;
      color: string;
    }
    
    let stars: Star[] = [];

    const init = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      stars = Array.from({ length: numStars }, createStar);
    };

    const createStar = (): Star => {
      return {
        x: (Math.random() - 0.5) * w * 2,
        y: (Math.random() - 0.5) * h * 2,
        z: Math.random() * w,
        pz: 0,
        color: colors[Math.floor(Math.random() * colors.length)]
      };
    };

    const draw = () => {
      ctx.fillStyle = "rgba(7, 5, 16, 0.3)"; // Turbulent effect with trails
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const speed = 18; // speed / wide street feel

      stars.forEach(star => {
        star.pz = star.z;
        star.z -= speed;

        if (star.z < 1) {
          Object.assign(star, createStar());
          star.z = w;
          star.pz = star.z;
        }

        const sx = cx + (star.x / star.z) * fov;
        const sy = cy + (star.y / star.z) * fov;
        
        const px = cx + (star.x / star.pz) * fov;
        const py = cy + (star.y / star.pz) * fov;

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.lineWidth = Math.max(0.5, (1 - star.z / w) * 3);
        ctx.strokeStyle = star.color;
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    init();
    draw();

    window.addEventListener("resize", init);
    return () => {
      window.removeEventListener("resize", init);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#070510] font-sans">
      {/* Hyperspeed Background */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Radial Gradient Overlay */}
      <div className="absolute inset-0 z-0 bg-radial-gradient from-transparent to-[#070510]/80 pointer-events-none"></div>

      {/* Core Login Form Container */}
      <main className="relative z-10 w-full max-w-sm p-4 w-[672px] sm:max-w-md mx-auto flex flex-col items-center">
        
        {/* Candidate Profile Picture */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-r from-pink-500 to-rose-400">
            <img 
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80" 
              alt="Dra. Fernanda Sarelli" 
              className="w-full h-full object-cover rounded-full border-2 border-black/50"
            />
          </div>
          {/* Online Indicator */}
          <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-[#1a1525] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
        </div>

        {/* Titles */}
        <div className="text-center mb-8 space-y-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">Dra. Fernanda Sarelli</h1>
          <p className="text-pink-400 text-[11px] uppercase tracking-[0.2em] font-medium">Sistema de Gestão Política</p>
        </div>

        {/* Form Card */}
        <form 
          onSubmit={handleLogin}
          className="w-full bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_0_25px_rgba(236,72,153,0.15)] space-y-5"
        >
          {/* Inputs */}
          <div className="space-y-4">
            <div className="relative group">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-pink-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Usuário" 
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 transition-all text-[16px]"
              />
            </div>
            
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-pink-500 transition-colors" />
              <input 
                type="password" 
                placeholder="Senha" 
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 transition-all text-[16px]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-pink-500 border-pink-500' : 'border-white/20 bg-white/5 group-hover:border-white/40'}`}>
                {rememberMe && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="text-[12px] text-white/60">Lembrar acesso</span>
            </label>

            <button type="button" className="text-[12px] text-pink-400 hover:text-pink-300 transition-colors">
              Esqueci a senha
            </button>
          </div>

          {/* Action Button */}
          <button 
            type="submit" 
            className="w-full h-12 bg-gradient-to-r from-pink-500 to-rose-400 text-white font-semibold rounded-xl shadow-[0_4px_14px_0_rgba(236,72,153,0.39)] hover:shadow-[0_6px_20px_rgba(236,72,153,0.23)] active:scale-[0.98] transition-all duration-200 mt-2"
          >
            Entrar no Painel
          </button>
        </form>

        <p className="mt-8 text-white/30 text-[10px] uppercase tracking-wider">
          Protegido por Criptografia de Ponta-a-Ponta
        </p>
      </main>
    </div>
  );
}
