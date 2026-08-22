import { useState, useRef, useCallback } from "react";
import { Upload, Link as LinkIcon, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import { useImageOptimization } from "@/hooks/useImageOptimization";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
  aspectHint?: string;
  /** Recommended dimensions, e.g. "800 × 800 px" */
  recommendedSize?: string;
  /** Aspect ratio label, e.g. "1:1 square" */
  aspectRatio?: string;
  className?: string;
}

// Compress image on client side before upload
const compressImage = async (
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      // Calculate new dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to compress image"));
          }
        },
        "image/webp",
        quality
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
};

const ImageUpload = ({
  value,
  onChange,
  folder = "uploads",
  aspectHint,
  recommendedSize = "800 × 800 px",
  aspectRatio = "1:1 square",
  className = "",
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(value || "");
  const [activeTab, setActiveTab] = useState<string>(value ? "url" : "upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { settings } = useImageOptimization();

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB max before compression)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Compress image
      const compressedBlob = await compressImage(
        file,
        settings.maxWidth,
        settings.maxHeight,
        settings.quality / 100
      );

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const filename = `${folder}/${timestamp}-${randomStr}.webp`;

      // Upload through the Bevory API
      const { data, error } = await apiClient.storage
        .from("images")
        .upload(filename, compressedBlob, {
          contentType: "image/webp",
          cacheControl: "31536000",
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = apiClient.storage
        .from("images")
        .getPublicUrl(data.path);

      onChange(urlData.publicUrl);
      setUrlInput(urlData.publicUrl);
      
      const originalSize = (file.size / 1024).toFixed(1);
      const compressedSize = (compressedBlob.size / 1024).toFixed(1);
      
      toast({
        title: "Image uploaded",
        description: `Compressed from ${originalSize}KB to ${compressedSize}KB`,
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [folder, onChange, settings, toast]);

  const handleUrlSubmit = useCallback(() => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      toast({ title: "URL set" });
    }
  }, [urlInput, onChange, toast]);

  const handleClear = useCallback(() => {
    onChange(null);
    setUrlInput("");
  }, [onChange]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Recommended size badge — always visible */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2">
        <ImageIcon className="w-3.5 h-3.5 text-accent shrink-0" />
        <span className="text-xs font-medium text-foreground">Recommended:</span>
        <span className="text-xs font-semibold text-accent">{recommendedSize}</span>
        <span className="text-xs text-muted-foreground">• {aspectRatio}</span>
        <span className="text-xs text-muted-foreground ml-auto">WebP • &lt; 10 MB</span>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="w-3.5 h-3.5" /> Upload
          </TabsTrigger>
          <TabsTrigger value="url" className="gap-2">
            <LinkIcon className="w-3.5 h-3.5" /> URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-3">
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
              transition-colors hover:border-accent hover:bg-accent/5
              ${uploading ? "opacity-50 cursor-wait" : ""}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
                <p className="text-sm text-muted-foreground">Compressing & uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload</p>
                <p className="text-xs text-muted-foreground">
                  Auto-converts to WebP • Max 10MB
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="url" className="mt-3">
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onPaste={(e) => {
                e.stopPropagation();
                const text = e.clipboardData.getData("text");
                setUrlInput(text);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleUrlSubmit();
                }
              }}
            />
            <Button type="button" onClick={handleUrlSubmit} variant="secondary">
              Set
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview */}
      {value && (
        <div className="relative rounded-xl overflow-hidden bg-secondary border border-border">
          <img
            src={value}
            alt="Preview"
            className="w-full h-32 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "";
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 w-7 h-7"
            onClick={handleClear}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {aspectHint && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <ImageIcon className="w-3 h-3" /> {aspectHint}
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
