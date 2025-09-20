import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileImage, Edit, GalleryHorizontalEnd, Clock, Users } from "lucide-react"

export default function Home() {
  return (
    <div className="flex-1 space-y-4">
      {/* Header da Dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Gerencie seus templates e gere imagens automaticamente para as redes sociais.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            Sistema Online
          </Badge>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates Criados</CardTitle>
            <FileImage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 desde ontem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Imagens Geradas</CardTitle>
            <GalleryHorizontalEnd className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">
              +15% em relação ao mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3s</div>
            <p className="text-xs text-muted-foreground">
              -0.2s desde a última semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">573</div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao mês passado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-2 hover:border-primary/20 h-full flex flex-col">
          <CardHeader className="flex-1">
            <CardTitle className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <FileImage className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-semibold">Criar Novo Template</span>
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed min-h-[3rem]">
              Faça upload de uma imagem e configure placeholders para dados dinâmicos.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Button className="w-full h-11 font-medium">
              Começar
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-2 hover:border-primary/20 h-full flex flex-col">
          <CardHeader className="flex-1">
            <CardTitle className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Edit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-lg font-semibold">Editar Template</span>
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed min-h-[3rem]">
              Modifique um template existente ou ajuste suas configurações.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Button variant="outline" className="w-full h-11 font-medium border-2">
              Abrir Editor
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-2 hover:border-primary/20 md:col-span-2 lg:col-span-1 h-full flex flex-col">
          <CardHeader className="flex-1">
            <CardTitle className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <GalleryHorizontalEnd className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-lg font-semibold">Ver Galeria</span>
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed min-h-[3rem]">
              Explore todas as imagens geradas e baixe seus arquivos.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Button variant="outline" className="w-full h-11 font-medium border-2">
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
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Template &ldquo;Loterias Caixa&rdquo; criado</p>
                <p className="text-xs text-muted-foreground">2 minutos atrás</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">15 imagens geradas automaticamente</p>
                <p className="text-xs text-muted-foreground">1 hora atrás</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Template &ldquo;Lotofácil&rdquo; atualizado</p>
                <p className="text-xs text-muted-foreground">3 horas atrás</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
