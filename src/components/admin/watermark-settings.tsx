"use client";

import { useState, useRef, useEffect, type ChangeEvent } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { clientStorage, clientDb } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { AlertCircle, ImageIcon, UploadCloud, Check, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface WatermarkConfig {
  enabled: boolean;
  logoUrl: string;
  opacity: number;
  position: string;
  size: number;
}

// Default settings
const DEFAULT_WATERMARK_CONFIG: WatermarkConfig = {
  enabled: true,
  logoUrl: "",
  opacity: 0.5,
  position: "bottom-right",
  size: 30,
};

// Demo images for preview
const DEMO_IMAGES = [
  "/portfolio/tattoo1.jpg",
  "/portfolio/tattoo2.jpg",
  "/portfolio/tattoo3.jpg",
];

export default function WatermarkSettings() {
  const [config, setConfig] = useState<WatermarkConfig>(DEFAULT_WATERMARK_CONFIG);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activePreviewImage, setActivePreviewImage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [watermarkedPreview, setWatermarkedPreview] = useState<string | null>(null);

  // Simulated fetch of existing watermark config from Firestore
  useEffect(() => {
    const loadConfig = async () => {
      try {
        // Simulated Firestore fetch with timeout
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // For demo purposes, use our default values but with a sample logo
        const savedConfig = {
          ...DEFAULT_WATERMARK_CONFIG,
          logoUrl: "/logo-watermark.png", // This would be the Firebase Storage URL in production
        };
        setConfig(savedConfig);
        setLogoPreview(savedConfig.logoUrl);

        // Generate initial watermarked preview
        generateWatermarkedPreview(savedConfig, DEMO_IMAGES[activePreviewImage]);
      } catch (error) {
        console.error("Error loading watermark configuration:", error);
        toast.error("Failed to load watermark settings");
      }
    };

    loadConfig();
  }, [activePreviewImage]); // Added activePreviewImage to dependencies

  // Generate watermarked preview when active preview image or config changes
  useEffect(() => {
    if (config.logoUrl || logoPreview) {
      generateWatermarkedPreview(
        { ...config, logoUrl: logoPreview || config.logoUrl },
        DEMO_IMAGES[activePreviewImage]
      );
    }
  }, [
    activePreviewImage,
    config, // Include the entire config object in dependencies
    logoPreview
  ]);

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setLogoFile(file);

      // Create a preview of the logo
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) {
      toast.error("Please select a logo file first");
      return;
    }

    setIsUploading(true);

    try {
      // In a real app, this would upload to Firebase Storage
      // Simulate upload with a timeout
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update config with the "uploaded" logo URL (using the preview for demo)
      setConfig({ ...config, logoUrl: logoPreview as string });
      toast.success("Logo uploaded successfully");
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo");
    } finally {
      setIsUploading(false);
      setLogoFile(null);
      // Keep the logoPreview for the watermark
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);

    try {
      // In a real app, this would save to Firestore
      // Simulate saving with a timeout
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Watermark settings saved successfully");
    } catch (error) {
      console.error("Error saving watermark settings:", error);
      toast.error("Failed to save watermark settings");
    } finally {
      setIsSaving(false);
    }
  };

  const generateWatermarkedPreview = async (
    watermarkConfig: WatermarkConfig,
    imageSrc: string
  ) => {
    if (!watermarkConfig.logoUrl && !logoPreview) {
      setWatermarkedPreview(null);
      return;
    }

    try {
      // Create canvas elements for watermarking
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("Canvas context not available");
        return;
      }

      // Load the main image
      const mainImage = new Image();
      mainImage.crossOrigin = "anonymous";

      // Load the watermark logo
      const logoImage = new Image();
      logoImage.crossOrigin = "anonymous";

      // Wait for the main image to load
      await new Promise<void>((resolve, reject) => {
        mainImage.onload = () => resolve();
        mainImage.onerror = () => reject(new Error("Failed to load main image"));
        mainImage.src = imageSrc;
      });

      // Set canvas dimensions to match the main image
      canvas.width = mainImage.width;
      canvas.height = mainImage.height;

      // Draw the main image
      ctx.drawImage(mainImage, 0, 0);

      // Load and draw the watermark
      try {
        await new Promise<void>((resolve, reject) => {
          logoImage.onload = () => resolve();
          logoImage.onerror = () => reject(new Error("Failed to load logo image"));
          logoImage.src = watermarkConfig.logoUrl || logoPreview as string;
        });

        // Set global alpha for transparency
        ctx.globalAlpha = watermarkConfig.opacity;

        // Determine watermark size (percentage of the main image)
        const watermarkWidth = (mainImage.width * watermarkConfig.size) / 100;
        const watermarkHeight = (logoImage.height / logoImage.width) * watermarkWidth;

        // Determine watermark position
        let x = 0;
        let y = 0;

        switch (watermarkConfig.position) {
          case "top-left":
            x = 20;
            y = 20;
            break;
          case "top-right":
            x = mainImage.width - watermarkWidth - 20;
            y = 20;
            break;
          case "bottom-left":
            x = 20;
            y = mainImage.height - watermarkHeight - 20;
            break;
          case "bottom-right":
            x = mainImage.width - watermarkWidth - 20;
            y = mainImage.height - watermarkHeight - 20;
            break;
          case "center":
            x = (mainImage.width - watermarkWidth) / 2;
            y = (mainImage.height - watermarkHeight) / 2;
            break;
        }

        // Draw the watermark
        ctx.drawImage(logoImage, x, y, watermarkWidth, watermarkHeight);

        // Convert canvas to data URL
        const watermarkedImage = canvas.toDataURL("image/jpeg", 0.92);
        setWatermarkedPreview(watermarkedImage);
      } catch (error) {
        console.error("Error adding watermark:", error);
      }
    } catch (error) {
      console.error("Error generating watermarked preview:", error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column: Settings */}
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="watermark-enabled" className="text-base font-medium">
                Enable Watermarking
              </Label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setConfig({ ...config, enabled: true })}
                  className={`px-3 py-1.5 text-sm rounded-l-md transition-colors ${
                    config.enabled
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  On
                </button>
                <button
                  onClick={() => setConfig({ ...config, enabled: false })}
                  className={`px-3 py-1.5 text-sm rounded-r-md transition-colors ${
                    !config.enabled
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  Off
                </button>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Watermark Logo</Label>
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 border rounded-md flex items-center justify-center overflow-hidden bg-muted"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ cursor: "pointer" }}
                >
                  {logoPreview || config.logoUrl ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={logoPreview || config.logoUrl}
                        alt="Watermark Logo"
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    type="file"
                    id="logo-upload"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoUpload}
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2"
                    disabled={isUploading}
                  >
                    <UploadCloud className="h-4 w-4" />
                    <span>Select Logo</span>
                  </Button>
                  <Button
                    onClick={handleUploadLogo}
                    className="w-full"
                    disabled={!logoFile || isUploading}
                  >
                    {isUploading ? "Uploading..." : "Upload Logo"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Opacity Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="opacity-slider" className="text-base font-medium">
                  Opacity
                </Label>
                <span className="text-sm font-medium">{Math.round(config.opacity * 100)}%</span>
              </div>
              <Slider
                id="opacity-slider"
                min={0.1}
                max={1}
                step={0.05}
                value={[config.opacity]}
                onValueChange={(value) => setConfig({ ...config, opacity: value[0] })}
              />
            </div>

            {/* Size Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="size-slider" className="text-base font-medium">
                  Size
                </Label>
                <span className="text-sm font-medium">{config.size}%</span>
              </div>
              <Slider
                id="size-slider"
                min={5}
                max={50}
                step={1}
                value={[config.size]}
                onValueChange={(value) => setConfig({ ...config, size: value[0] })}
              />
            </div>

            {/* Position Radio Group */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Position</Label>
              <RadioGroup
                value={config.position}
                onValueChange={(value) => setConfig({ ...config, position: value })}
                className="grid grid-cols-3 gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="top-left" id="position-top-left" />
                  <Label htmlFor="position-top-left">Top Left</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="top-right" id="position-top-right" />
                  <Label htmlFor="position-top-right">Top Right</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="center" id="position-center" />
                  <Label htmlFor="position-center">Center</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bottom-left" id="position-bottom-left" />
                  <Label htmlFor="position-bottom-left">Bottom Left</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bottom-right" id="position-bottom-right" />
                  <Label htmlFor="position-bottom-right">Bottom Right</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        <Button
          className="w-full"
          onClick={handleSaveSettings}
          disabled={isSaving || !config.logoUrl}
        >
          {isSaving ? "Saving..." : "Save Watermark Settings"}
        </Button>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>
            Your watermark will be automatically applied to all uploaded portfolio images.
            For best results, use a transparent PNG logo.
          </AlertDescription>
        </Alert>
      </div>

      {/* Right Column: Preview */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Preview</h3>
        <div className="border rounded-lg overflow-hidden">
          {watermarkedPreview ? (
            <div className="relative aspect-square">
              <Image
                src={watermarkedPreview}
                alt="Watermarked Preview"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="aspect-square bg-muted flex items-center justify-center text-muted-foreground">
              <p>Upload a logo to see the watermark preview</p>
            </div>
          )}
        </div>
        <div className="flex gap-2 justify-center mt-2">
          {DEMO_IMAGES.map((img, index) => (
            <button
              key={`preview-image-${img}`} {/* Use the image URL as part of the key */}
              className={`w-16 h-16 rounded overflow-hidden border-2 ${
                activePreviewImage === index ? 'border-primary' : 'border-transparent'
              }`}
              onClick={() => setActivePreviewImage(index)}
            >
              <div className="relative w-full h-full">
                <Image
                  src={img}
                  alt={`Preview sample ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Click on the thumbnails to see the watermark on different images
        </p>
      </div>
    </div>
  );
}
