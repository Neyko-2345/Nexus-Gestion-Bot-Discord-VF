import React, { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Play, Square, Activity, Server, Command, Clock, Terminal, Trash2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  useGetBotStatus, 
  useGetBotLogs, 
  useStartBot, 
  useStopBot,
  getGetBotStatusQueryKey,
  getGetBotLogsQueryKey
} from "@workspace/api-client-react";

export default function Dashboard() {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [localLogs, setLocalLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: status, isLoading: isLoadingStatus } = useGetBotStatus(undefined, {
    query: { refetchInterval: 3000 }
  });

  const { data: logsData } = useGetBotLogs(undefined, {
    query: { refetchInterval: 3000 }
  });

  const startBot = useStartBot();
  const stopBot = useStopBot();

  useEffect(() => {
    if (logsData?.lines) {
      setLocalLogs((prev) => {
        // Just replace with the server lines or append, assuming server sends all recent lines
        return logsData.lines;
      });
    }
  }, [logsData]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localLogs]);

  const handleStart = () => {
    if (!token.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un token valide.",
        variant: "destructive"
      });
      return;
    }
    startBot.mutate({ data: { token } }, {
      onSuccess: () => {
        toast({ title: "Succès", description: "Le bot a été démarré." });
        queryClient.invalidateQueries({ queryKey: getGetBotStatusQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetBotLogsQueryKey() });
        setToken("");
      },
      onError: (err: any) => {
        toast({
          title: "Erreur de démarrage",
          description: err?.error || "Impossible de démarrer le bot.",
          variant: "destructive"
        });
      }
    });
  };

  const handleStop = () => {
    stopBot.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Succès", description: "Le bot a été arrêté." });
        queryClient.invalidateQueries({ queryKey: getGetBotStatusQueryKey() });
      },
      onError: (err: any) => {
        toast({
          title: "Erreur",
          description: "Impossible d'arrêter le bot.",
          variant: "destructive"
        });
      }
    });
  };

  const handleClearLogs = () => {
    setLocalLogs([]);
  };

  const formatUptime = (seconds: number | null | undefined) => {
    if (!seconds) return "0 h 0 min 0 sec";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h} h ${m} min ${s} sec`;
  };

  const isRunning = status?.running;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 font-sans selection:bg-primary/30">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex items-center gap-3 pb-6 border-b border-border/50">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(21,25,240,0.4)]">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Nexus Bot Panel</h1>
            <p className="text-sm text-muted-foreground">Centre de commande professionnel</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Content - Left Col */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Status Card */}
            <Card className="border-border/50 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-transparent opacity-50" />
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Statut du système
                  </CardTitle>
                  <Badge 
                    variant={isRunning ? "default" : "destructive"} 
                    className={`px-3 py-1 font-medium ${isRunning ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20'}`}
                  >
                    {isRunning ? "En ligne" : "Hors ligne"}
                    {isRunning && <span className="ml-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1 p-3 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" /> Identifiant
                    </div>
                    <div className="font-mono text-sm font-medium truncate" title={status?.username || "N/A"}>
                      {status?.username || "—"}
                    </div>
                  </div>
                  <div className="space-y-1 p-3 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5" /> Serveurs
                    </div>
                    <div className="font-mono text-sm font-medium">
                      {status?.guilds ?? 0}
                    </div>
                  </div>
                  <div className="space-y-1 p-3 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Command className="w-3.5 h-3.5" /> Commandes
                    </div>
                    <div className="font-mono text-sm font-medium">
                      {status?.commands ?? 0}
                    </div>
                  </div>
                  <div className="space-y-1 p-3 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Temps actif
                    </div>
                    <div className="font-mono text-xs font-medium">
                      {formatUptime(status?.uptime)}
                    </div>
                  </div>
                </div>
                {status?.id && (
                  <div className="mt-4 text-xs text-muted-foreground font-mono">
                    ID Client: {status.id} | Version: {status.version || "1.0.0"}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Logs Panel */}
            <Card className="border-border/50 bg-[#0a0a0a] shadow-xl flex flex-col h-[400px]">
              <CardHeader className="py-3 px-4 border-b border-border/50 bg-secondary/30 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Terminal className="w-4 h-4" />
                  Terminal de logs
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClearLogs}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Effacer
                </Button>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden relative">
                <div className="absolute inset-0 overflow-y-auto p-4 font-mono text-xs leading-relaxed space-y-1">
                  {localLogs.length === 0 ? (
                    <div className="text-muted-foreground/50 italic">En attente de logs...</div>
                  ) : (
                    localLogs.map((log, i) => (
                      <div key={i} className="flex">
                        <span className="text-muted-foreground/40 mr-3 select-none">{(i + 1).toString().padStart(3, '0')}</span>
                        <span className="text-emerald-400/90 whitespace-pre-wrap break-all">{log}</span>
                      </div>
                    ))
                  )}
                  <div ref={logsEndRef} />
                </div>
              </CardContent>
            </Card>
            
          </div>

          {/* Controls - Right Col */}
          <div className="space-y-6">
            <Card className="border-primary/20 bg-card/50 shadow-xl overflow-hidden relative">
              <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
              <CardHeader>
                <CardTitle className="text-lg">Authentification</CardTitle>
                <CardDescription>Entrez le token de votre bot Discord pour l'initialiser.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Token Discord</label>
                  <div className="relative">
                    <Input
                      type={showToken ? "text" : "password"}
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="MTE..."
                      className="pr-10 bg-background/50 font-mono text-sm border-border/50 focus-visible:ring-primary/50"
                      disabled={startBot.isPending || isRunning}
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={startBot.isPending || isRunning}
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    className="w-full font-medium h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(21,25,240,0.3)]"
                    onClick={handleStart}
                    disabled={startBot.isPending || isRunning || !token.trim()}
                  >
                    {startBot.isPending ? (
                      <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" /> Démarrage...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Play className="w-4 h-4" /> Connecter le Bot</span>
                    )}
                  </Button>
                  
                  <Button 
                    variant="destructive"
                    className="w-full font-medium h-11 bg-destructive/90 hover:bg-destructive shadow-[0_0_15px_rgba(220,38,38,0.2)]"
                    onClick={handleStop}
                    disabled={stopBot.isPending || !isRunning}
                  >
                    {stopBot.isPending ? (
                      <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" /> Arrêt...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Square className="w-4 h-4" fill="currentColor" /> Déconnecter</span>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
        </div>
      </div>
    </div>
  );
}
