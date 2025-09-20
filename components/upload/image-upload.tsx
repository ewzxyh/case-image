"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

interface ImageUploadProps {
  onImageSelect?: (file: File) => void
  maxSize?: number // em bytes
  acceptedTypes?: string[]
  className?: string
}

export function ImageUpload({
  onImageSelect,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ["image/png", "image/jpeg", "image/jpg"],
  className = ""
}: ImageUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      // Validação de tipo
      if (!acceptedTypes.includes(file.type)) {
        setError(`Tipo de arquivo não suportado. Use: ${acceptedTypes.join(", ")}`)
        return
      }

      // Validação de tamanho
      if (file.size > maxSize) {
        setError(`Arquivo muito grande. Máximo: ${(maxSize / 1024 / 1024).toFixed(1)}MB`)
        return
      }

      setError(null)
      setUploadedFile(file)
      setSuccess(false)

      // Criar preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Simular upload progress
      setIsUploading(true)
      setUploadProgress(0)

      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setIsUploading(false)
            setSuccess(true)
            onImageSelect?.(file)
            return 100
          }
          return prev + 10
        })
      }, 100)
    },
    [acceptedTypes, maxSize, onImageSelect]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
    maxFiles: 1,
    maxSize,
  })

  const removeFile = () => {
    setUploadedFile(null)
    setPreviewUrl(null)
    setUploadProgress(0)
    setError(null)
    setSuccess(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Área de Drop */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
          }
          ${error ? "border-red-300 bg-red-50 dark:bg-red-950/20" : ""}
          ${success ? "border-green-300 bg-green-50 dark:bg-green-950/20" : ""}
        `}
      >
        <input {...getInputProps()} />

        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative mx-auto w-32 h-32 rounded-lg overflow-hidden">
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                className="object-cover"
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-1 right-1 h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile()
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div>
              <p className="font-medium">{uploadedFile?.name}</p>
              <p className="text-sm text-muted-foreground">
                {uploadedFile && formatFileSize(uploadedFile.size)}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Upload className={`h-6 w-6 ${isDragActive ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-lg font-medium">
                {isDragActive ? "Solte a imagem aqui" : "Arraste e solte uma imagem"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
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
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Mensagens de Status */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Imagem carregada com sucesso! Você pode prosseguir para configurar os placeholders.
          </AlertDescription>
        </Alert>
      )}

      {/* Informações Adicionais */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Formatos aceitos: PNG, JPG, JPEG</p>
        <p>• Tamanho máximo: {(maxSize / 1024 / 1024).toFixed(1)}MB</p>
        <p>• Resolução recomendada: 1080x1080px (1:1) para redes sociais</p>
      </div>
    </div>
  )
}
