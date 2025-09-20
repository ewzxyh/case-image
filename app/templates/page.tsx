import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileImage, Upload, Settings, Trash2, Edit } from "lucide-react"
import { ImageUpload } from "@/components/upload/image-upload"

export default function TemplatesPage() {
  return (
    <div className="flex-1 space-y-6">
        {/* Header da Página */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Templates</h2>
            <p className="text-muted-foreground">
              Gerencie seus templates de imagens para as redes sociais.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
              3 Templates
            </Badge>
          </div>
        </div>

        {/* Área de Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload de Template
            </CardTitle>
            <CardDescription>
              Faça upload de uma imagem base para criar um novo template.
              Suportamos PNG, JPG e JPEG com no máximo 10MB.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload />
          </CardContent>
        </Card>

        {/* Lista de Templates */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {/* Template de Exemplo 1 */}
          <Card className="group hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Mega-Sena Principal</CardTitle>
                <Badge variant="secondary">Ativo</Badge>
              </div>
              <CardDescription>
                Template principal para resultados da Mega-Sena
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preview do Template */}
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <Image
                  src="/megasena-template.png"
                  alt="Preview do template Mega-Sena"
                  width={400}
                  height={225}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <p className="font-medium text-lg">1,247</p>
                  <p className="text-muted-foreground">Usos</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-lg">2.3s</p>
                  <p className="text-muted-foreground">Tempo Médio</p>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button size="sm" variant="outline">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Template de Exemplo 2 */}
          <Card className="group hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Lotofácil Resultados</CardTitle>
                <Badge variant="outline">Inativo</Badge>
              </div>
              <CardDescription>
                Template para sorteios da Lotofácil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg flex items-center justify-center border-2 border-blue-200 dark:border-blue-800">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-3 mx-auto">
                    <span className="text-white font-bold text-xl">LF</span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Lotofácil</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Template em desenvolvimento</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <p className="font-medium text-lg">856</p>
                  <p className="text-muted-foreground">Usos</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-lg">1.8s</p>
                  <p className="text-muted-foreground">Tempo Médio</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button size="sm" variant="outline">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Template Mega-Sena Clássico */}
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-2 hover:border-primary/20 h-full flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Mega-Sena Clássico</CardTitle>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Novo</Badge>
              </div>
              <CardDescription>
                Versão clássica do template Mega-Sena com design limpo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg overflow-hidden border-2 border-green-200 dark:border-green-800">
                <Image
                  src="/megasena-template.png"
                  alt="Preview do template Mega-Sena Clássico"
                  width={400}
                  height={225}
                  className="w-full h-full object-cover opacity-90"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <p className="font-medium text-lg">0</p>
                  <p className="text-muted-foreground">Usos</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-lg">--</p>
                  <p className="text-muted-foreground">Tempo Médio</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  <Edit className="h-4 w-4 mr-2" />
                  Usar Template
                </Button>
                <Button size="sm" variant="outline">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card para Criar Novo Template */}
          <Card className="group hover:shadow-lg transition-all duration-200 border-dashed border-2 hover:border-primary/50 xl:col-span-1">
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <FileImage className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Criar Novo Template</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Comece do zero ou use um template existente como base
              </p>
              <Button className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Criar Template
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
