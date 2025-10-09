"use client";

import {
  AlertCircle,
  Clock,
  Edit,
  FileImage,
  GalleryHorizontalEnd,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DashboardData = {
  stats: {
    totalTemplates: number;
    imagesGenerated: number;
    averageTime: number;
    activeUsers: number;
  };
  recentTemplates: Array<{
    id: string;
    name: string;
    usage_today: number;
    current_avg_time: number;
    created_at: string;
  }>;
  recentActivities: Array<{
    id: string;
    template_name: string;
    created_at: string;
    action: string;
  }>;
};

export default function Home() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) {
          throw new Error("Erro ao carregar dados do dashboard");
        }
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");

        // Fallback para dados mockados
        setDashboardData({
          stats: {
            totalTemplates: 3,
            imagesGenerated: 1247,
            averageTime: 2.3,
            activeUsers: 573,
          },
          recentTemplates: [],
          recentActivities: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = dashboardData?.stats || {
    totalTemplates: 3,
    imagesGenerated: 1247,
    averageTime: 2.3,
    activeUsers: 573,
  };
  return (
    <div className="flex-1 space-y-4">
      {/* Header da Dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-3xl tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Gerencie seus templates e gere imagens automaticamente para as redes
            sociais.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge
            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            variant="secondary"
          >
            Sistema Online
          </Badge>
          {loading && (
            <Badge className="animate-pulse" variant="outline">
              Carregando...
            </Badge>
          )}
          {error && (
            <Badge variant="destructive">
              <AlertCircle className="mr-1 h-3 w-3" />
              Erro na conexão
            </Badge>
          )}
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Templates Criados
            </CardTitle>
            <FileImage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.totalTemplates}</div>
            <p className="text-muted-foreground text-xs">Templates criados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Imagens Geradas
            </CardTitle>
            <GalleryHorizontalEnd className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {stats.imagesGenerated.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              Imagens geradas (30 dias)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {stats.averageTime.toFixed(1)}s
            </div>
            <p className="text-muted-foreground text-xs">
              Tempo médio de geração
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Usuários Ativos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.activeUsers}</div>
            <p className="text-muted-foreground text-xs">
              Usuários ativos (7 dias)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div className="grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex h-full cursor-pointer flex-col border-2 transition-all duration-200 hover:scale-[1.02] hover:border-primary/20 hover:shadow-lg">
          <CardHeader className="flex-1">
            <CardTitle className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <FileImage className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold text-lg">Criar Novo Template</span>
            </CardTitle>
            <CardDescription className="min-h-[3rem] text-sm leading-relaxed">
              Faça upload de uma imagem e configure placeholders para dados
              dinâmicos.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Button
              className="h-11 w-full cursor-pointer font-medium"
              onClick={() => router.push("/editor")}
            >
              Começar
            </Button>
          </CardContent>
        </Card>

        <Card className="flex h-full cursor-pointer flex-col border-2 transition-all duration-200 hover:scale-[1.02] hover:border-primary/20 hover:shadow-lg">
          <CardHeader className="flex-1">
            <CardTitle className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Edit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="font-semibold text-lg">Editar Template</span>
            </CardTitle>
            <CardDescription className="min-h-[3rem] text-sm leading-relaxed">
              Modifique um template existente ou ajuste suas configurações.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Button
              className="h-11 w-full cursor-pointer border-2 font-medium"
              onClick={() => router.push("/templates")}
              variant="outline"
            >
              Abrir Editor
            </Button>
          </CardContent>
        </Card>

        <Card className="flex h-full cursor-pointer flex-col border-2 transition-all duration-200 hover:scale-[1.02] hover:border-primary/20 hover:shadow-lg md:col-span-2 lg:col-span-1">
          <CardHeader className="flex-1">
            <CardTitle className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <GalleryHorizontalEnd className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="font-semibold text-lg">Ver Galeria</span>
            </CardTitle>
            <CardDescription className="min-h-[3rem] text-sm leading-relaxed">
              Explore todas as imagens geradas e baixe seus arquivos.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Button
              className="h-11 w-full cursor-pointer border-2 font-medium"
              onClick={() => router.push("/galeria")}
              variant="outline"
            >
              Explorar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Últimas Atividades */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Atividades</CardTitle>
          <CardDescription>
            Acompanhe as ações recentes no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData?.recentActivities &&
            dashboardData.recentActivities.length > 0 ? (
              (() => {
                const MAX_ACTIVITIES_TO_DISPLAY = 5;
                return dashboardData.recentActivities
                  .slice(0, MAX_ACTIVITIES_TO_DISPLAY)
                  .map((activity, index) => {
                    const MODULO_DIVISOR = 3;
                    const GREEN_INDEX = 0;
                    const BLUE_INDEX = 1;

                    function getActivityColorClass(
                      activityIndex: number
                    ): string {
                      if (activityIndex % MODULO_DIVISOR === GREEN_INDEX) {
                        return "bg-green-500";
                      }
                      if (activityIndex % MODULO_DIVISOR === BLUE_INDEX) {
                        return "bg-blue-500";
                      }
                      return "bg-orange-500";
                    }

                    const colorClass = getActivityColorClass(index);

                    return (
                      <div className="flex items-center" key={activity.id}>
                        <div
                          className={`mr-3 h-2 w-2 rounded-full ${colorClass}`}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {activity.template_name} - {activity.action}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {new Date(activity.created_at).toLocaleString(
                              "pt-BR"
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  });
              })()
            ) : (
              <>
                <div className="flex items-center">
                  <div className="mr-3 h-2 w-2 rounded-full bg-green-500" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      Template &ldquo;Loterias Caixa&rdquo; criado
                    </p>
                    <p className="text-muted-foreground text-xs">
                      2 minutos atrás
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="mr-3 h-2 w-2 rounded-full bg-blue-500" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      15 imagens geradas automaticamente
                    </p>
                    <p className="text-muted-foreground text-xs">
                      1 hora atrás
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="mr-3 h-2 w-2 rounded-full bg-orange-500" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      Template &ldquo;Lotofácil&rdquo; atualizado
                    </p>
                    <p className="text-muted-foreground text-xs">
                      3 horas atrás
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
