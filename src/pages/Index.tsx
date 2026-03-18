import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, FolderOpen, ExternalLink, Wifi, X, Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Machine {
  name: string;
  ip: string;
}

const machines: Machine[] = [
  { name: "Administrador", ip: "10.168.249.176" },
  { name: "PC01", ip: "10.168.249.15" },
  { name: "pc03", ip: "10.168.249.101" },
  { name: "Recepção de PC", ip: "10.168.249.175" },
  { name: "Policial Maria", ip: "10.168.249.80" },
];

const Index = () => {
  const [now, setNow] = useState(new Date());
  const [statuses, setStatuses] = useState<Record<string, "online" | "offline" | "checking">>(() => {
    const initial: Record<string, "online" | "offline" | "checking"> = {};
    machines.forEach((m) => (initial[m.ip] = "checking"));
    return initial;
  });
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [activeMachine, setActiveMachine] = useState<Machine | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const checkStatuses = async () => {
    const results: Record<string, "online" | "offline" | "checking"> = {};
    await Promise.all(
      machines.map(async (m) => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          await fetch(`http://${m.ip}:8080`, {
            mode: "no-cors",
            signal: controller.signal,
          });
          clearTimeout(timeout);
          results[m.ip] = "online";
        } catch {
          results[m.ip] = "offline";
        }
      })
    );
    setStatuses(results);
    setLastCheck(new Date());
  };

  useEffect(() => {
    checkStatuses();
    const t = setInterval(checkStatuses, 30000);
    return () => clearInterval(t);
  }, []);

  const formatDate = (d: Date) =>
    d.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const statusColor = (s: "online" | "offline" | "checking") => {
    if (s === "online") return "bg-[hsl(var(--noc-green))] shadow-[0_0_8px_hsl(var(--noc-green)/0.6)]";
    if (s === "offline") return "bg-[hsl(var(--noc-red))] shadow-[0_0_8px_hsl(var(--noc-red)/0.6)]";
    return "bg-muted-foreground animate-pulse";
  };

  const statusLabel = (s: "online" | "offline" | "checking") => {
    if (s === "online") return { text: "Online", cls: "text-[hsl(var(--noc-green))]" };
    if (s === "offline") return { text: "Offline", cls: "text-[hsl(var(--noc-red))]" };
    return { text: "Verificando...", cls: "text-muted-foreground" };
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="border-b border-border px-6 py-5 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wifi className="text-primary" size={28} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Painel de Controle — Rede Corporativa
              </h1>
              <p className="text-sm text-muted-foreground capitalize">
                {formatDate(now)}
              </p>
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-mono font-bold text-primary tabular-nums">
            {formatTime(now)}
          </div>
        </div>
      </header>

      {/* Grid */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {machines.map((m) => {
            const s = statuses[m.ip] ?? "checking";
            const st = statusLabel(s);
            return (
              <motion.div
                key={m.ip}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card className="bg-card border-border hover:border-primary/40 transition-colors">
                  <CardContent className="p-6 flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-secondary">
                          <Monitor className="text-primary" size={28} />
                        </div>
                        <div>
                          <h2 className="font-semibold text-lg leading-tight">{m.name}</h2>
                          <p className="text-sm text-muted-foreground font-mono">{m.ip}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`h-3 w-3 rounded-full ${statusColor(s)}`} />
                        <span className={`text-xs font-medium ${st.cls}`}>{st.text}</span>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-2">
                      <Button variant="secondary" className="flex-1 gap-2" asChild>
                        <a href={`http://${m.ip}:8080`} target="_blank" rel="noopener noreferrer">
                          <FolderOpen size={16} />
                          Ver Arquivos
                        </a>
                      </Button>
                      <Button className="flex-1 gap-2" onClick={() => { setActiveMachine(m); setIsFullscreen(false); }}>
                        <ExternalLink size={16} />
                        Acessar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-4 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>Rede protegida via ZeroTier | 5 dispositivos monitorados</p>
          <p>Última atualização: {lastCheck ? formatTime(lastCheck) : "Verificando..."}</p>
        </div>
      </footer>

      {/* Painel embutido animado */}
      <AnimatePresence>
        {activeMachine && (
          <>
            {/* Overlay escuro */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setActiveMachine(null)}
            />

            {/* Painel */}
            <motion.div
              className={`fixed z-50 bg-card border border-border shadow-2xl shadow-primary/10 flex flex-col overflow-hidden ${
                isFullscreen
                  ? "inset-2 rounded-2xl"
                  : "top-4 right-4 bottom-4 rounded-2xl"
              }`}
              style={!isFullscreen ? { width: "65vw" } : undefined}
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            >
              {/* Barra do painel */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Monitor className="text-primary" size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{activeMachine.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{activeMachine.ip}:8080</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                  >
                    {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
                    onClick={() => setActiveMachine(null)}
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>

              {/* Iframe */}
              <div className="flex-1 relative">
                <iframe
                  src={`http://${activeMachine.ip}:8080`}
                  className="absolute inset-0 w-full h-full border-0"
                  title={`File Browser — ${activeMachine.name}`}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
