import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Folder,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  File,
  ArrowLeft,
  Home,
  Download,
  RefreshCw,
  ChevronRight,
  HardDrive,
  Loader2,
  AlertCircle,
  X,
  Maximize2,
  Minimize2,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface FileItem {
  path: string;
  name: string;
  size: number;
  extension: string;
  modified: string;
  mode: number;
  isDir: boolean;
  isSymlink: boolean;
  type: string;
}

interface FileExplorerProps {
  machineIp: string;
  machineName: string;
  onClose: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const API_USER = "admin";
const API_PASS = "MinhaSenh@123";

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "—";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const formatDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

const getFileIcon = (item: FileItem) => {
  if (item.isDir) return <Folder className="text-primary" size={22} />;
  const ext = item.extension?.toLowerCase() || "";
  if ([".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".webp", ".ico"].includes(ext))
    return <FileImage className="text-blue-400" size={20} />;
  if ([".mp4", ".avi", ".mkv", ".mov", ".wmv", ".flv"].includes(ext))
    return <FileVideo className="text-purple-400" size={20} />;
  if ([".mp3", ".wav", ".flac", ".ogg", ".aac", ".wma"].includes(ext))
    return <FileAudio className="text-green-400" size={20} />;
  if ([".pdf", ".doc", ".docx", ".txt", ".xls", ".xlsx", ".ppt", ".pptx", ".csv"].includes(ext))
    return <FileText className="text-orange-400" size={20} />;
  return <File className="text-muted-foreground" size={20} />;
};

const FileExplorer = ({ machineIp, machineName, onClose, isFullscreen, onToggleFullscreen }: FileExplorerProps) => {
  const [token, setToken] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState("/");
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const baseUrl = `http://${machineIp}:8080`;

  const authenticate = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: API_USER, password: API_PASS }),
      });
      if (!res.ok) throw new Error("Falha na autenticação");
      const tok = await res.text();
      setToken(tok);
      return tok;
    } catch (e: any) {
      setError("Não foi possível conectar à máquina. Verifique se o File Browser está rodando e se você está na mesma rede.");
      setLoading(false);
      return null;
    }
  }, [baseUrl]);

  const fetchFiles = useCallback(
    async (path: string, tok?: string) => {
      const authToken = tok || token;
      if (!authToken) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${baseUrl}/api/resources${path}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.status === 401) {
          const newToken = await authenticate();
          if (newToken) return fetchFiles(path, newToken);
          return;
        }
        if (!res.ok) throw new Error("Erro ao carregar arquivos");
        const data = await res.json();
        const fileItems: FileItem[] = data.items || [];
        // Sort: folders first, then alphabetically
        fileItems.sort((a, b) => {
          if (a.isDir && !b.isDir) return -1;
          if (!a.isDir && b.isDir) return 1;
          return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
        });
        setItems(fileItems);
        setCurrentPath(path);
      } catch (e: any) {
        setError(e.message || "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    },
    [token, baseUrl, authenticate]
  );

  useEffect(() => {
    const init = async () => {
      const tok = await authenticate();
      if (tok) await fetchFiles("/", tok);
    };
    init();
  }, []);

  const navigateTo = (path: string) => {
    setSearchQuery("");
    fetchFiles(path);
  };

  const goUp = () => {
    if (currentPath === "/") return;
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    navigateTo("/" + parts.join("/"));
  };

  const handleItemClick = (item: FileItem) => {
    if (item.isDir) {
      navigateTo(item.path);
    }
  };

  const downloadFile = (item: FileItem) => {
    if (!token) return;
    const url = `${baseUrl}/api/raw${item.path}?auth=${token}`;
    window.open(url, "_blank");
  };

  const breadcrumbs = currentPath.split("/").filter(Boolean);

  const filteredItems = searchQuery
    ? items.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : items;

  const now = new Date();
  const formatTime = (d: Date) =>
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      </motion.div>

      {/* Panel */}
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
        {/* Top glow line */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-0.5 z-10"
          style={{ background: "linear-gradient(90deg, transparent, hsl(340 82% 60%), transparent)" }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
        />

        {/* Header */}
        <motion.div
          className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/30 shrink-0"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="p-2 rounded-lg bg-primary/15"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            >
              <HardDrive className="text-primary" size={18} />
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
              <h3 className="font-semibold text-sm">
                {machineName}
                <span className="text-muted-foreground font-normal ml-2">— Explorador de Arquivos</span>
              </h3>
              <p className="text-xs text-muted-foreground font-mono">{machineIp}:8080</p>
            </motion.div>
          </div>
          <motion.div className="flex items-center gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fetchFiles(currentPath)} title="Recarregar">
              <RefreshCw size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onToggleFullscreen}
              title={isFullscreen ? "Reduzir" : "Tela cheia"}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
              onClick={onClose}
              title="Fechar"
            >
              <X size={16} />
            </Button>
          </motion.div>
        </motion.div>

        {/* Navigation bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/20 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={goUp} disabled={currentPath === "/"}>
            <ArrowLeft size={14} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => navigateTo("/")}>
            <Home size={14} />
          </Button>

          <div className="flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto scrollbar-hide flex-1 min-w-0">
            <button
              className="shrink-0 hover:text-primary transition-colors font-medium"
              onClick={() => navigateTo("/")}
            >
              {machineName}
            </button>
            {breadcrumbs.map((part, i) => (
              <span key={i} className="flex items-center gap-1 shrink-0">
                <ChevronRight size={12} className="text-muted-foreground/50" />
                <button
                  className="hover:text-primary transition-colors"
                  onClick={() => navigateTo("/" + breadcrumbs.slice(0, i + 1).join("/"))}
                >
                  {part}
                </button>
              </span>
            ))}
          </div>

          <div className="relative shrink-0 w-48">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
            <Input
              className="h-7 pl-7 text-xs bg-secondary/40 border-border"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* File list */}
        <motion.div
          className="flex-1 overflow-y-auto relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Loader2 className="text-primary" size={28} />
              </motion.div>
              <p className="text-sm text-muted-foreground">Carregando arquivos...</p>
            </div>
          )}

          {error && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8">
              <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20">
                <AlertCircle className="text-destructive" size={32} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm mb-1">Erro de Conexão</p>
                <p className="text-xs text-muted-foreground max-w-sm">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setError(null);
                  const tok = await authenticate();
                  if (tok) await fetchFiles("/", tok);
                }}
              >
                <RefreshCw size={14} className="mr-2" />
                Tentar novamente
              </Button>
            </div>
          )}

          {!loading && !error && filteredItems.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Folder className="text-muted-foreground/30" size={48} />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "Nenhum arquivo encontrado" : "Pasta vazia"}
              </p>
            </div>
          )}

          {!loading && !error && filteredItems.length > 0 && (
            <div className="divide-y divide-border/50">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_100px_160px_40px] gap-3 px-5 py-2 text-xs text-muted-foreground font-medium uppercase tracking-wider bg-secondary/20 sticky top-0 z-10">
                <span>Nome</span>
                <span className="text-right">Tamanho</span>
                <span className="text-right">Modificado</span>
                <span></span>
              </div>

              <AnimatePresence mode="popLayout">
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: index * 0.02, duration: 0.2 }}
                    className={`grid grid-cols-[1fr_100px_160px_40px] gap-3 px-5 py-2.5 items-center transition-colors duration-150 ${
                      item.isDir
                        ? "hover:bg-primary/5 cursor-pointer"
                        : "hover:bg-secondary/30"
                    }`}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0">{getFileIcon(item)}</span>
                      <span className="truncate text-sm font-medium">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground text-right tabular-nums">
                      {item.isDir ? "—" : formatFileSize(item.size)}
                    </span>
                    <span className="text-xs text-muted-foreground text-right">
                      {formatDate(item.modified)}
                    </span>
                    <div className="flex justify-end">
                      {!item.isDir && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:!opacity-100 hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadFile(item);
                          }}
                          title="Baixar"
                        >
                          <Download size={14} />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div
          className="px-4 py-2 border-t border-border bg-secondary/20 flex items-center justify-between text-xs text-muted-foreground shrink-0"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <span>
            {!loading && !error && (
              <>
                {filteredItems.filter((i) => i.isDir).length} pastas,{" "}
                {filteredItems.filter((i) => !i.isDir).length} arquivos
              </>
            )}
          </span>
          <span>Dra. Fernanda Sarelli • {machineIp} • {formatTime(now)}</span>
        </motion.div>
      </motion.div>
    </>
  );
};

export default FileExplorer;
