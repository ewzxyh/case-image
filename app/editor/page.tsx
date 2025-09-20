"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
    Save,
    Undo,
    Redo,
    ZoomIn,
    ZoomOut,
    Move,
    Type,
    Square,
    Settings,
    Eye,
    Upload,
    AlertCircle,
    Loader2,
    FileImage
} from "lucide-react"
import { useToast } from "../../hooks/use-toast"

interface Template {
    id: string
    name: string
    description: string | null
    image_url: string
    lottery_type: string | null
    status: string
    placeholders: Placeholder[]
}

interface Placeholder {
    id: string
    name: string
    type: string
    x: number
    y: number
    width: number
    height: number
    fontSize: number
    fontFamily: string
    color: string
    align: string
}

// Componente para encapsular estilos dinâmicos dos placeholders
const PlaceholderOverlay: React.FC<{ placeholder: Placeholder }> = ({ placeholder }) => {
    return (
        <div
            className="placeholder-overlay"
            data-left={placeholder.x}
            data-top={placeholder.y}
            data-width={placeholder.width}
            data-height={placeholder.height}
        >
            <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                {placeholder.name}
            </div>
        </div>
    )
}

export default function EditorPage() {
    const searchParams = useSearchParams()
    const templateId = searchParams.get('template')
    const [template, setTemplate] = useState<Template | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [selectedTool, setSelectedTool] = useState<string>('move')
    const [zoom, setZoom] = useState(1)
    const [showSettings, setShowSettings] = useState(false)
    const { toast } = useToast()


    // Estado para novo placeholder
    const [newPlaceholder, setNewPlaceholder] = useState({
        name: '',
        type: 'text',
        x: 100,
        y: 100,
        width: 200,
        height: 50,
        fontSize: 24,
        fontFamily: 'Arial',
        color: '#000000',
        align: 'left'
    })

    useEffect(() => {
        const fetchTemplate = async (id: string) => {
            try {
                setLoading(true)
                const response = await fetch(`/api/templates/${id}`)
                if (!response.ok) {
                    throw new Error('Template não encontrado')
                }
                const data = await response.json()
                setTemplate(data.template)
                setLoading(false) // Definir loading como false após carregar com sucesso
            } catch (error) {
                console.error('Erro ao carregar template:', error)
                setLoading(false)
                // Fallback para template novo em caso de erro
                setTemplate({
                    id: '',
                    name: 'Novo Template',
                    description: '',
                    image_url: '',
                    lottery_type: 'mega-sena',
                    status: 'draft',
                    placeholders: []
                })
            }
        }

        if (templateId) {
            fetchTemplate(templateId)
        } else {
            // Template novo
            setTemplate({
                id: '',
                name: 'Novo Template',
                description: '',
                image_url: '',
                lottery_type: 'mega-sena',
                status: 'draft',
                placeholders: []
            })
            setLoading(false)
        }
    }, [templateId])

    const handleSave = async () => {
        if (!template) return

        try {
            setSaving(true)
            const response = await fetch('/api/templates', {
                method: template.id ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(template),
            })

            if (!response.ok) {
                throw new Error('Erro ao salvar template')
            }

            const data = await response.json()
            setTemplate(data.template)

            toast({
                title: "Salvo com sucesso",
                description: "O template foi salvo com sucesso.",
            })
        } catch {
            toast({
                title: "Erro ao salvar",
                description: "Não foi possível salvar o template.",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    const handleAddPlaceholder = () => {
        if (!template || !newPlaceholder.name.trim()) return

        const placeholder: Placeholder = {
            id: `placeholder-${Date.now()}`,
            ...newPlaceholder
        }

        setTemplate({
            ...template,
            placeholders: [...template.placeholders, placeholder]
        })

        // Reset form
        setNewPlaceholder({
            name: '',
            type: 'text',
            x: 100,
            y: 100,
            width: 200,
            height: 50,
            fontSize: 24,
            fontFamily: 'Arial',
            color: '#000000',
            align: 'left'
        })

        toast({
            title: "Placeholder adicionado",
            description: "Novo placeholder foi adicionado ao template.",
        })
    }

    const handleRemovePlaceholder = (placeholderId: string) => {
        if (!template) return

        setTemplate({
            ...template,
            placeholders: template.placeholders.filter(p => p.id !== placeholderId)
        })

        toast({
            title: "Placeholder removido",
            description: "O placeholder foi removido do template.",
        })
    }

    const handleZoom = (direction: 'in' | 'out') => {
        const newZoom = direction === 'in'
            ? Math.min(zoom * 1.2, 3)
            : Math.max(zoom / 1.2, 0.25)
        setZoom(newZoom)
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Carregando editor...</p>
                </div>
            </div>
        )
    }

    if (!template) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Card>
                    <CardContent className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Template não encontrado</h3>
                        <p className="text-muted-foreground">O template solicitado não existe ou foi removido.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col h-screen">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold">{template.name}</h2>
                    <Badge variant={template.status === 'active' ? 'secondary' : 'outline'}>
                        {template.status === 'active' ? 'Ativo' : 'Rascunho'}
                    </Badge>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => handleZoom('out')}>
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                        {Math.round(zoom * 100)}%
                    </span>
                    <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => handleZoom('in')}>
                        <ZoomIn className="h-4 w-4" />
                    </Button>

                    <Separator orientation="vertical" className="h-6" />

                    <Button variant="outline" size="sm" className="cursor-pointer">
                        <Undo className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="cursor-pointer">
                        <Redo className="h-4 w-4" />
                    </Button>

                    <Separator orientation="vertical" className="h-6" />

                    <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setShowSettings(!showSettings)}>
                        <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="cursor-pointer">
                        <Eye className="h-4 w-4" />
                    </Button>

                    <Button
                        size="sm"
                        className="cursor-pointer"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Salvar
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar com ferramentas */}
                <div className="w-64 border-r bg-muted/20 p-4">
                    <div className="space-y-4">
                        {/* Ferramentas */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Ferramentas</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button
                                    variant={selectedTool === 'move' ? 'default' : 'outline'}
                                    size="sm"
                                    className="w-full justify-start cursor-pointer"
                                    onClick={() => setSelectedTool('move')}
                                >
                                    <Move className="h-4 w-4 mr-2" />
                                    Mover
                                </Button>
                                <Button
                                    variant={selectedTool === 'text' ? 'default' : 'outline'}
                                    size="sm"
                                    className="w-full justify-start cursor-pointer"
                                    onClick={() => setSelectedTool('text')}
                                >
                                    <Type className="h-4 w-4 mr-2" />
                                    Texto
                                </Button>
                                <Button
                                    variant={selectedTool === 'rect' ? 'default' : 'outline'}
                                    size="sm"
                                    className="w-full justify-start cursor-pointer"
                                    onClick={() => setSelectedTool('rect')}
                                >
                                    <Square className="h-4 w-4 mr-2" />
                                    Retângulo
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Placeholders */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Placeholders</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {template.placeholders.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        Nenhum placeholder adicionado
                                    </p>
                                ) : (
                                    template.placeholders.map((placeholder) => (
                                        <div
                                            key={placeholder.id}
                                            className="flex items-center justify-between p-2 bg-background rounded border"
                                        >
                                            <div>
                                                <p className="text-sm font-medium">{placeholder.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {placeholder.x}, {placeholder.y}
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="cursor-pointer"
                                                onClick={() => handleRemovePlaceholder(placeholder.id)}
                                            >
                                                ×
                                            </Button>
                                        </div>
                                    ))
                                )}

                                {/* Adicionar novo placeholder */}
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button size="sm" className="w-full cursor-pointer" variant="outline">
                                            <Type className="h-4 w-4 mr-2" />
                                            Adicionar Placeholder
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Adicionar Placeholder</DialogTitle>
                                            <DialogDescription>
                                                Configure as propriedades do novo placeholder.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="name">Nome</Label>
                                                <Input
                                                    id="name"
                                                    value={newPlaceholder.name}
                                                    onChange={(e) => setNewPlaceholder(prev => ({ ...prev, name: e.target.value }))}
                                                    placeholder="Ex: numero_concurso"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="type">Tipo</Label>
                                                <Select value={newPlaceholder.type} onValueChange={(value) => setNewPlaceholder(prev => ({ ...prev, type: value }))}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="text">Texto</SelectItem>
                                                        <SelectItem value="image">Imagem</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="x">Posição X</Label>
                                                    <Input
                                                        id="x"
                                                        type="number"
                                                        value={newPlaceholder.x}
                                                        onChange={(e) => setNewPlaceholder(prev => ({ ...prev, x: parseInt(e.target.value) || 0 }))}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="y">Posição Y</Label>
                                                    <Input
                                                        id="y"
                                                        type="number"
                                                        value={newPlaceholder.y}
                                                        onChange={(e) => setNewPlaceholder(prev => ({ ...prev, y: parseInt(e.target.value) || 0 }))}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="width">Largura</Label>
                                                    <Input
                                                        id="width"
                                                        type="number"
                                                        value={newPlaceholder.width}
                                                        onChange={(e) => setNewPlaceholder(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="height">Altura</Label>
                                                    <Input
                                                        id="height"
                                                        type="number"
                                                        value={newPlaceholder.height}
                                                        onChange={(e) => setNewPlaceholder(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                                                    />
                                                </div>
                                            </div>
                                            <Button onClick={handleAddPlaceholder} className="w-full cursor-pointer">
                                                Adicionar Placeholder
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 bg-muted/10 flex items-center justify-center p-4">
                        <div
                            className="bg-white shadow-lg rounded-lg overflow-hidden canvas-container"
                            data-zoom={zoom.toString()}
                        >
                            {template.image_url ? (
                                <div className="relative">
                                    {/* Aqui seria integrada a imagem base com Fabric.js */}
                                    <div className="w-[800px] h-[600px] bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                                        <div className="text-center">
                                            <FileImage className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500 mb-2">Canvas do Editor</p>
                                            <p className="text-sm text-gray-400">
                                                Integração com Fabric.js será implementada
                                            </p>
                                        </div>
                                    </div>

                                    {/* Placeholders overlay */}
                                    {template.placeholders.map((placeholder) => (
                                        <PlaceholderOverlay key={placeholder.id} placeholder={placeholder} />
                                    ))}
                                </div>
                            ) : (
                                <div className="w-[800px] h-[600px] bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                                    <div className="text-center">
                                        <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500 mb-4">Faça upload de uma imagem base</p>
                                        <Button variant="outline" className="cursor-pointer">
                                            <Upload className="h-4 w-4 mr-2" />
                                            Selecionar Imagem
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                    <div className="w-64 border-l bg-muted/20 p-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Configurações</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="template-name">Nome do Template</Label>
                                    <Input
                                        id="template-name"
                                        value={template.name}
                                        onChange={(e) => setTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="template-desc">Descrição</Label>
                                    <Textarea
                                        id="template-desc"
                                        value={template.description || ''}
                                        onChange={(e) => setTemplate(prev => prev ? { ...prev, description: e.target.value } : null)}
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="lottery-type">Tipo de Loteria</Label>
                                    <Select
                                        value={template.lottery_type || 'mega-sena'}
                                        onValueChange={(value) => setTemplate(prev => prev ? { ...prev, lottery_type: value } : null)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="mega-sena">Mega-Sena</SelectItem>
                                            <SelectItem value="lotofacil">Lotofácil</SelectItem>
                                            <SelectItem value="quina">Quina</SelectItem>
                                            <SelectItem value="lotomania">Lotomania</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}
