"use client"

import { useEffect, useState, useRef, useCallback, useLayoutEffect } from "react"
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
    Layers,
    Image,
    GripVertical,
    RotateCcw,
    Replace
} from "lucide-react"
import { useToast } from "../../hooks/use-toast"
import { Canvas, Rect, Text, FabricImage, FabricObject } from 'fabric'

// Extensão do tipo FabricObject para incluir customId
declare module 'fabric' {
    interface FabricObject {
        customId?: string
    }
}
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Template {
    id: string
    name: string
    description: string | null
    image_url: string
    lottery_type: string | null
    status: string
    image_is_background: boolean
    canvas_width: number | null
    canvas_height: number | null
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

// Componente para item arrastável das camadas
const SortableLayerItem: React.FC<{
    layer: { id: string; type: string; name: string; visible: boolean }
    onToggleVisibility: (id: string) => void
    onSelect: (id: string) => void
    isSelected: boolean
}> = ({ layer, onToggleVisibility, onSelect, isSelected }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: layer.id })

    const elementRef = useRef<HTMLElement | null>(null)

    // Apply transform directly to DOM element for @dnd-kit compatibility
    useLayoutEffect(() => {
        if (elementRef.current && transform) {
            const transformString = CSS.Transform.toString(transform)
            if (transformString) {
                elementRef.current.style.transform = transformString
                elementRef.current.style.transition = transition ? transition : 'none'
            }
        } else if (elementRef.current && !transform) {
            // Reset transform when not dragging
            elementRef.current.style.transform = 'none'
            elementRef.current.style.transition = 'none'
        }
    }, [transform, transition])

    /* eslint-disable jsx-a11y/alt-text */
    const getIcon = () => {
        switch (layer.type) {
            case 'background': return <Image className="h-4 w-4" aria-hidden="true" />
            case 'text': return <Type className="h-4 w-4" aria-hidden="true" />
            case 'rect': return <Square className="h-4 w-4" aria-hidden="true" />
            default: return <Square className="h-4 w-4" aria-hidden="true" />
        }
    }
    /* eslint-enable jsx-a11y/alt-text */

    return (
        <div
            ref={(node) => {
                setNodeRef(node)
                elementRef.current = node
            }}
            className={`sortable-layer flex items-center gap-2 p-2 rounded border cursor-pointer ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-background hover:bg-muted/50'
                }`}
            onClick={() => onSelect(layer.id)}
        >
            <div {...attributes} {...listeners} className="cursor-grab">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            {getIcon()}
            <span className="flex-1 text-sm truncate">{layer.name}</span>
            <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                    e.stopPropagation()
                    onToggleVisibility(layer.id)
                }}
            >
                <Eye className={`h-3 w-3 ${layer.visible ? 'text-foreground' : 'text-muted-foreground'}`} />
            </Button>
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
    const [showLayers, setShowLayers] = useState(false)
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
    const [layers, setLayers] = useState<Array<{ id: string; type: string; name: string; visible: boolean }>>([])
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fabricCanvasRef = useRef<Canvas | null>(null)
    const backgroundImageRef = useRef<FabricImage | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const loadedImageUrlRef = useRef<string>('')
    const objectIdCounterRef = useRef<number>(0) // Contador para IDs únicos
    const { toast } = useToast()

    // Função helper para gerar IDs únicos
    const generateUniqueId = useCallback(() => {
        objectIdCounterRef.current += 1
        return `obj-${Date.now()}-${objectIdCounterRef.current}`
    }, [])

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Inicializar canvas do Fabric.js
    const initializeCanvas = useCallback(async () => {
        if (!canvasRef.current || fabricCanvasRef.current) return

        const canvasWidth = template?.canvas_width || 800
        const canvasHeight = template?.canvas_height || 600

        setCanvasSize({ width: canvasWidth, height: canvasHeight })

        const fabricCanvas = new Canvas(canvasRef.current, {
            width: canvasWidth,
            height: canvasHeight,
            backgroundColor: '#ffffff',
            selection: true,
            preserveObjectStacking: true,
        })

        fabricCanvasRef.current = fabricCanvas

        // Configurar eventos do canvas
        fabricCanvas.on('selection:created', (e) => {
            const selectedObject = e.selected?.[0]
            if (selectedObject && selectedObject instanceof Rect) {
                setSelectedTool('rect')
            } else if (selectedObject && selectedObject instanceof Text) {
                setSelectedTool('text')
            } else if (selectedObject && selectedObject instanceof FabricImage) {
                setSelectedTool('image')
            } else {
                setSelectedTool('move')
            }
        })

        fabricCanvas.on('selection:cleared', () => {
            setSelectedTool('move')
        })

        fabricCanvas.on('object:modified', () => {
            updateLayers()
        })

        // Adicionar event listeners para zoom e pan
        const canvasElement = canvasRef.current
        if (canvasElement) {
            canvasElement.addEventListener('wheel', handleCanvasZoom)
            canvasElement.addEventListener('mousemove', handleCanvasPan)
        }

        // Carregar imagem de fundo e placeholders será feito nos useEffect separados

        return () => {
            if (canvasElement) {
                canvasElement.removeEventListener('wheel', handleCanvasZoom)
                canvasElement.removeEventListener('mousemove', handleCanvasPan)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [template?.canvas_width, template?.canvas_height])

    // Função de zoom do canvas
    const handleZoom = useCallback((direction: 'in' | 'out') => {
        const newZoom = direction === 'in'
            ? Math.min(zoom * 1.2, 3)
            : Math.max(zoom / 1.2, 0.1)
        setZoom(newZoom)

        // Aplicar zoom ao canvas do Fabric.js
        if (fabricCanvasRef.current) {
            fabricCanvasRef.current.setZoom(newZoom)

            // Preservar proporções dos objetos baseadas no zoom
            const objects = fabricCanvasRef.current.getObjects()
            objects.forEach(obj => {
                if (obj instanceof Text) {
                    // Ajustar tamanho da fonte baseado no zoom para manter legibilidade
                    const baseScale = 1 / zoom // escala base
                    const newScale = 1 / newZoom // nova escala
                    const scaleRatio = newScale / baseScale

                    obj.set({
                        scaleX: (obj.scaleX || 1) * scaleRatio,
                        scaleY: (obj.scaleY || 1) * scaleRatio
                    })
                }
            })

            fabricCanvasRef.current.renderAll()
        }
    }, [zoom])

    // Funções de zoom e pan do canvas
    const handleCanvasZoom = useCallback((event: WheelEvent) => {
        event.preventDefault()
        const delta = event.deltaY > 0 ? 'out' : 'in'
        handleZoom(delta)
    }, [handleZoom])

    const handleCanvasPan = useCallback((event: MouseEvent) => {
        if (!fabricCanvasRef.current) return

        const canvas = fabricCanvasRef.current
        if (event.buttons === 4 || (event.buttons === 1 && event.altKey)) { // Botão do meio ou Alt+click
            const deltaX = event.movementX
            const deltaY = event.movementY

            const vpt = canvas.viewportTransform!
            vpt[4] += deltaX
            vpt[5] += deltaY

            canvas.requestRenderAll()
        }
    }, [])

    // Atualizar lista de camadas
    const updateLayers = useCallback(() => {
        if (!fabricCanvasRef.current) return

        const objects = fabricCanvasRef.current.getObjects()
        const newLayers: Array<{ id: string; type: string; name: string; visible: boolean }> = []

        // Adicionar imagem de fundo se existir
        if (backgroundImageRef.current) {
            newLayers.push({
                id: 'background',
                type: 'background',
                name: 'Imagem de Fundo',
                visible: backgroundImageRef.current.visible !== false
            })
        }

        // Adicionar objetos do canvas
        objects.forEach(obj => {
            if (obj !== backgroundImageRef.current) {
                let type = 'shape'
                let name = 'Elemento'

                if (obj instanceof Text) {
                    type = 'text'
                    name = obj.text || 'Texto'
                } else if (obj instanceof Rect) {
                    type = 'rect'
                    name = 'Retângulo'
                } else if (obj instanceof FabricImage) {
                    type = 'image'
                    name = 'Imagem'
                }

                const objId = obj.customId || generateUniqueId()
                if (!obj.customId) {
                    obj.customId = objId
                }

                newLayers.push({
                    id: objId,
                    type,
                    name,
                    visible: obj.visible !== false
                })
            }
        })

        setLayers(newLayers)
    }, [generateUniqueId])

    // Funções para gerenciar camadas
    const handleLayerDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = layers.findIndex(layer => layer.id === active.id)
            const newIndex = layers.findIndex(layer => layer.id === over.id)

            const newLayers = arrayMove(layers, oldIndex, newIndex)
            setLayers(newLayers)

            // Reordenar objetos no canvas
            if (fabricCanvasRef.current) {
                const objects = fabricCanvasRef.current.getObjects()
                const activeObj = objects.find(obj => (obj.customId === active.id) || (active.id === 'background' && obj === backgroundImageRef.current))
                const overObj = objects.find(obj => (obj.customId === over.id) || (over.id === 'background' && obj === backgroundImageRef.current))

                if (activeObj && overObj) {
                    const activeIndex = objects.indexOf(activeObj)
                    const overIndex = objects.indexOf(overObj)

                    if (activeIndex !== -1 && overIndex !== -1) {
                        fabricCanvasRef.current.moveObjectTo(activeObj, overIndex)
                        fabricCanvasRef.current.renderAll()
                    }
                }
            }
        }
    }

    const handleToggleLayerVisibility = (layerId: string) => {
        if (!fabricCanvasRef.current) return

        const objects = fabricCanvasRef.current.getObjects()

        if (layerId === 'background' && backgroundImageRef.current) {
            backgroundImageRef.current.visible = !backgroundImageRef.current.visible
        } else {
            const obj = objects.find(obj => obj.customId === layerId)
            if (obj) {
                obj.visible = !obj.visible
            }
        }

        fabricCanvasRef.current.renderAll()
        updateLayers()
    }

    const handleSelectLayer = (layerId: string) => {
        if (!fabricCanvasRef.current) return

        if (layerId === 'background' && backgroundImageRef.current) {
            fabricCanvasRef.current.setActiveObject(backgroundImageRef.current)
        } else {
            const objects = fabricCanvasRef.current.getObjects()
            const obj = objects.find(obj => obj.customId === layerId)
            if (obj) {
                fabricCanvasRef.current.setActiveObject(obj)
            }
        }

        fabricCanvasRef.current.renderAll()
    }

    // Renderizar placeholders no canvas
    const renderPlaceholders = useCallback((placeholders: Placeholder[]) => {
        if (!fabricCanvasRef.current) return

        // Limpar placeholders existentes (exceto imagem de fundo)
        const objects = fabricCanvasRef.current.getObjects()
        objects.forEach(obj => {
            if (obj !== backgroundImageRef.current) {
                fabricCanvasRef.current!.remove(obj)
            }
        })

        // Adicionar novos placeholders
        placeholders.forEach(placeholder => {
            let fabricObject: FabricObject

            if (placeholder.type === 'text') {
                fabricObject = new Text(placeholder.name, {
                    left: placeholder.x,
                    top: placeholder.y,
                    width: placeholder.width,
                    height: placeholder.height,
                    fontSize: placeholder.fontSize,
                    fontFamily: placeholder.fontFamily,
                    fill: placeholder.color,
                    textAlign: placeholder.align as 'left' | 'center' | 'right' | 'justify',
                    selectable: true,
                    evented: true,
                    lockScalingFlip: true,
                    hasControls: true,
                    hasBorders: true,
                    borderColor: '#3b82f6',
                    cornerColor: '#3b82f6',
                    cornerSize: 6,
                    transparentCorners: false,
                })
            } else {
                fabricObject = new Rect({
                    left: placeholder.x,
                    top: placeholder.y,
                    width: placeholder.width,
                    height: placeholder.height,
                    fill: 'rgba(59, 130, 246, 0.1)',
                    stroke: '#3b82f6',
                    strokeWidth: 2,
                    selectable: true,
                    evented: true,
                    lockScalingFlip: true,
                    hasControls: true,
                    hasBorders: true,
                    borderColor: '#3b82f6',
                    cornerColor: '#3b82f6',
                    cornerSize: 6,
                    transparentCorners: false,
                })

                // Adicionar texto do nome do placeholder dentro do retângulo
                const label = new Text(placeholder.name, {
                    left: placeholder.x + 5,
                    top: placeholder.y + 5,
                    fontSize: 12,
                    fontFamily: 'Arial',
                    fill: '#3b82f6',
                    selectable: false,
                    evented: false
                })

                fabricCanvasRef.current!.add(label)
            }

            fabricObject.customId = generateUniqueId()
            fabricCanvasRef.current!.add(fabricObject)
        })

        fabricCanvasRef.current.renderAll()
    }, [generateUniqueId])

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

    // Efeito para buscar template
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
                    image_is_background: true,
                    canvas_width: null,
                    canvas_height: null,
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
                image_is_background: true,
                canvas_width: null,
                canvas_height: null,
                placeholders: []
            })
            setLoading(false)
        }
    }, [templateId])

    // Efeito para inicializar canvas quando template estiver pronto
    useEffect(() => {
        if (template && !loading) {
            initializeCanvas()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [template, loading])

    // Efeito para carregar imagem de fundo quando template muda
    useEffect(() => {
        if (!fabricCanvasRef.current || !template?.image_url) return

        console.log('🔄 Tentando carregar imagem:', template.image_url)

        // Se a URL mudou, resetar a referência
        if (loadedImageUrlRef.current !== template.image_url) {
            console.log('📝 URL mudou, resetando referência')
            loadedImageUrlRef.current = ''
        }

        // Verificar se a imagem já foi carregada para esta URL específica
        if (loadedImageUrlRef.current === template.image_url) {
            console.log('✅ Imagem já carregada para esta URL')
            return
        }

        // Verificar se já existe uma imagem de fundo carregada para evitar loops
        const existingBackground = fabricCanvasRef.current.getObjects().find(obj => obj === backgroundImageRef.current)
        if (existingBackground) {
            console.log('⚠️ Já existe imagem de fundo carregada')
            return
        }

        console.log('🚀 Iniciando carregamento da imagem')

        const loadBackgroundImage = async () => {
            try {
                const img = await FabricImage.fromURL(template.image_url, {
                    crossOrigin: 'anonymous'
                })

                const canvasWidth = canvasSize.width
                const canvasHeight = canvasSize.height

                let scaleX = 1
                let scaleY = 1

                // O tamanho do canvas já foi definido no initializeCanvas baseado no template

                if (template.image_is_background) {
                    // Se for plano de fundo, ajustar para ocupar todo o canvas
                    scaleX = canvasWidth / img.width!
                    scaleY = canvasHeight / img.height!
                    const scale = Math.max(scaleX, scaleY) // Usar max para cobrir todo o canvas

                    img.set({
                        scaleX: scale,
                        scaleY: scale,
                        left: (canvasWidth - img.width! * scale) / 2,
                        top: (canvasHeight - img.height! * scale) / 2,
                        selectable: false,
                        evented: false,
                        hoverCursor: 'default',
                        name: 'background'
                    })
                } else {
                    // Se não for plano de fundo, permitir edição
                    scaleX = Math.min(canvasWidth / img.width!, canvasHeight / img.height!, 1)

                    img.set({
                        scaleX: scaleX,
                        scaleY: scaleX, // Manter proporção
                        left: (canvasWidth - img.width! * scaleX) / 2,
                        top: (canvasHeight - img.height! * scaleX) / 2,
                        selectable: true,
                        evented: true,
                        hoverCursor: 'move',
                        name: `image-${Date.now()}`
                    })
                }

                fabricCanvasRef.current!.add(img)
                if (template.image_is_background) {
                    fabricCanvasRef.current!.sendObjectToBack(img)
                }
                backgroundImageRef.current = img
                loadedImageUrlRef.current = template.image_url // Marcar como carregada
                console.log('✅ Imagem carregada com sucesso:', template.image_url)
                fabricCanvasRef.current!.renderAll()
                updateLayers()
            } catch (error) {
                console.error('Erro ao carregar imagem de fundo:', error)
                toast({
                    title: "Erro ao carregar imagem",
                    description: "Não foi possível carregar a imagem de fundo do template.",
                    variant: "destructive"
                })
            }
        }

        loadBackgroundImage()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [template?.image_url, template?.image_is_background, canvasSize.width, canvasSize.height, toast])

    // Efeito para atualizar placeholders quando mudarem
    useEffect(() => {
        if (fabricCanvasRef.current && template?.placeholders) {
            renderPlaceholders(template.placeholders)
        }
    }, [template?.placeholders, renderPlaceholders])

    // Cleanup do canvas quando componente desmontar
    useEffect(() => {
        return () => {
            if (fabricCanvasRef.current) {
                fabricCanvasRef.current.dispose()
                fabricCanvasRef.current = null
            }
            // Limpar referência da imagem carregada
            loadedImageUrlRef.current = ''
        }
    }, [])

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

        // Adicionar ao canvas imediatamente
        if (fabricCanvasRef.current) {
            let fabricObject: FabricObject

            if (placeholder.type === 'text') {
                fabricObject = new Text(placeholder.name, {
                    left: placeholder.x,
                    top: placeholder.y,
                    width: placeholder.width,
                    height: placeholder.height,
                    fontSize: placeholder.fontSize,
                    fontFamily: placeholder.fontFamily,
                    fill: placeholder.color,
                    textAlign: placeholder.align as 'left' | 'center' | 'right' | 'justify',
                    selectable: true,
                    evented: true,
                    lockScalingFlip: true,
                    hasControls: true,
                    hasBorders: true,
                    borderColor: '#3b82f6',
                    cornerColor: '#3b82f6',
                    cornerSize: 6,
                    transparentCorners: false,
                })
            } else {
                fabricObject = new Rect({
                    left: placeholder.x,
                    top: placeholder.y,
                    width: placeholder.width,
                    height: placeholder.height,
                    fill: 'rgba(59, 130, 246, 0.1)',
                    stroke: '#3b82f6',
                    strokeWidth: 2,
                    selectable: true,
                    evented: true,
                    lockScalingFlip: true,
                    hasControls: true,
                    hasBorders: true,
                    borderColor: '#3b82f6',
                    cornerColor: '#3b82f6',
                    cornerSize: 6,
                    transparentCorners: false,
                })

                // Adicionar texto do nome do placeholder dentro do retângulo
                const label = new Text(placeholder.name, {
                    left: placeholder.x + 5,
                    top: placeholder.y + 5,
                    fontSize: 12,
                    fontFamily: 'Arial',
                    fill: '#3b82f6',
                    selectable: false,
                    evented: false
                })

                fabricCanvasRef.current!.add(label)
            }

            fabricObject.customId = generateUniqueId()
            fabricCanvasRef.current!.add(fabricObject)
            fabricCanvasRef.current.setActiveObject(fabricObject)
            fabricCanvasRef.current!.renderAll()
        }

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

        // Remover do canvas
        if (fabricCanvasRef.current) {
            const objects = fabricCanvasRef.current.getObjects()
            const placeholderToRemove = template.placeholders.find(p => p.id === placeholderId)

            objects.forEach(obj => {
                // Remover objetos de texto com o mesmo nome do placeholder
                if (obj instanceof Text && obj.selectable && obj.text === placeholderToRemove?.name) {
                    fabricCanvasRef.current!.remove(obj)
                }
                // Remover retângulos (não selecionáveis) que contenham labels com o mesmo nome
                if (obj instanceof Rect) {
                    // Verificar se há um label associado próximo
                    const nearbyObjects = fabricCanvasRef.current!.getObjects()
                    const hasAssociatedLabel = nearbyObjects.some(nearbyObj =>
                        nearbyObj instanceof Text &&
                        !nearbyObj.selectable &&
                        nearbyObj.text === placeholderToRemove?.name &&
                        Math.abs(nearbyObj.left! - obj.left!) < 10 &&
                        Math.abs(nearbyObj.top! - obj.top!) < 10
                    )

                    if (hasAssociatedLabel) {
                        fabricCanvasRef.current!.remove(obj)
                        // Remover também o label associado
                        nearbyObjects.forEach(nearbyObj => {
                            if (nearbyObj instanceof Text &&
                                !nearbyObj.selectable &&
                                nearbyObj.text === placeholderToRemove?.name) {
                                fabricCanvasRef.current!.remove(nearbyObj)
                            }
                        })
                    }
                }
            })
            fabricCanvasRef.current!.renderAll()
        }

        toast({
            title: "Placeholder removido",
            description: "O placeholder foi removido do template.",
        })
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

                    <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setShowLayers(!showLayers)}>
                        <Layers className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setShowSettings(!showSettings)}>
                        <Settings className="h-4 w-4" />
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
                <div className="w-84 border-r bg-muted/20 p-4">
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
                        <div className="bg-white shadow-lg rounded-lg overflow-hidden canvas-container">
                            {template.image_url ? (
                                <div ref={containerRef} className="relative overflow-auto bg-gray-100">
                                    <canvas
                                        ref={canvasRef}
                                        width={canvasSize.width}
                                        height={canvasSize.height}
                                        className="fabric-canvas"
                                    />

                                    {/* Card de opções da imagem do template */}
                                    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 border">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                                                <Image className="h-4 w-4" aria-hidden="true" />
                                                Imagem do Template
                                            </div>
                                            <div className="space-y-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full justify-start text-xs"
                                                    onClick={() => {
                                                        if (fabricCanvasRef.current && backgroundImageRef.current) {
                                                            // Toggle plano de fundo
                                                            const isBackground = !template.image_is_background
                                                            backgroundImageRef.current.selectable = !isBackground
                                                            backgroundImageRef.current.evented = !isBackground
                                                            backgroundImageRef.current.hoverCursor = isBackground ? 'default' : 'move'

                                                            if (isBackground) {
                                                                fabricCanvasRef.current.sendObjectToBack(backgroundImageRef.current)
                                                            }

                                                            setTemplate(prev => prev ? {
                                                                ...prev,
                                                                image_is_background: isBackground
                                                            } : prev)

                                                            fabricCanvasRef.current.renderAll()
                                                        }
                                                    }}
                                                >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    {template.image_is_background ? 'Remover Plano de Fundo' : 'Definir como Plano de Fundo'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full justify-start text-xs"
                                                    onClick={() => {
                                                        // TODO: Implementar substituição de imagem
                                                        toast({
                                                            title: "Funcionalidade em desenvolvimento",
                                                            description: "Substituição de imagem será implementada em breve.",
                                                        })
                                                    }}
                                                >
                                                    <Replace className="h-3 w-3 mr-1" />
                                                    Substituir Imagem
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full justify-start text-xs"
                                                    onClick={() => {
                                                        if (fabricCanvasRef.current && backgroundImageRef.current) {
                                                            fabricCanvasRef.current.setActiveObject(backgroundImageRef.current)
                                                            fabricCanvasRef.current.renderAll()
                                                        }
                                                    }}
                                                >
                                                    <RotateCcw className="h-3 w-3 mr-1" />
                                                    Editar (Redimensionar/Girar)
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
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

                {/* Layers Panel */}
                {showLayers && (
                    <div className="w-64 border-l bg-muted/20 p-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Layers className="h-4 w-4" />
                                    Camadas
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleLayerDragEnd}
                                >
                                    <SortableContext items={layers.map(l => l.id)} strategy={verticalListSortingStrategy}>
                                        {layers.map((layer) => (
                                            <SortableLayerItem
                                                key={layer.id}
                                                layer={layer}
                                                onToggleVisibility={handleToggleLayerVisibility}
                                                onSelect={handleSelectLayer}
                                                isSelected={false} // TODO: implementar seleção
                                            />
                                        ))}
                                    </SortableContext>
                                </DndContext>
                                {layers.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        Nenhuma camada
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

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
