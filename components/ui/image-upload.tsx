"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, X, Camera, User, Building } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ImageUploadProps {
  value?: string
  onChange: (value: string) => void
  onRemove: () => void
  type?: "profile" | "company" | "general"
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  disabled?: boolean
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  type = "general",
  size = "md",
  className = "",
  disabled = false
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
    xl: "w-40 h-40"
  }

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size must be less than 5MB')
      return
    }

    setIsUploading(true)

    try {
      // Create a preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        onChange(result)
        setIsUploading(false)
      }
      reader.readAsDataURL(file)

      // In a real app, you would upload to your server/cloud storage here
      // const formData = new FormData()
      // formData.append('file', file)
      // const response = await fetch('/api/upload', {
      //   method: 'POST',
      //   body: formData
      // })
      // const { url } = await response.json()
      // onChange(url)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
      setIsUploading(false)
    }
  }, [onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const getIcon = () => {
    switch (type) {
      case "profile":
        return User
      case "company":
        return Building
      default:
        return Upload
    }
  }

  const Icon = getIcon()

  if (value) {
    return (
      <motion.div 
        className={`relative group ${className}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {type === "profile" || type === "company" ? (
          <div className="relative">
            <Avatar className={`${sizeClasses[size]} profile-image border-4 border-background shadow-xl`}>
              <AvatarImage src={value} alt="Uploaded image" className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                <Icon className="w-1/2 h-1/2 text-primary" />
              </AvatarFallback>
            </Avatar>
            <motion.button
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onRemove}
              disabled={disabled}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-3 h-3" />
            </motion.button>
            <motion.button
              className="absolute -bottom-2 -right-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleClick}
              disabled={disabled}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Camera className="w-3 h-3" />
            </motion.button>
          </div>
        ) : (
          <Card className="relative overflow-hidden modern-card">
            <CardContent className="p-0">
              <img 
                src={value} 
                alt="Uploaded image" 
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleClick}
                  disabled={disabled}
                  className="bg-white/90 hover:bg-white text-black"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Change
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={onRemove}
                  disabled={disabled}
                  className="bg-red-500/90 hover:bg-red-500"
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
      </motion.div>
    )
  }

  return (
    <motion.div 
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`image-upload-area cursor-pointer transition-all duration-300 ${
          isDragOver ? "dragover" : ""
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <AnimatePresence mode="wait">
            {isUploading ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center"
              >
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </motion.div>
            ) : (
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mb-4"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <Icon className="w-8 h-8 text-primary" />
                </motion.div>
                <h3 className="text-lg font-semibold mb-2">
                  {type === "profile" ? "Upload Profile Photo" : 
                   type === "company" ? "Upload Company Logo" : 
                   "Upload Image"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop an image here, or click to select
                </p>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>Supports: JPG, PNG, GIF</span>
                  <span>•</span>
                  <span>Max size: 5MB</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
    </motion.div>
  )
}
