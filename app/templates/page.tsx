"use client"

import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileImage, Upload, Settings, Trash2, Edit, AlertCircle, Loader2 } from "lucide-react"
import { ImageUpload } from "@/components/upload/image-upload"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "../../hooks/use-toast"

interface Template {
    id: string
    name: string
    description: string | null
    image_url: string
    lottery_type: string | null
    status: string
    usage_count: number
    usage_today: number
    current_avg_time: number | null
    created_at: string
}

interface TemplatesData {
    templates: Template[]
    total: number
    status: string
}

export default function TemplatesPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [templatesData, setTemplatesData] = useState<TemplatesData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const response = await fetch('/api/templates')
                if (!response.ok) {
                    throw new Error('Erro ao carregar templates')
                }
                const data = await response.json()
                setTemplatesData(data)
            } catch (err) {
                console.error('Erro ao buscar templates:', err)
                setError(err instanceof Error ? err.message : 'Erro desconhecido')

                // Fallback para dados mockados
                setTemplatesData({
                    templates: [
                        {
                            id: '550e8400-e29b-41d4-a716-446655440001',
                            name: 'Mega-Sena Principal',
                            description: 'Template principal para resultados da Mega-Sena',
                            image_url: '/megasena-template.png',
                            lottery_type: 'mega-sena',
                            status: 'active',
                            usage_count: 1247,
                            usage_today: 15,
                            current_avg_time: 2.3,
                            created_at: new Date().toISOString()
                        },
                        {
                            id: '550e8400-e29b-41d4-a716-446655440002',
                            name: 'Lotofácil Resultados',
                            description: 'Template para sorteios da Lotofácil',
                            image_url: '/lotofacil-template.png',
                            lottery_type: 'lotofacil',
                            status: 'inactive',
                            usage_count: 856,
                            usage_today: 8,
                            current_avg_time: 1.8,
                            created_at: new Date().toISOString()
                        },
                        {
                            id: '550e8400-e29b-41d4-a716-446655440003',
                            name: 'Mega-Sena Clássico',
                            description: 'Versão clássica do template Mega-Sena com design limpo',
                            image_url: '/megasena-template.png',
                            lottery_type: 'mega-sena',
                            status: 'active',
                            usage_count: 0,
                            usage_today: 0,
                            current_avg_time: null,
                            created_at: new Date().toISOString()
                        }
                    ],
                    total: 3,
                    status: 'active'
                })
            } finally {
                setLoading(false)
            }
        }

        fetchTemplates()
    }, [])

    const templates = templatesData?.templates || []
    const totalTemplates = templatesData?.total || 0

    const handleEditTemplate = (template: Template) => {
        router.push(`/editor?template=${template.id}`)
    }

    const handleDeleteTemplate = async (templateId: string) => {
        try {
            const response = await fetch(`/api/templates/${templateId}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error('Erro ao excluir template')
            }

            // Atualizar lista de templates
            setTemplatesData(prev => prev ? {
                ...prev,
                templates: prev.templates.filter(t => t.id !== templateId),
                total: prev.total - 1
            } : null)

            toast({
                title: "Template excluído",
                description: "O template foi removido com sucesso.",
            })
        } catch {
            toast({
                title: "Erro ao excluir",
                description: "Não foi possível excluir o template.",
                variant: "destructive"
            })
        }
    }

    const handleUpdateTemplate = async (templateId: string, updates: Partial<Template>) => {
        try {
            const response = await fetch(`/api/templates/${templateId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates),
            })

            if (!response.ok) {
                throw new Error('Erro ao atualizar template')
            }

            const data = await response.json()

            // Atualizar template na lista
            setTemplatesData(prev => prev ? {
                ...prev,
                templates: prev.templates.map(t =>
                    t.id === templateId ? { ...t, ...data.template } : t
                )
            } : null)

            toast({
                title: "Template atualizado",
                description: "As configurações foram salvas com sucesso.",
            })

            setSelectedTemplate(null)
        } catch {
            toast({
                title: "Erro ao atualizar",
                description: "Não foi possível salvar as configurações.",
                variant: "destructive"
            })
        }
    }

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
                        {totalTemplates} Template{totalTemplates !== 1 ? 's' : ''}
                    </Badge>
                    {loading && (
                        <Badge variant="outline" className="animate-pulse">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Carregando...
                        </Badge>
                    )}
                    {error && (
                        <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Erro na conexão
                        </Badge>
                    )}
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
                {templates.map((template) => (
                    <Card key={template.id} className="group hover:shadow-lg transition-all duration-200">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{template.name}</CardTitle>
                                <Badge
                                    variant={template.status === 'active' ? 'secondary' : 'outline'}
                                    className={
                                        template.status === 'active'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                            : template.status === 'draft'
                                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
                                                : ''
                                    }
                                >
                                    {template.status === 'active' ? 'Ativo' :
                                        template.status === 'inactive' ? 'Inativo' :
                                            template.status === 'draft' ? 'Rascunho' : template.status}
                                </Badge>
                            </div>
                            <CardDescription>
                                {template.description || 'Sem descrição disponível'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Preview do Template */}
                            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                                {template.image_url ? (
                                    <Image
                                        src={template.image_url}
                                        alt={`Preview do template ${template.name}`}
                                        width={400}
                                        height={225}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <FileImage className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                )}
                            </div>

                            {/* Estatísticas */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="text-center">
                                    <p className="font-medium text-lg">{template.usage_count.toLocaleString()}</p>
                                    <p className="text-muted-foreground">Usos</p>
                                </div>
                                <div className="text-center">
                                    <p className="font-medium text-lg">
                                        {template.current_avg_time && typeof template.current_avg_time === 'number'
                                            ? `${template.current_avg_time.toFixed(1)}s`
                                            : '--'}
                                    </p>
                                    <p className="text-muted-foreground">Tempo Médio</p>
                                </div>
                            </div>

                            {/* Ações */}
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    className="flex-1 cursor-pointer"
                                    onClick={() => handleEditTemplate(template)}
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    {template.status === 'active' ? 'Editar' : 'Visualizar'}
                                </Button>

                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="cursor-pointer"
                                            onClick={() => setSelectedTemplate(template)}
                                        >
                                            <Settings className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Configurações do Template</DialogTitle>
                                            <DialogDescription>
                                                Ajuste as configurações do template &ldquo;{selectedTemplate?.name}&rdquo;.
                                            </DialogDescription>
                                        </DialogHeader>
                                        {selectedTemplate && (
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="template-name">Nome</Label>
                                                    <Input
                                                        id="template-name"
                                                        type="text"
                                                        className="w-full mt-1"
                                                        defaultValue={selectedTemplate.name}
                                                        onChange={(e) => setSelectedTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="template-description">Descrição</Label>
                                                    <Textarea
                                                        id="template-description"
                                                        className="w-full mt-1"
                                                        rows={3}
                                                        defaultValue={selectedTemplate.description || ''}
                                                        onChange={(e) => setSelectedTemplate(prev => prev ? { ...prev, description: e.target.value } : null)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="template-status">Status</Label>
                                                    <Select
                                                        value={selectedTemplate.status}
                                                        onValueChange={(value) => setSelectedTemplate(prev => prev ? { ...prev, status: value } : null)}
                                                    >
                                                        <SelectTrigger id="template-status">
                                                            <SelectValue placeholder="Selecione o status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="active">Ativo</SelectItem>
                                                            <SelectItem value="inactive">Inativo</SelectItem>
                                                            <SelectItem value="draft">Rascunho</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <DialogFooter>
                                                    <Button
                                                        onClick={() => handleUpdateTemplate(selectedTemplate.id, selectedTemplate)}
                                                        disabled={!selectedTemplate.name.trim()}
                                                    >
                                                        Salvar Alterações
                                                    </Button>
                                                </DialogFooter>
                                            </div>
                                        )}
                                    </DialogContent>
                                </Dialog>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="outline" className="cursor-pointer">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Excluir Template</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Tem certeza que deseja excluir o template &ldquo;{template.name}&rdquo;?
                                                Esta ação não pode ser desfeita.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handleDeleteTemplate(template.id)}
                                                className="bg-red-600 hover:bg-red-700"
                                            >
                                                Excluir
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardContent>
                    </Card>
                ))}

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
                        <Button
                            className="w-full cursor-pointer"
                            onClick={() => router.push('/editor')}
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Criar Template
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
