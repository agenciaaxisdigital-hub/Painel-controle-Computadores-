import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, FolderOpen, ExternalLink, Wifi, AlertTriangle } from "lucide-react";

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

const FB_USER = "admin";
const FB_PASS = "MinhaSenh@123";

const Index = () => {
  const [now, setNow] = useState(new Date());
  const [statuses, setStatuses] = useState<Record<string, "online" | "offline" | "checking">>(() => {
    const initial: Record<string, "online" | "offline" | "checking"> = {};
    machines.forEach((m) => (initial[m.ip] = "checking"));
    return initial;
  });
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Status check — tenta login na API do File Browser
  const checkStatuses = async () => {
    const results: Record<string, "online" | "offline" | "checking"> = {};
    await Promise.all(
      machines.map(async (m) => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          await fetch(`http://${m.ip}:8080/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: FB_USER, password: FB_PASS }),
            signal: controller.signal,
          });
          clearTimeout(timeout);
          // Se chegou aqui sem erro de rede, está online
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

  const openFileBrowser = (machine: Machine) => {
    const url = `http://${machine.ip}:8080`;
    const w = Math.round(window.screen.width * 0.75);
    const h = Math.round(window.screen.height * 0.8);
    const left = Math.round((window.screen.width - w) / 2);
    const top = Math.round((window.screen.height - h) / 2);
    window.open(
      url,
      `fb_${machine.ip}`,
      `width=${w},height=${h},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
    );
  };

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

  const statusText = (s: "online" | "offline" | "checking") => {
    if (s === "online") return { text: "Online", cls: "text-[hsl(var(--noc-green))]" };
    if (s === "offline") return { text: "Offline", cls: "text-[hsl(var(--noc-red))]" };
    return { text: "Verificando...", cls: "text-muted-foreground" };
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-5">
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

      {/* Aviso HTTPS */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-400">
          <AlertTriangle size={16} className="shrink-0" />
          <span>
            Para melhor funcionamento, acesse este painel diretamente pelo IP de uma máquina da rede ZeroTier (ex: <code className="bg-secondary px-1 rounded">http://10.168.249.176:3000</code>).
            O acesso via HTTPS pode bloquear conexões HTTP locais.
          </span>
        </div>
      </div>

      {/* Grid */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {machines.map((m) => {
            const s = statuses[m.ip] ?? "checking";
            const st = statusText(s);
            return (
              <Card
                key={m.ip}
                className="bg-card border-border hover:border-primary/40 transition-colors"
              >
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-secondary">
                        <Monitor className="text-primary" size={28} />
                      </div>
                      <div>
                        <h2 className="font-semibold text-lg leading-tight">
                          {m.name}
                        </h2>
                        <p className="text-sm text-muted-foreground font-mono">
                          {m.ip}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${statusColor(s)}`} />
                      <span className={`text-xs font-medium ${st.cls}`}>
                        {st.text}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-2">
                    <Button
                      variant="secondary"
                      className="flex-1 gap-2"
                      asChild
                    >
                      <a
                        href={`http://${m.ip}:8080`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FolderOpen size={16} />
                        Ver Arquivos
                      </a>
                    </Button>
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => openFileBrowser(m)}
                    >
                      <ExternalLink size={16} />
                      Acessar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>Rede protegida via ZeroTier | 5 dispositivos monitorados</p>
          <p>
            Última atualização:{" "}
            {lastCheck ? formatTime(lastCheck) : "Verificando..."}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
