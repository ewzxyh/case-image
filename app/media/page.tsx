'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Upload, Image as ImageIcon, Trash2 } from 'lucide-react'
import type { MediaAssetResponse } from '@/lib/types/api'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function MediaLibraryPage() {
    const [assets, setAssets] = useState<MediaAssetResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [assetToDelete, setAssetToDelete] = useState<MediaAssetResponse | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()

    useEffect(() => {
        loadAssets()
    }, [])

    async function loadAssets() {
        try {
            const response = await fetch('/api/media')
            const data = await response.json()
            setAssets(data.assets || [])
        } catch (error) {
            console.error('Erro ao carregar assets:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const files = event.target.files
        if (!files || files.length === 0) return

        setUploading(true)

        try {
            for (const file of Array.from(files)) {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('name', file.name)

                const response = await fetch('/api/media', {
                    method: 'POST',
                    body: formData
                })

                const data = await response.json()
                if (data.success) {
                    setAssets(prev => [data.asset, ...prev])
                }
            }
        } catch (error) {
            console.error('Erro ao fazer upload:', error)
        } finally {
            setUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    async function deleteAsset(assetId: string) {
        setDeletingId(assetId)
        try {
            const response = await fetch(`/api/media/${assetId}`, {
                method: 'DELETE'
            })

            const data = await response.json()
            if (data.success) {
                setAssets(prev => prev.filter(a => a.id !== assetId))
                toast({
                    title: 'Asset deletado',
                    description: 'O asset foi removido com sucesso.',
                })
            } else {
                throw new Error(data.error || 'Erro ao deletar')
            }
        } catch (error) {
            console.error('Erro ao deletar asset:', error)
            toast({
                title: 'Erro',
                description: 'Não foi possível deletar o asset.',
                variant: 'destructive'
            })
        } finally {
            setDeletingId(null)
            setAssetToDelete(null)
        }
    }

    function formatFileSize(bytes: number | null): string {
        if (!bytes) return 'N/A'
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    if (loading) {
        return (
            <div className="container mx-auto p-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-muted-foreground">Carregando biblioteca...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Media Library</h1>
                    <p className="text-muted-foreground mt-2">
                        Gerencie imagens e recursos para seus templates
                    </p>
                </div>
                <div>
                    <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        size="lg"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? 'Enviando...' : 'Upload Imagem'}
                    </Button>
                </div>
            </div>

            {assets.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <ImageIcon className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Nenhuma imagem ainda</h3>
                        <p className="text-muted-foreground mb-6 text-center max-w-md">
                            Faça upload de imagens para usar nos seus templates
                        </p>
                        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                            <Upload className="w-4 h-4 mr-2" />
                            Fazer Upload
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {assets.map((asset) => (
                            <Card key={asset.id} className="overflow-hidden group relative">
                                <div className="aspect-square relative bg-muted">
                                    {asset.fileUrl && (
                                        <Image
                                            src={asset.fileUrl}
                                            alt={asset.name}
                                            fill
                                            className="object-cover"
                                        />
                                    )}
                                    {/* Botão de deletar no hover */}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            className="h-8 w-8 shadow-lg"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setAssetToDelete(asset)
                                            }}
                                            disabled={deletingId === asset.id}
                                        >
                                            {deletingId === asset.id ? (
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                                <CardContent className="p-3">
                                    <p className="text-sm font-medium truncate">{asset.name}</p>
                                    <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                                        <span>{formatFileSize(asset.fileSize)}</span>
                                        {asset.width && asset.height && (
                                            <span>{asset.width}x{asset.height}</span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Dialog de confirmação */}
                    <AlertDialog open={!!assetToDelete} onOpenChange={(open) => !open && setAssetToDelete(null)}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Deletar asset?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Tem certeza que deseja deletar &quot;{assetToDelete?.name}&quot;? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => assetToDelete && deleteAsset(assetToDelete.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Deletar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            )}
        </div>
    )
}

