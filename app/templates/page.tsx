'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Layers, Calendar } from 'lucide-react'
import type { TemplateListItem } from '@/lib/types/api'

export default function TemplatesPage() {
    const router = useRouter()
    const [templates, setTemplates] = useState<TemplateListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        loadTemplates()
    }, [])

    async function loadTemplates() {
        try {
            const response = await fetch('/api/templates')
            const data = await response.json()
            setTemplates(data.templates || [])
        } catch (error) {
            console.error('Erro ao carregar templates:', error)
        } finally {
            setLoading(false)
        }
    }

    async function createTemplate() {
        setCreating(true)
        try {
            const response = await fetch('/api/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Novo Template',
                    description: 'Template criado em ' + new Date().toLocaleDateString('pt-BR'),
                    width: 1080,
                    height: 1920
                })
            })

            const data = await response.json()
            if (data.success && data.template) {
                // Redirecionar para o editor
                router.push(`/editor?template=${data.template.id}`)
            }
        } catch (error) {
            console.error('Erro ao criar template:', error)
        } finally {
            setCreating(false)
        }
    }

    function openEditor(templateId: string) {
        router.push(`/editor?template=${templateId}`)
    }

    if (loading) {
        return (
            <div className="container mx-auto p-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-muted-foreground">Carregando templates...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Image Templates</h1>
                    <p className="text-muted-foreground mt-2">
                        Crie e gerencie templates para geração de imagens
                    </p>
                </div>
                <Button onClick={createTemplate} disabled={creating} size="lg">
                    <Plus className="w-4 h-4 mr-2" />
                    {creating ? 'Criando...' : 'Novo Template'}
                </Button>
            </div>

            {templates.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Layers className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Nenhum template ainda</h3>
                        <p className="text-muted-foreground mb-6 text-center max-w-md">
                            Crie seu primeiro template para começar a gerar imagens automaticamente
                        </p>
                        <Button onClick={createTemplate} disabled={creating}>
                            <Plus className="w-4 h-4 mr-2" />
                            Criar Primeiro Template
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => (
                        <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openEditor(template.id)}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="line-clamp-1">{template.name}</CardTitle>
                                        <CardDescription className="line-clamp-2 mt-1">
                                            {template.description || 'Sem descrição'}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={template.status === 'active' ? 'default' : 'secondary'}>
                                        {template.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Layers className="w-4 h-4" />
                                        <span>{template.canvas_count} {template.canvas_count === 1 ? 'página' : 'páginas'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        <span>{new Date(template.created_at).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="text-sm text-muted-foreground">
                                <div className="flex items-center justify-between w-full">
                                    <span>{template.usage_count} gerações</span>
                                    <span className="text-xs">Atualizado: {new Date(template.updated_at).toLocaleDateString('pt-BR')}</span>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
