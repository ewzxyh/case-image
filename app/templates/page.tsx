"use client";

import { Calendar, Layers, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { TemplateListItem } from "@/lib/types/api";

export default function TemplatesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadTemplates = useCallback(async () => {
    try {
      const response = await fetch("/api/templates");
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (_error) {
      toast({
        title: "Erro ao carregar templates",
        description: "Não foi possível carregar a lista de templates.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  async function createTemplate() {
    setCreating(true);
    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Novo Template",
          description: `Template criado em ${new Date().toLocaleDateString("pt-BR")}`,
          width: 1080,
          height: 1920,
        }),
      });

      const data = await response.json();
      if (data.success && data.template) {
        // Redirecionar para o editor
        router.push(`/editor?template=${data.template.id}`);
      }
    } catch (_error) {
      toast({
        title: "Erro ao criar template",
        description: "Não foi possível criar o template.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  }

  function openEditor(templateId: string) {
    router.push(`/editor?template=${templateId}`);
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex h-64 items-center justify-center">
          <div className="text-muted-foreground">Carregando templates...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Image Templates</h1>
          <p className="mt-2 text-muted-foreground">
            Crie e gerencie templates para geração de imagens
          </p>
        </div>
        <Button disabled={creating} onClick={createTemplate} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          {creating ? "Criando..." : "Novo Template"}
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Layers className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 font-semibold text-xl">
              Nenhum template ainda
            </h3>
            <p className="mb-6 max-w-md text-center text-muted-foreground">
              Crie seu primeiro template para começar a gerar imagens
              automaticamente
            </p>
            <Button disabled={creating} onClick={createTemplate}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card
              className="cursor-pointer transition-shadow hover:shadow-lg"
              key={template.id}
              onClick={() => openEditor(template.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1">
                      {template.name}
                    </CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {template.description || "Sem descrição"}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      template.status === "active" ? "default" : "secondary"
                    }
                  >
                    {template.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-muted-foreground text-sm">
                  <div className="flex items-center gap-1">
                    <Layers className="h-4 w-4" />
                    <span>
                      {template.canvas_count}{" "}
                      {template.canvas_count === 1 ? "página" : "páginas"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(template.created_at).toLocaleDateString(
                        "pt-BR"
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="text-muted-foreground text-sm">
                <div className="flex w-full items-center justify-between">
                  <span>{template.usage_count} gerações</span>
                  <span className="text-xs">
                    Atualizado:{" "}
                    {new Date(template.updated_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
