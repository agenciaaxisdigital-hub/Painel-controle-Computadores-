import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, FolderOpen, X, Maximize2, Minimize2, RefreshCw, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Machine {
  name: string;
  ip: string;
}

const machines: Machine[] = [
  { name: "PC01", ip: "10.168.249.15" },
  { name: "PC02 - Maria", ip: "10.168.249.80" },
  { name: "PC03", ip: "10.168.249.101" },
  { name: "PC04 - Recepção", ip: "10.168.249.175" },
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
  const [iframeKey, setIframeKey] = useState(0);

  const isPublicHttps =
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    !["localhost", "127.0.0.1"].includes(window.location.hostname);

  const canEmbedInPanel = !isPublicHttps;
  const getMachineUrl = (machine: Machine) => `http://${machine.ip}:8080`;

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
          await fetch(getMachineUrl(m), { mode: "no-cors", signal: controller.signal });
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

  const openPanel = (machine: Machine) => {
    if (!canEmbedInPanel) {
      window.open(getMachineUrl(machine), "_blank", "noopener,noreferrer");
      return;
    }

    setActiveMachine(machine);
    setIsFullscreen(false);
    setIframeKey((k) => k + 1);
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const statusDot = (s: "online" | "offline" | "checking") => {
    if (s === "online") return "bg-[hsl(var(--noc-green))] shadow-[0_0_10px_hsl(var(--noc-green)/0.7)]";
    if (s === "offline") return "bg-[hsl(var(--noc-red))] shadow-[0_0_10px_hsl(var(--noc-red)/0.7)]";
    return "bg-muted-foreground animate-pulse";
  };

  const statusInfo = (s: "online" | "offline" | "checking") => {
    if (s === "online") return { text: "Online", cls: "text-[hsl(var(--noc-green))]" };
    if (s === "offline") return { text: "Offline", cls: "text-[hsl(var(--noc-red))]" };
    return { text: "Verificando...", cls: "text-muted-foreground" };
  };

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 200, damping: 20 } },
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      <div
        className="fixed top-0 left-0 w-full h-80 pointer-events-none opacity-20"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, hsl(340 82% 60% / 0.4) 0%, transparent 70%)",
        }}
      />

      <motion.header
        className="border-b border-border px-6 py-5 z-10 relative"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <motion.div
              className="p-2.5 rounded-xl"
              style={{ background: "linear-gradient(135deg, hsl(340 82% 55%), hsl(340 82% 45%))" }}
              animate={{ boxShadow: ["0 0 0px hsl(340 82% 60% / 0)", "0 0 25px hsl(340 82% 60% / 0.4)", "0 0 0px hsl(340 82% 60% / 0)"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Shield className="text-primary-foreground" size={26} />
            </motion.div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Painel de Controle</h1>
              <p className="text-sm text-muted-foreground">Dra. Fernanda Sarelli — Rede Corporativa</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <motion.div
              className="text-3xl sm:text-4xl font-mono font-bold text-primary tabular-nums"
              key={formatTime(now)}
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {formatTime(now)}
            </motion.div>
            <p className="text-xs text-muted-foreground capitalize">{formatDate(now)}</p>
          </div>
        </div>
      </motion.header>

      {isPublicHttps && (
        <div className="max-w-5xl mx-auto px-6 pt-4 w-full">
          <div className="rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
            Domínio público (HTTPS) bloqueia acesso interno por iframe. O botão <span className="text-primary font-medium">Ver Arquivos</span> abrirá em nova aba para funcionar sem erro.
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-6 py-10 flex-1 w-full">
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-6" variants={containerVariants} initial="hidden" animate="show">
          {machines.map((m) => {
            const s = statuses[m.ip] ?? "checking";
            const si = statusInfo(s);
            return (
              <motion.div key={m.ip} variants={cardVariants}>
                <motion.div whileHover={{ scale: 1.03, y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                  <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 relative overflow-hidden">
                    <div
                      className="absolute top-0 left-0 right-0 h-0.5"
                      style={{ background: "linear-gradient(90deg, transparent, hsl(340 82% 60%), transparent)" }}
                    />
                    <CardContent className="p-6 flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <motion.div className="p-3 rounded-xl bg-primary/10 border border-primary/20" whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.5 }}>
                            <Monitor className="text-primary" size={26} />
                          </motion.div>
                          <div>
                            <h2 className="font-semibold text-lg leading-tight">{m.name}</h2>
                            <p className="text-sm text-muted-foreground font-mono">{m.ip}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <motion.span className={`h-3 w-3 rounded-full ${statusDot(s)}`} animate={s === "online" ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
                          <span className={`text-xs font-medium ${si.cls}`}>{si.text}</span>
                        </div>
                      </div>

                      <div className="mt-2">
                        <Button className="w-full gap-2 font-medium" style={{ background: "linear-gradient(135deg, hsl(340 82% 55%), hsl(340 72% 45%))" }} onClick={() => openPanel(m)}>
                          <FolderOpen size={16} />
                          Ver Arquivos
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </main>

      <motion.footer className="border-t border-border px-6 py-4 z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>Rede protegida via ZeroTier | 4 dispositivos monitorados</p>
          <p>Última atualização: {lastCheck ? formatTime(lastCheck) : "Verificando..."}</p>
        </div>
      </motion.footer>

      <AnimatePresence mode="wait">
        {activeMachine && (
          <>
            <motion.div className="fixed inset-0 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} onClick={() => setActiveMachine(null)}>
              <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
            </motion.div>

            <motion.div
              className={`fixed z-50 flex flex-col overflow-hidden border border-border bg-card ${
                isFullscreen ? "inset-3 rounded-2xl" : "top-3 right-3 bottom-3 rounded-2xl"
              }`}
              style={!isFullscreen ? { width: "70vw" } : undefined}
              initial={{ x: "110%", opacity: 0, scale: 0.9 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: "110%", opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 200, damping: 28, mass: 0.8 }}
            >
              <motion.div
                className="absolute top-0 left-0 right-0 h-0.5 z-10"
                style={{ background: "linear-gradient(90deg, transparent, hsl(340 82% 60%), transparent)" }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
              />

              <motion.div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/30 shrink-0" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }}>
                <div className="flex items-center gap-3">
                  <motion.div className="p-2 rounded-lg bg-primary/15" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 300 }}>
                    <FolderOpen className="text-primary" size={18} />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                    <h3 className="font-semibold text-sm">
                      {activeMachine.name}
                      <span className="text-muted-foreground font-normal ml-2">— Arquivos</span>
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">{activeMachine.ip}:8080</p>
                  </motion.div>
                </div>
                <motion.div className="flex items-center gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIframeKey((k) => k + 1)} title="Recarregar">
                    <RefreshCw size={14} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsFullscreen(!isFullscreen)} title={isFullscreen ? "Reduzir" : "Tela cheia"}>
                    {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive" onClick={() => setActiveMachine(null)} title="Fechar">
                    <X size={16} />
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div className="flex-1 relative bg-secondary/10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.4 }}>
                <motion.div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 pointer-events-none" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 2, duration: 0.5 }}>
                  <motion.div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                  <p className="text-sm text-muted-foreground">Conectando a {activeMachine.name}...</p>
                </motion.div>

                <iframe
                  key={iframeKey}
                  src={getMachineUrl(activeMachine)}
                  className="absolute inset-0 w-full h-full border-0"
                  title={`Arquivos — ${activeMachine.name}`}
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                />
              </motion.div>

              <motion.div className="px-4 py-2 border-t border-border bg-secondary/20 flex items-center justify-between text-xs text-muted-foreground shrink-0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <span>Dra. Fernanda Sarelli • Rede ZeroTier • {activeMachine.ip}</span>
                <span>{formatTime(now)}</span>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
