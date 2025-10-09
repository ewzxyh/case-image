"use client";

import { Image as ImageIcon, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  FILE_SIZE_KB_DIVISOR,
  FILE_SIZE_MB_DIVISOR,
} from "@/lib/canvas/constants";
import type { MediaAssetResponse } from "@/lib/types/api";

const BYTES_PER_KB = 1024;
const BYTES_PER_MB = 1024;

const KB_THRESHOLD = BYTES_PER_KB;
const MB_THRESHOLD = BYTES_PER_KB * BYTES_PER_MB;
const KB_DECIMAL_PLACES = 1;
const MB_DECIMAL_PLACES = 1;

export default function MediaLibraryPage() {
  const [assets, setAssets] = useState<MediaAssetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<MediaAssetResponse | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const loadAssets = useCallback(async () => {
    try {
      const response = await fetch("/api/media");
      const data = await response.json();
      setAssets(data.assets || []);
    } catch (_error) {
      toast({
        title: "Erro ao carregar mídia",
        description: "Não foi possível carregar a biblioteca de mídia.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", file.name);

        const response = await fetch("/api/media", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (data.success) {
          setAssets((prev) => [data.asset, ...prev]);
        }
      }
    } catch (_error) {
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload dos arquivos.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function deleteAsset(assetId: string) {
    setDeletingId(assetId);
    try {
      const response = await fetch(`/api/media/${assetId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        setAssets((prev) => prev.filter((a) => a.id !== assetId));
        toast({
          title: "Asset deletado",
          description: "O asset foi removido com sucesso.",
        });
      } else {
        throw new Error(data.error || "Erro ao deletar");
      }
    } catch (_error) {
      toast({
        title: "Erro",
        description: "Não foi possível deletar o asset.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
      setAssetToDelete(null);
    }
  }

  function formatFileSize(bytes: number | null): string {
    if (!bytes) {
      return "N/A";
    }
    if (bytes < KB_THRESHOLD) {
      return `${bytes} B`;
    }
    if (bytes < MB_THRESHOLD) {
      return `${(bytes / FILE_SIZE_KB_DIVISOR).toFixed(KB_DECIMAL_PLACES)} KB`;
    }
    return `${(bytes / FILE_SIZE_MB_DIVISOR).toFixed(MB_DECIMAL_PLACES)} MB`;
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex h-64 items-center justify-center">
          <div className="text-muted-foreground">Carregando biblioteca...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Media Library</h1>
          <p className="mt-2 text-muted-foreground">
            Gerencie imagens e recursos para seus templates
          </p>
        </div>
        <div>
          <Input
            accept="image/*"
            className="hidden"
            multiple
            onChange={handleFileUpload}
            ref={fileInputRef}
            type="file"
          />
          <Button
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            size="lg"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Enviando..." : "Upload Imagem"}
          </Button>
        </div>
      </div>

      {assets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ImageIcon className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 font-semibold text-xl">Nenhuma imagem ainda</h3>
            <p className="mb-6 max-w-md text-center text-muted-foreground">
              Faça upload de imagens para usar nos seus templates
            </p>
            <Button
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Fazer Upload
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {assets.map((asset) => (
              <Card className="group relative overflow-hidden" key={asset.id}>
                <div className="relative aspect-square bg-muted">
                  {asset.fileUrl && (
                    <Image
                      alt={asset.name}
                      className="object-cover"
                      fill
                      src={asset.fileUrl}
                    />
                  )}
                  {/* Botão de deletar no hover */}
                  <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      className="h-8 w-8 shadow-lg"
                      disabled={deletingId === asset.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setAssetToDelete(asset);
                      }}
                      size="icon"
                      variant="destructive"
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
                  <p className="truncate font-medium text-sm">{asset.name}</p>
                  <div className="mt-1 flex items-center justify-between text-muted-foreground text-xs">
                    <span>{formatFileSize(asset.fileSize)}</span>
                    {asset.width && asset.height && (
                      <span>
                        {asset.width}x{asset.height}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Dialog de confirmação */}
          <AlertDialog
            onOpenChange={(open) => !open && setAssetToDelete(null)}
            open={!!assetToDelete}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deletar asset?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja deletar &quot;{assetToDelete?.name}
                  &quot;? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => assetToDelete && deleteAsset(assetToDelete.id)}
                >
                  Deletar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
