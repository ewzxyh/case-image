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
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
    const [isSaving, setIsSaving] = useState(false)


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
        // Prevenir operações simultâneas
        if (isSaving) return

        // Validação básica
        if (!templateId) {
            toast({
                title: "Erro",
                description: "ID do template não encontrado.",
                variant: "destructive"
            })
            return
        }

        setIsSaving(true)

        try {
            const response = await fetch(`/api/templates/${templateId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || 'Erro ao atualizar template')
            }

            const data = await response.json()

            // Atualizar template na lista
            setTemplatesData(prev => prev ? {
                ...prev,
                templates: prev.templates.map(t =>
                    t.id === templateId ? { ...t, ...data.template } : t
                )
            } : null)

            // Atualizar o estado local com os dados retornados da API
            if (data.template) {
                setEditingTemplate(prev => prev ? { ...prev, ...data.template } : data.template)
            }

            toast({
                title: "Alterado com sucesso",
                description: "Template atualizado!",
            })

        } catch (error) {
            console.error('Erro ao atualizar template:', error)
            toast({
                title: "Não foi alterado",
                description: error instanceof Error ? error.message : "Erro ao salvar as configurações.",
                variant: "destructive"
            })
        } finally {
            setIsSaving(false)
        }
    }

    const handleTemplateCreated = () => {
        // Recarregar lista de templates
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
                toast({
                    title: "Erro ao atualizar lista",
                    description: "A lista de templates pode não estar atualizada.",
                    variant: "destructive"
                })
            }
        }

        fetchTemplates()
    }

    const handleCloseModal = () => {
        setSelectedTemplate(null)
        setEditingTemplate(null)
        setIsSaving(false)
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
                    <ImageUpload onTemplateCreated={handleTemplateCreated} />
                </CardContent>
            </Card>

            {/* Lista de Templates */}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 items-stretch">
                {templates.map((template) => (
                    <Card key={template.id} className="group hover:shadow-lg transition-all duration-200 flex flex-col h-full">
                        <CardHeader className="pb-3 flex-shrink-0">
                            <div className="flex items-start justify-between gap-3 min-h-[2.5rem]">
                                <CardTitle className="text-lg leading-tight flex-1 min-w-0 pr-2">
                                    <span className="line-clamp-1 block">{template.name}</span>
                                </CardTitle>
                                <Badge
                                    variant={template.status === 'active' ? 'secondary' : 'outline'}
                                    className={
                                        template.status === 'active'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 flex-shrink-0 self-start mt-0.5'
                                            : template.status === 'draft'
                                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 flex-shrink-0 self-start mt-0.5'
                                                : 'flex-shrink-0 self-start mt-0.5'
                                    }
                                >
                                    {template.status === 'active' ? 'Ativo' :
                                        template.status === 'inactive' ? 'Inativo' :
                                            template.status === 'draft' ? 'Rascunho' : template.status}
                                </Badge>
                            </div>
                            <CardDescription className="overflow-hidden text-ellipsis">
                                <div className="line-clamp-1">
                                    {template.description || 'Sem descrição disponível'}
                                </div>
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4 flex-1 flex flex-col">
                            {/* Preview do Template */}
                            <div className="aspect-video bg-muted rounded-lg overflow-hidden flex-shrink-0">
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
                            <div className="grid grid-cols-2 gap-4 text-sm flex-shrink-0 min-h-[4rem]">
                                <div className="text-center flex flex-col justify-center">
                                    <p className="font-medium text-lg">{template.usage_count.toLocaleString()}</p>
                                    <p className="text-muted-foreground text-sm">Usos</p>
                                </div>
                                <div className="text-center flex flex-col justify-center">
                                    <p className="font-medium text-lg">
                                        {template.current_avg_time && typeof template.current_avg_time === 'number'
                                            ? `${template.current_avg_time.toFixed(1)}s`
                                            : '--'}
                                    </p>
                                    <p className="text-muted-foreground text-sm">Tempo Médio</p>
                                </div>
                            </div>

                            {/* Ações - sempre no final */}
                            <div className="flex gap-2 mt-auto pt-2">
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
                                            onClick={() => {
                                                setSelectedTemplate(template)
                                                setEditingTemplate(template)
                                            }}
                                        >
                                            <Settings className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[500px]">
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center gap-2">
                                                <Settings className="h-5 w-5" />
                                                Configurações do Template
                                            </DialogTitle>
                                            <DialogDescription>
                                                Configure as opções do template selecionado.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="space-y-6">
                                            {/* Informações do Template */}
                                            <div className="bg-muted/50 p-4 rounded-lg">
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="font-medium text-muted-foreground">Tipo de Loteria:</span>
                                                        <p className="capitalize">
                                                            {editingTemplate?.lottery_type || 'Não especificado'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-muted-foreground">Status Atual:</span>
                                                        <p>
                                                            {editingTemplate?.status === 'active' && '🟢 Ativo'}
                                                            {editingTemplate?.status === 'inactive' && '🔴 Inativo'}
                                                            {editingTemplate?.status === 'draft' && '📝 Rascunho'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Campos Editáveis */}
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="template-name" className="text-sm font-medium">
                                                        Nome do Template *
                                                    </Label>
                                                    <Input
                                                        id="template-name"
                                                        type="text"
                                                        className="w-full mt-1"
                                                        placeholder="Digite o nome do template"
                                                        defaultValue={editingTemplate?.name || ''}
                                                        onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                                                    />
                                                </div>

                                                <div>
                                                    <Label htmlFor="template-description" className="text-sm font-medium">
                                                        Descrição
                                                    </Label>
                                                    <Textarea
                                                        id="template-description"
                                                        className="w-full mt-1"
                                                        rows={3}
                                                        placeholder="Adicione uma descrição para o template (opcional)"
                                                        defaultValue={editingTemplate?.description || ''}
                                                        onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, description: e.target.value } : null)}
                                                    />
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Uma boa descrição ajuda na organização dos templates
                                                    </p>
                                                </div>

                                                <div>
                                                    <Label htmlFor="template-status" className="text-sm font-medium">
                                                        Status do Template
                                                    </Label>
                                                    <Select
                                                        value={editingTemplate?.status || 'active'}
                                                        onValueChange={(value) => setEditingTemplate(prev => prev ? { ...prev, status: value } : null)}
                                                    >
                                                        <SelectTrigger id="template-status" className="mt-1">
                                                            <SelectValue placeholder="Selecione o status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="active">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-green-500">●</span>
                                                                    Ativo - Disponível para uso
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="inactive">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-red-500">●</span>
                                                                    Inativo - Temporariamente indisponível
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="draft">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-orange-500">●</span>
                                                                    Rascunho - Em desenvolvimento
                                                                </div>
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <DialogFooter className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={handleCloseModal}
                                                    disabled={isSaving}
                                                >
                                                    Fechar
                                                </Button>
                                                <Button
                                                    onClick={() => handleUpdateTemplate(editingTemplate?.id || '', editingTemplate || {})}
                                                    disabled={isSaving || !editingTemplate?.name || !editingTemplate.name.trim()}
                                                >
                                                    {isSaving ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                            Salvando...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Settings className="h-4 w-4 mr-2" />
                                                            Salvar
                                                        </>
                                                    )}
                                                </Button>
                                            </DialogFooter>
                                        </div>
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
