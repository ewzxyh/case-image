"use client";

import { AlertCircle, CheckCircle, Save, Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type ImageUploadProps = {
  onImageSelect?: (file: File) => void;
  onTemplateCreated?: () => void; // Callback para quando um template for criado
  maxSize?: number; // em bytes
  acceptedTypes?: string[];
  className?: string;
};

export function ImageUpload({
  onImageSelect,
  onTemplateCreated,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ["image/png", "image/jpeg", "image/jpg"],
  className = "",
}: ImageUploadProps) {
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Campos do formulário
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [lotteryType, setLotteryType] = useState("");
  const [showForm, setShowForm] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) {
        return;
      }

      // Validação de tipo
      if (!acceptedTypes.includes(file.type)) {
        setError(
          `Tipo de arquivo não suportado. Use: ${acceptedTypes.join(", ")}`
        );
        return;
      }

      // Validação de tamanho
      if (file.size > maxSize) {
        setError(
          `Arquivo muito grande. Máximo: ${(maxSize / 1024 / 1024).toFixed(1)}MB`
        );
        return;
      }

      setError(null);
      setUploadedFile(file);
      setSuccess(false);
      setShowForm(true);

      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      onImageSelect?.(file);
    },
    [acceptedTypes, maxSize, onImageSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
    maxFiles: 1,
    maxSize,
  });

  const removeFile = () => {
    setUploadedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setError(null);
    setSuccess(false);
    setShowForm(false);
    setTemplateName("");
    setTemplateDescription("");
    setLotteryType("");
  };

  const createTemplate = async () => {
    if (!(uploadedFile && templateName.trim())) {
      setError("Nome do template é obrigatório");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Criar FormData para enviar arquivo e dados
      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append("name", templateName.trim());
      formData.append("description", templateDescription.trim());
      formData.append("lottery_type", lotteryType);

      // Simular progresso de upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 15, 90));
      }, 200);

      // Fazer upload para API
      const response = await fetch("/api/templates", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar template");
      }

      await response.json();
      setUploadProgress(100);
      setSuccess(true);

      toast({
        title: "Template criado com sucesso!",
        description: `O template "${templateName}" foi salvo e está disponível na lista.`,
      });

      // Limpar formulário
      removeFile();

      // Chamar callback para atualizar lista
      onTemplateCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar template");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) {
      return "0 Bytes";
    }
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Área de Drop */}
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200 ${
          isDragActive
            ? "scale-[1.02] border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
        }
          ${error ? "border-red-300 bg-red-50 dark:bg-red-950/20" : ""}
          ${success ? "border-green-300 bg-green-50 dark:bg-green-950/20" : ""}
        `}
      >
        <input {...getInputProps()} />

        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-lg">
              <Image
                alt="Preview"
                className="object-cover"
                fill
                src={previewUrl}
              />
              <Button
                className="absolute top-1 right-1 h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
                size="sm"
                variant="destructive"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div>
              <p className="font-medium">{uploadedFile?.name}</p>
              <p className="text-muted-foreground text-sm">
                {uploadedFile && formatFileSize(uploadedFile.size)}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Upload
                className={`h-6 w-6 ${isDragActive ? "text-primary" : "text-muted-foreground"}`}
              />
            </div>
            <div>
              <p className="font-medium text-lg">
                {isDragActive
                  ? "Solte a imagem aqui"
                  : "Arraste e solte uma imagem"}
              </p>
              <p className="mt-1 text-muted-foreground text-sm">
                ou clique para selecionar do seu computador
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Fazendo upload...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress className="h-2" value={uploadProgress} />
        </div>
      )}

      {/* Formulário de Criação do Template */}
      {showForm && uploadedFile && (
        <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
          <h3 className="font-semibold text-lg">Configurar Template</h3>

          <div className="space-y-3">
            <div>
              <Label htmlFor="template-name">Nome do Template *</Label>
              <Input
                className="mt-1"
                id="template-name"
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Ex: Mega-Sena Principal"
                type="text"
                value={templateName}
              />
            </div>

            <div>
              <Label htmlFor="template-description">Descrição (opcional)</Label>
              <Textarea
                className="mt-1"
                id="template-description"
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Descrição do template..."
                rows={2}
                value={templateDescription}
              />
            </div>

            <div>
              <Label htmlFor="lottery-type">Tipo de Loteria</Label>
              <Select onValueChange={setLotteryType} value={lotteryType}>
                <SelectTrigger className="mt-1" id="lottery-type">
                  <SelectValue placeholder="Selecione o tipo de loteria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mega-sena">Mega-Sena</SelectItem>
                  <SelectItem value="lotofacil">Lotofácil</SelectItem>
                  <SelectItem value="quina">Quina</SelectItem>
                  <SelectItem value="lotomania">Lotomania</SelectItem>
                  <SelectItem value="timemania">Timemania</SelectItem>
                  <SelectItem value="dupla-sena">Dupla Sena</SelectItem>
                  <SelectItem value="dia-de-sorte">Dia de Sorte</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              disabled={isUploading || !templateName.trim()}
              onClick={createTemplate}
            >
              {isUploading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-white border-b-2" />
                  Criando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Criar Template
                </>
              )}
            </Button>
            <Button
              disabled={isUploading}
              onClick={removeFile}
              variant="outline"
            >
              Cancelar
            </Button>
          </div>

          {/* Progress Bar durante upload */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Criando template...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress className="h-2" value={uploadProgress} />
            </div>
          )}
        </div>
      )}

      {/* Mensagens de Status */}
      {error && !showForm && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && !showForm && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Template criado com sucesso! Ele já está disponível na lista.
          </AlertDescription>
        </Alert>
      )}

      {/* Informações Adicionais */}
      <div className="space-y-1 text-muted-foreground text-xs">
        <p>• Formatos aceitos: PNG, JPG, JPEG</p>
        <p>• Tamanho máximo: {(maxSize / 1024 / 1024).toFixed(1)}MB</p>
        <p>• Resolução recomendada: 1080x1080px (1:1) para redes sociais</p>
      </div>
    </div>
  );
}
