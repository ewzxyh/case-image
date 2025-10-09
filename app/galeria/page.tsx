"use client";

import {
  AlertCircle,
  Calendar,
  Download,
  Eye,
  FileImage,
  Filter,
  Loader2,
  Search,
  Share2,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type GeneratedImage = {
  id: string;
  template_name: string;
  image_url: string;
  created_at: string;
  template_id: string;
  generation_time: number;
};

type GalleryData = {
  images: GeneratedImage[];
  total: number;
  currentPage: number;
  totalPages: number;
};

export default function GalleryPage() {
  const [galleryData, setGalleryData] = useState<GalleryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTemplate, setFilterTemplate] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const fetchGallery = useCallback(async (
    page = 1,
    search = "",
    template = "all",
    sort = "newest"
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        search,
        template,
        sort,
      });

      const response = await fetch(`/api/gallery?${params}`);
      if (!response.ok) {
        throw new Error("Erro ao carregar galeria");
      }
      const data = await response.json();
      setGalleryData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");

      const ONE_HOUR_MS = 3_600_000;
      const TWO_HOURS_MS = 7_200_000;

      // Fallback para dados mockados
      setGalleryData({
        images: [
          {
            id: "img-001",
            template_name: "Mega-Sena Principal",
            image_url: "/megasena-template.png",
            created_at: new Date(Date.now() - ONE_HOUR_MS).toISOString(),
            template_id: "template-001",
            generation_time: 2.3,
          },
          {
            id: "img-002",
            template_name: "Lotofácil Resultados",
            image_url: "/lotofacil-template.png",
            created_at: new Date(Date.now() - TWO_HOURS_MS).toISOString(),
            template_id: "template-002",
            generation_time: 1.8,
          },
        ],
        total: 2,
        currentPage: 1,
        totalPages: 1,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGallery(currentPage, searchTerm, filterTemplate, sortBy);
  }, [currentPage, searchTerm, filterTemplate, sortBy, fetchGallery]);

  const handleDownload = async (
    imageId: string,
    imageUrl: string,
    templateName: string
  ) => {
    try {
      // Em um cenário real, isso faria uma requisição para baixar a imagem
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${templateName}-${imageId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download realizado",
        description: "A imagem foi baixada com sucesso.",
      });
    } catch {
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar a imagem.",
        variant: "destructive",
      });
    }
  };

  const handleShare = (imageUrl: string) => {
    if (navigator.share) {
      navigator.share({
        title: "Imagem gerada",
        text: "Confira esta imagem gerada automaticamente",
        url: imageUrl,
      });
    } else {
      navigator.clipboard.writeText(imageUrl);
      toast({
        title: "Link copiado",
        description: "Link da imagem copiado para a área de transferência.",
      });
    }
  };

  const images = galleryData?.images || [];
  const totalImages = galleryData?.total || 0;

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-3xl tracking-tight">
            Galeria de Imagens
          </h2>
          <p className="text-muted-foreground">
            Explore todas as imagens geradas automaticamente pelo sistema.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge
            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            variant="secondary"
          >
            {totalImages} Imagen{totalImages !== 1 ? "s" : ""}
          </Badge>
          {loading && (
            <Badge className="animate-pulse" variant="outline">
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Carregando...
            </Badge>
          )}
          {error && (
            <Badge variant="destructive">
              <AlertCircle className="mr-1 h-3 w-3" />
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
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome do template..."
                  value={searchTerm}
                />
              </div>
            </div>
            <Select onValueChange={setFilterTemplate} value={filterTemplate}>
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
            <Select onValueChange={setSortBy} value={sortBy}>
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
          <Card
            className="group transition-all duration-200 hover:shadow-lg"
            key={image.id}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="truncate text-lg">
                  {image.template_name}
                </CardTitle>
                <Badge className="text-xs" variant="outline">
                  {image.generation_time.toFixed(1)}s
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(image.created_at).toLocaleDateString("pt-BR")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preview da Imagem */}
              <div className="group relative aspect-video overflow-hidden rounded-lg bg-muted">
                {image.image_url ? (
                  <Image
                    alt={`Imagem gerada - ${image.template_name}`}
                    className="object-cover transition-transform group-hover:scale-105"
                    fill
                    src={image.image_url}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <FileImage className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}

                {/* Overlay com ações */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    className="cursor-pointer"
                    onClick={() =>
                      handleDownload(
                        image.id,
                        image.image_url,
                        image.template_name
                      )
                    }
                    size="sm"
                    variant="secondary"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    className="cursor-pointer"
                    onClick={() => handleShare(image.image_url)}
                    size="sm"
                    variant="secondary"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    className="cursor-pointer"
                    size="sm"
                    variant="secondary"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2">
                <Button
                  className="flex-1 cursor-pointer"
                  onClick={() =>
                    handleDownload(
                      image.id,
                      image.image_url,
                      image.template_name
                    )
                  }
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar
                </Button>
                <Button
                  className="cursor-pointer"
                  onClick={() => handleShare(image.image_url)}
                  size="sm"
                  variant="outline"
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
              <FileImage className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-semibold text-lg">
                Nenhuma imagem encontrada
              </h3>
              <p className="text-center text-muted-foreground">
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
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            variant="outline"
          >
            Anterior
          </Button>
          <span className="flex items-center px-4">
            Página {currentPage} de {galleryData.totalPages}
          </span>
          <Button
            disabled={currentPage === galleryData.totalPages}
            onClick={() =>
              setCurrentPage(Math.min(galleryData.totalPages, currentPage + 1))
            }
            variant="outline"
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}
