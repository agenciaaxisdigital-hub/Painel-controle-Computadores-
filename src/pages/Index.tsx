import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, FolderOpen, X, Maximize2, Minimize2, RefreshCw, Shield, Copy, ExternalLink, Home, Settings, UserSquare2, Server } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface Machine {
  name: string;
  ip: string;
  anydeskId: string;
}

const machines: Machine[] = [
  { name: "PC01", ip: "10.168.249.15", anydeskId: "1653282695" },
  { name: "PC02 - Maria", ip: "10.168.249.80", anydeskId: "1486794095" },
  { name: "PC03", ip: "10.168.249.101", anydeskId: "1509173425" },
  { name: "PC04 - Recepção", ip: "10.168.249.175", anydeskId: "1764644562" },
];

const Index = () => {
  const { toast } = useToast();
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
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [anydeskMachine, setAnydeskMachine] = useState<Machine | null>(null);
  const [connectingMachine, setConnectingMachine] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("home");

  const isPublicHttps =
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    !["localhost", "127.0.0.1"].includes(window.location.hostname);

  const canEmbedInPanel = !isPublicHttps;
  const FB_USER = "admin";
  const FB_PASS = "MinhaSenh@123";
  const getMachineUrl = (machine: Machine) => `http://${machine.ip}:8080`;

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const checkStatuses = useCallback(async () => {
    if (!canEmbedInPanel) {
      const fallback: Record<string, "online" | "offline" | "checking"> = {};
      machines.forEach((m) => (fallback[m.ip] = "checking"));
      setStatuses(fallback);
      setLastCheck(new Date());
      return;
    }

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
  }, [canEmbedInPanel]);

  useEffect(() => {
    checkStatuses();
    const t = setInterval(checkStatuses, 30000);
    return () => clearInterval(t);
  }, []);

  const autoLoginAndOpen = async (machine: Machine, target: "_blank" | "iframe") => {
    if (statuses[machine.ip] === "offline") {
      toast({
        title: "Máquina Offline",
        description: `Não é possível conectar a ${machine.name}. Verifique se ela está ligada.`,
        variant: "destructive",
      });
      return;
    }

    const baseUrl = getMachineUrl(machine);

    if (isPublicHttps) {
      window.open(baseUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setConnectingMachine(machine.ip);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${baseUrl}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: FB_USER, password: FB_PASS }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      
      setConnectingMachine(null);

      if (res.ok) {
        const token = await res.text();
        const authedUrl = `${baseUrl}/?auth=${encodeURIComponent(token)}`;
        if (target === "_blank") {
          window.open(authedUrl, "_blank", "noopener,noreferrer");
        } else {
          setAuthToken(token);
          setActiveMachine(machine);
          setIsFullscreen(false);
          setIframeKey((k) => k + 1);
        }
        return;
      }
    } catch {
      setConnectingMachine(null);
      toast({
        title: "Erro de Conexão",
        description: `Falha ao conectar na interface web da ${machine.name}.`,
        variant: "destructive",
      });
      setStatuses(prev => ({ ...prev, [machine.ip]: "offline" }));
      return;
    }

    if (target === "_blank") {
      window.open(baseUrl, "_blank", "noopener,noreferrer");
    } else {
      setAuthToken(null);
      setActiveMachine(machine);
      setIsFullscreen(false);
      setIframeKey((k) => k + 1);
    }
  };

  const openPanel = (machine: Machine) => {
    if (!canEmbedInPanel) {
      autoLoginAndOpen(machine, "_blank");
      return;
    }
    autoLoginAndOpen(machine, "iframe");
  };

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: `${label} copiado!` });
    }).catch(() => {
      toast({ title: `Erro ao copiar ${label}`, variant: "destructive" });
    });
  }, [toast]);

  const formatDate = (d: Date) =>
    d.toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "numeric", timeZone: "America/Sao_Paulo" });

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

  const statusDot = (s: "online" | "offline" | "checking") => {
    if (s === "online") return "bg-[hsl(var(--noc-green))] shadow-[0_0_8px_hsl(var(--noc-green)/0.7)]";
    if (s === "offline") return "bg-destructive shadow-[0_0_8px_hsl(var(--destructive)/0.7)]";
    return "bg-muted-foreground animate-pulse";
  };

  const statusInfo = (s: "online" | "offline" | "checking") => {
    if (s === "online") return { text: "Online", cls: "text-[hsl(var(--noc-green))]" };
    if (s === "offline") return { text: "Offline", cls: "text-destructive" };
    return { text: "Lendo...", cls: "text-muted-foreground" };
  };

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 25 } },
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col relative w-full items-center">
      
      {/* Mobile-first constraint container */}
      <div className="w-full max-w-2xl flex flex-col min-h-[100dvh] relative bg-background mx-auto shadow-2xl">
        
        {/* Sticky Header with Gradient Top Bar */}
        <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border shadow-sm">
          <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-header" />
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                <Monitor className="text-primary" size={22} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold tracking-tight leading-tight">Gestão de Computadores</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Rede Dra. Fernanda Sarelli</p>
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-primary tabular-nums">{formatTime(now)}</span>
              <span className="text-[10px] text-muted-foreground capitalize">{formatDate(now)}</span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 px-4 py-6 pb-28 space-y-6">
          
          <div className="space-y-1">
             <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Dispositivos Remotos</h2>
             <p className="text-[11px] text-muted-foreground uppercase tracking-widest">Monitoramento ZeroTier ativado</p>
          </div>

          <motion.div className="flex flex-col gap-4" variants={containerVariants} initial="hidden" animate="show">
            {machines.map((m) => {
              const s = statuses[m.ip] ?? "checking";
              const si = statusInfo(s);
              return (
                <motion.div key={m.ip} variants={cardVariants} className="bg-card rounded-2xl border border-border shadow-sm p-4 space-y-3 relative overflow-hidden">
                  
                  {/* Item Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center border border-border">
                        <Monitor className="text-primary" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{m.name}</h3>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{m.ip}</p>
                      </div>
                    </div>
                    
                    {!isPublicHttps && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/50 border border-border">
                        <span className={`h-2 w-2 rounded-full ${statusDot(s)}`} />
                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${si.cls}`}>{si.text}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button 
                      className="flex-1 h-11 rounded-xl gap-2 text-xs font-semibold shadow-lg shadow-pink-500/20 active:scale-[0.98] transition-transform bg-gradient-primary text-white border-0 hover:opacity-90"
                      onClick={() => openPanel(m)}
                      disabled={connectingMachine === m.ip}
                    >
                      {connectingMachine === m.ip ? <RefreshCw className="animate-spin" size={16} /> : <FolderOpen size={16} />}
                      {connectingMachine === m.ip ? "Conectando..." : "Arquivos"}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-11 rounded-xl gap-2 text-xs font-semibold bg-transparent border-primary/20 hover:border-primary/50 text-foreground"
                      onClick={() => setAnydeskMachine(m)}
                    >
                      <ExternalLink size={16} className="text-primary" />
                      AnyDesk
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Additional text requested */}
          <div className="pt-6 pb-2 text-center w-full">
            <p className="text-[11px] text-muted-foreground">Sistema protegido. <span className="opacity-60">mas anda pode para de funconar</span></p>
          </div>
        </main>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 w-full max-w-2xl bg-card/95 backdrop-blur-xl border-t border-border z-40 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-around h-16 px-2">
            
            <button onClick={() => setActiveTab("home")} className={`flex flex-col items-center justify-center w-16 gap-1 ${activeTab === "home" ? "text-primary font-semibold" : "text-muted-foreground"}`}>
              <Home size={22} className={activeTab === "home" ? "drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]" : ""} />
              <span className="text-[10px]">Início</span>
            </button>
            <button onClick={() => setActiveTab("devices")} className={`flex flex-col items-center justify-center w-16 gap-1 ${activeTab === "devices" ? "text-primary font-semibold" : "text-muted-foreground"}`}>
              <Server size={22} className={activeTab === "devices" ? "drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]" : ""} />
              <span className="text-[10px]">Rede</span>
            </button>
            <button onClick={() => setActiveTab("profile")} className={`flex flex-col items-center justify-center w-16 gap-1 ${activeTab === "profile" ? "text-primary font-semibold" : "text-muted-foreground"}`}>
              <UserSquare2 size={22} className={activeTab === "profile" ? "drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]" : ""} />
              <span className="text-[10px]">Perfil</span>
            </button>
            <button onClick={() => setActiveTab("settings")} className={`flex flex-col items-center justify-center w-16 gap-1 ${activeTab === "settings" ? "text-primary font-semibold" : "text-muted-foreground"}`}>
              <Settings size={22} className={activeTab === "settings" ? "drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]" : ""} />
              <span className="text-[10px]">Ajustes</span>
            </button>

          </div>
        </div>

        {/* Modal Acesso Remoto (AnyDesk) */}
        <AnimatePresence>
          {anydeskMachine && (
            <>
              <motion.div
                className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setAnydeskMachine(null)}
              />

              <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                  className="w-full max-w-[340px] rounded-2xl border border-white/10 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col"
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <div className="h-1 w-full bg-gradient-primary" />

                  {/* Header Modal */}
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <div>
                      <h3 className="font-semibold text-sm">{anydeskMachine.name}</h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Acesso AnyDesk</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => setAnydeskMachine(null)}
                    >
                      <X size={16} />
                    </Button>
                  </div>

                  {/* Body Modal */}
                  <div className="p-5 space-y-4">
                    <Button
                      className="w-full h-12 rounded-xl text-sm font-semibold bg-gradient-primary shadow-[0_4px_14px_0_rgba(236,72,153,0.3)] active:scale-[0.98] transition-all text-white border-0"
                      onClick={() => window.open(`anydesk:${anydeskMachine.anydeskId}`, "_self")}
                    >
                      Abrir Aplicativo AnyDesk
                    </Button>
                    
                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-3">
                      <p className="text-[11px] text-muted-foreground text-center">Ou use o ID exclusivo da máquina:</p>
                      
                      <div className="flex items-center gap-2">
                        <code className="flex-1 h-10 flex items-center justify-center text-sm font-mono bg-black/40 rounded-lg text-primary tracking-widest border border-white/5">
                          {anydeskMachine.anydeskId}
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 shrink-0 border-white/10 bg-white/5 hover:bg-white/10"
                          onClick={() => copyToClipboard(anydeskMachine.anydeskId, "Código")}
                        >
                          <Copy size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

        {/* Panel Iframe Container */}
        <AnimatePresence mode="wait">
          {activeMachine && (
            <>
              <motion.div 
                className="fixed inset-0 z-40 bg-black/90 backdrop-blur-xl" 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                onClick={() => setActiveMachine(null)} 
              />

              <motion.div
                className={`fixed z-50 flex flex-col overflow-hidden bg-card border-white/10 ${
                  isFullscreen ? "inset-0" : "inset-x-0 bottom-0 top-[10dvh] rounded-t-2xl border-t shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
                }`}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {!isFullscreen && (
                  <div className="flex justify-center pt-2 pb-1 bg-card">
                    <div className="w-12 h-1.5 rounded-full bg-white/20" />
                  </div>
                )}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
                  <div className="flex flex-col">
                    <h3 className="font-semibold text-sm">{activeMachine.name}</h3>
                    <p className="text-[10px] text-muted-foreground font-mono">{activeMachine.ip}:8080</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setIframeKey((k) => k + 1)}>
                      <RefreshCw size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hidden sm:flex" onClick={() => setIsFullscreen(!isFullscreen)}>
                      {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white bg-white/5" onClick={() => setActiveMachine(null)}>
                      <X size={18} />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 relative bg-black">
                  <iframe
                    key={iframeKey}
                    src={`${getMachineUrl(activeMachine)}${authToken ? `/?auth=${encodeURIComponent(authToken)}` : ''}`}
                    className="absolute inset-0 w-full h-full border-0"
                    title={`Arquivos — ${activeMachine.name}`}
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default Index;
