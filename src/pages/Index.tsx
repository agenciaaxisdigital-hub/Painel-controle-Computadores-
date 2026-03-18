import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Monitor, FolderOpen, ExternalLink, X, Wifi } from "lucide-react";

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
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Status check
  const checkStatuses = useCallback(async () => {
    const results: Record<string, boolean> = {};
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
          results[m.ip] = true;
        } catch {
          results[m.ip] = false;
        }
      })
    );
    setStatuses(results);
    setLastCheck(new Date());
  }, []);

  useEffect(() => {
    checkStatuses();
    const t = setInterval(checkStatuses, 30000);
    return () => clearInterval(t);
  }, [checkStatuses]);

  const openDrawer = (machine: Machine) => {
    setSelectedMachine(machine);
    setDrawerOpen(true);
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

  return (
    <div className="min-h-screen bg-background text-foreground">
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

      {/* Grid */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {machines.map((m) => {
            const online = statuses[m.ip] ?? false;
            return (
              <Card
                key={m.ip}
                className="bg-card border-border hover:border-primary/40 transition-colors"
              >
                <CardContent className="p-6 flex flex-col gap-4">
                  {/* Top row */}
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
                    {/* Status */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-3 w-3 rounded-full ${
                          online
                            ? "bg-[hsl(var(--noc-green))] shadow-[0_0_8px_hsl(var(--noc-green)/0.6)]"
                            : "bg-[hsl(var(--noc-red))] shadow-[0_0_8px_hsl(var(--noc-red)/0.6)]"
                        }`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          online
                            ? "text-[hsl(var(--noc-green))]"
                            : "text-[hsl(var(--noc-red))]"
                        }`}
                      >
                        {online ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>

                  {/* Buttons */}
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
                      onClick={() => openDrawer(m)}
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
      <footer className="border-t border-border px-6 py-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>Rede protegida via ZeroTier | 5 dispositivos monitorados</p>
          <p>
            Última atualização:{" "}
            {lastCheck ? formatTime(lastCheck) : "Verificando..."}
          </p>
        </div>
      </footer>

      {/* Drawer */}
      <Drawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        direction="right"
      >
        <DrawerContent
          className="ml-auto h-full w-[60vw] rounded-l-xl rounded-t-none border-l border-border bg-card"
          style={{ maxWidth: "60vw" }}
        >
          <DrawerHeader className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Monitor className="text-primary" size={22} />
              <DrawerTitle className="text-lg">
                {selectedMachine?.name}
              </DrawerTitle>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X size={20} />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          {selectedMachine && (
            <iframe
              src={`http://${selectedMachine.ip}:8080`}
              className="flex-1 w-full h-full border-0"
              title={`Acesso remoto — ${selectedMachine.name}`}
            />
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Index;
