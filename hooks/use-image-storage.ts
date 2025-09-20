"use client"

import { useState, useCallback } from "react"

interface StoredImage {
  id: string
  file: File
  url: string
  name: string
  size: number
  type: string
  uploadedAt: Date
}

interface UseImageStorageReturn {
  images: StoredImage[]
  uploadImage: (file: File) => Promise<StoredImage>
  removeImage: (id: string) => void
  clearImages: () => void
  getImageById: (id: string) => StoredImage | undefined
  isUploading: boolean
  error: string | null
}

export function useImageStorage(): UseImageStorageReturn {
  const [images, setImages] = useState<StoredImage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateId = () => `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const uploadImage = useCallback(async (file: File): Promise<StoredImage> => {
    setIsUploading(true)
    setError(null)

    try {
      // Simular processamento (pode ser substituído por upload real)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Criar URL para preview
      const url = URL.createObjectURL(file)

      const storedImage: StoredImage = {
        id: generateId(),
        file,
        url,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date()
      }

      setImages(prev => [...prev, storedImage])
      return storedImage

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao fazer upload da imagem"
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }, [])

  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === id)
      if (imageToRemove) {
        // Limpar URL do objeto para liberar memória
        URL.revokeObjectURL(imageToRemove.url)
      }
      return prev.filter(img => img.id !== id)
    })
  }, [])

  const clearImages = useCallback(() => {
    // Limpar todas as URLs antes de limpar o array
    images.forEach(img => URL.revokeObjectURL(img.url))
    setImages([])
  }, [images])

  const getImageById = useCallback((id: string) => {
    return images.find(img => img.id === id)
  }, [images])

  // Cleanup automático quando o componente for desmontado
  const cleanup = useCallback(() => {
    clearImages()
  }, [clearImages])

  return {
    images,
    uploadImage,
    removeImage,
    clearImages,
    getImageById,
    isUploading,
    error,
    cleanup
  }
}
