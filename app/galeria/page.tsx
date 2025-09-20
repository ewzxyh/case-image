"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Download,
    Search,
    Filter,
    Calendar,
    FileImage,
    AlertCircle,
    Loader2,
    Eye,
    Share2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface GeneratedImage {
    id: string
    template_name: string
    image_url: string
    created_at: string
    template_id: string
    generation_time: number
}

interface GalleryData {
    images: GeneratedImage[]
    total: number
    currentPage: number
    totalPages: number
}

export default function GalleryPage() {
    const [galleryData, setGalleryData] = useState<GalleryData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterTemplate, setFilterTemplate] = useState("all")
    const [sortBy, setSortBy] = useState("newest")
    const [currentPage, setCurrentPage] = useState(1)
    const { toast } = useToast()

    const fetchGallery = async (page = 1, search = "", template = "all", sort = "newest") => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "20",
                search,
                template,
                sort
            })

            const response = await fetch(`/api/gallery?${params}`)
            if (!response.ok) {
                throw new Error('Erro ao carregar galeria')
            }
            const data = await response.json()
            setGalleryData(data)
        } catch (err) {
            console.error('Erro ao buscar imagens:', err)
            setError(err instanceof Error ? err.message : 'Erro desconhecido')

            // Fallback para dados mockados
            setGalleryData({
                images: [
                    {
                        id: 'img-001',
                        template_name: 'Mega-Sena Principal',
                        image_url: '/megasena-template.png',
                        created_at: new Date(Date.now() - 3600000).toISOString(),
                        template_id: 'template-001',
                        generation_time: 2.3
                    },
                    {
                        id: 'img-002',
                        template_name: 'Lotofácil Resultados',
                        image_url: '/lotofacil-template.png',
                        created_at: new Date(Date.now() - 7200000).toISOString(),
                        template_id: 'template-002',
                        generation_time: 1.8
                    }
                ],
                total: 2,
                currentPage: 1,
                totalPages: 1
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchGallery(currentPage, searchTerm, filterTemplate, sortBy)
    }, [currentPage, searchTerm, filterTemplate, sortBy])

    const handleDownload = async (imageId: string, imageUrl: string, templateName: string) => {
        try {
            // Em um cenário real, isso faria uma requisição para baixar a imagem
            const response = await fetch(imageUrl)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.style.display = 'none'
            a.href = url
            a.download = `${templateName}-${imageId}.png`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast({
                title: "Download realizado",
                description: "A imagem foi baixada com sucesso."
            })
        } catch {
            toast({
                title: "Erro no download",
                description: "Não foi possível baixar a imagem.",
                variant: "destructive"
            })
        }
    }

    const handleShare = (imageUrl: string) => {
        if (navigator.share) {
            navigator.share({
                title: 'Imagem gerada',
                text: 'Confira esta imagem gerada automaticamente',
                url: imageUrl
            })
        } else {
            navigator.clipboard.writeText(imageUrl)
            toast({
                title: "Link copiado",
                description: "Link da imagem copiado para a área de transferência."
            })
        }
    }

    const images = galleryData?.images || []
    const totalImages = galleryData?.total || 0

    return (
        <div className="flex-1 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Galeria de Imagens</h2>
                    <p className="text-muted-foreground">
                        Explore todas as imagens geradas automaticamente pelo sistema.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        {totalImages} Imagen{totalImages !== 1 ? 's' : ''}
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

            {/* Filtros e Busca */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filtros e Busca
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nome do template..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                        <Select value={filterTemplate} onValueChange={setFilterTemplate}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="Filtrar por template" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os templates</SelectItem>
                                <SelectItem value="mega-sena">Mega-Sena</SelectItem>
                                <SelectItem value="lotofacil">Lotofácil</SelectItem>
                                <SelectItem value="quina">Quina</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="Ordenar por" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Mais recentes</SelectItem>
                                <SelectItem value="oldest">Mais antigos</SelectItem>
                                <SelectItem value="template">Por template</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Grid de Imagens */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {images.map((image) => (
                    <Card key={image.id} className="group hover:shadow-lg transition-all duration-200">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg truncate">{image.template_name}</CardTitle>
                                <Badge variant="outline" className="text-xs">
                                    {image.generation_time.toFixed(1)}s
                                </Badge>
                            </div>
                            <CardDescription className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(image.created_at).toLocaleDateString('pt-BR')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Preview da Imagem */}
                            <div className="aspect-video bg-muted rounded-lg overflow-hidden relative group">
                                {image.image_url ? (
                                    <Image
                                        src={image.image_url}
                                        alt={`Imagem gerada - ${image.template_name}`}
                                        fill
                                        className="object-cover transition-transform group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <FileImage className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                )}

                                {/* Overlay com ações */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="cursor-pointer"
                                        onClick={() => handleDownload(image.id, image.image_url, image.template_name)}
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="cursor-pointer"
                                        onClick={() => handleShare(image.image_url)}
                                    >
                                        <Share2 className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="secondary" className="cursor-pointer">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Ações */}
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    className="flex-1 cursor-pointer"
                                    onClick={() => handleDownload(image.id, image.image_url, image.template_name)}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Baixar
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="cursor-pointer"
                                    onClick={() => handleShare(image.image_url)}
                                >
                                    <Share2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Card vazio quando não há imagens */}
                {images.length === 0 && !loading && (
                    <Card className="col-span-full">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <FileImage className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Nenhuma imagem encontrada</h3>
                            <p className="text-muted-foreground text-center">
                                Ainda não foram geradas imagens com os critérios selecionados.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Paginação */}
            {galleryData && galleryData.totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                    >
                        Anterior
                    </Button>
                    <span className="flex items-center px-4">
                        Página {currentPage} de {galleryData.totalPages}
                    </span>
                    <Button
                        variant="outline"
                        onClick={() => setCurrentPage(Math.min(galleryData.totalPages, currentPage + 1))}
                        disabled={currentPage === galleryData.totalPages}
                    >
                        Próxima
                    </Button>
                </div>
            )}
        </div>
    )
}
