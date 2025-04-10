"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, X, MoveVertical, Trash2, Edit, Image as ImageIcon } from "lucide-react";
import { clientDb, clientStorage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import Draggable from "react-draggable";

// Demo data for development - will be replaced with Firestore data
const DEMO_PORTFOLIO_ITEMS = [
  {
    id: "1",
    title: "Geometric Wolf",
    style: "Geometric",
    description: "Precision geometric wolf design with fine line work and sacred geometry elements.",
    imageUrl: "/portfolio/tattoo1.jpg",
    order: 1,
  },
  {
    id: "2",
    title: "Traditional Rose",
    style: "Traditional",
    description: "Bold traditional rose with vibrant colors and strong outlines.",
    imageUrl: "/portfolio/tattoo2.jpg",
    order: 2,
  },
  {
    id: "3",
    title: "Realistic Lion",
    style: "Realism",
    description: "Photorealistic lion portrait with detailed shading and texture.",
    imageUrl: "/portfolio/tattoo3.jpg",
    order: 3,
  },
];

interface PortfolioItem {
  id: string;
  title: string;
  style: string;
  description: string;
  imageUrl: string;
  order: number;
}

export default function PortfolioManagement() {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(DEMO_PORTFOLIO_ITEMS);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newItemData, setNewItemData] = useState({
    title: "",
    style: "",
    description: "",
  });
  const [editItemData, setEditItemData] = useState({
    title: "",
    style: "",
    description: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleAddClick = () => {
    setIsAddDialogOpen(true);
    setImagePreview(null);
    setFile(null);
    setNewItemData({
      title: "",
      style: "",
      description: "",
    });
  };

  const handleEditClick = (item: PortfolioItem) => {
    setSelectedItem(item);
    setEditItemData({
      title: item.title,
      style: item.style,
      description: item.description,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (item: PortfolioItem) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      // Create a preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleAddSubmit = async () => {
    if (!file) {
      toast.error("Please select an image to upload");
      return;
    }

    if (!newItemData.title || !newItemData.style) {
      toast.error("Please fill in at least the title and style fields");
      return;
    }

    setIsUploading(true);

    try {
      // In a real app, this would upload to Firebase Storage and save to Firestore
      // For now, we'll simulate it with a timeout
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Create a new portfolio item
      const newItem: PortfolioItem = {
        id: Date.now().toString(), // This would be a Firestore document ID
        title: newItemData.title,
        style: newItemData.style,
        description: newItemData.description,
        imageUrl: imagePreview || "/portfolio/placeholder.jpg", // In reality, this would be the Firebase Storage URL
        order: portfolioItems.length + 1,
      };

      setPortfolioItems([...portfolioItems, newItem]);
      setIsAddDialogOpen(false);
      toast.success("Portfolio item added successfully");
    } catch (error) {
      console.error("Error adding portfolio item:", error);
      toast.error("Failed to add portfolio item");
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedItem) return;

    setIsUploading(true);

    try {
      // In a real app, this would update the Firestore document
      // For now, we'll simulate it with a timeout
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedItems = portfolioItems.map((item) => {
        if (item.id === selectedItem.id) {
          return {
            ...item,
            title: editItemData.title,
            style: editItemData.style,
            description: editItemData.description,
          };
        }
        return item;
      });

      setPortfolioItems(updatedItems);
      setIsEditDialogOpen(false);
      toast.success("Portfolio item updated successfully");
    } catch (error) {
      console.error("Error updating portfolio item:", error);
      toast.error("Failed to update portfolio item");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedItem) return;

    try {
      // In a real app, this would delete the Firestore document and the image from Storage
      // For now, we'll simulate it with a timeout
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedItems = portfolioItems.filter((item) => item.id !== selectedItem.id);
      setPortfolioItems(updatedItems);
      setIsDeleteDialogOpen(false);
      toast.success("Portfolio item deleted successfully");
    } catch (error) {
      console.error("Error deleting portfolio item:", error);
      toast.error("Failed to delete portfolio item");
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card
          className="border-dashed border-2 cursor-pointer flex flex-col items-center justify-center text-center p-6 h-[300px]"
          onClick={handleAddClick}
        >
          <CardContent className="flex flex-col items-center justify-center p-6 h-full space-y-4">
            <PlusCircle className="h-16 w-16 text-muted-foreground" />
            <div>
              <h3 className="font-semibold">Add New Tattoo</h3>
              <p className="text-sm text-muted-foreground">Upload a new portfolio item</p>
            </div>
          </CardContent>
        </Card>

        {portfolioItems.map((item) => (
          <Card key={item.id} className="overflow-hidden relative group h-[300px]">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
            <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white"
                onClick={() => handleEditClick(item)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white"
                onClick={() => handleDeleteClick(item)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="absolute inset-0">
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
              <h3 className="text-white font-semibold text-lg">{item.title}</h3>
              <p className="text-white/80 text-sm">{item.style}</p>
            </div>
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <Button variant="outline" size="icon" className="h-8 w-8 bg-white">
                <MoveVertical className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Add New Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add New Portfolio Item</DialogTitle>
            <DialogDescription>
              Upload a new tattoo image to showcase in your portfolio
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid items-center gap-4">
              <div
                className="border-2 border-dashed rounded-md flex items-center justify-center flex-col p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <div className="relative w-full h-44">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-contain"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImagePreview(null);
                        setFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG or WebP (max. 5MB)
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="E.g., Geometric Wolf"
                  value={newItemData.title}
                  onChange={(e) =>
                    setNewItemData({ ...newItemData, title: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="style">Style</Label>
                <Input
                  id="style"
                  placeholder="E.g., Geometric, Traditional, Realism"
                  value={newItemData.style}
                  onChange={(e) =>
                    setNewItemData({ ...newItemData, style: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the tattoo, techniques used, etc."
                  rows={3}
                  value={newItemData.description}
                  onChange={(e) =>
                    setNewItemData({ ...newItemData, description: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSubmit}
              disabled={isUploading || !file || !newItemData.title || !newItemData.style}
            >
              {isUploading ? "Uploading..." : "Add Portfolio Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Portfolio Item</DialogTitle>
            <DialogDescription>
              Update the details of this portfolio item
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedItem && (
              <div className="grid items-center gap-4">
                <div className="relative w-full h-44">
                  <Image
                    src={selectedItem.imageUrl}
                    alt={selectedItem.title}
                    fill
                    className="object-contain rounded-md"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editItemData.title}
                    onChange={(e) =>
                      setEditItemData({ ...editItemData, title: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-style">Style</Label>
                  <Input
                    id="edit-style"
                    value={editItemData.style}
                    onChange={(e) =>
                      setEditItemData({ ...editItemData, style: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    rows={3}
                    value={editItemData.description}
                    onChange={(e) =>
                      setEditItemData({ ...editItemData, description: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={isUploading || !editItemData.title || !editItemData.style}
            >
              {isUploading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Delete Portfolio Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this portfolio item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedItem && (
              <div className="flex items-center gap-4 rounded-md border p-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md">
                  <Image
                    src={selectedItem.imageUrl}
                    alt={selectedItem.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold">{selectedItem.title}</h4>
                  <p className="text-sm text-muted-foreground">{selectedItem.style}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSubmit}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
