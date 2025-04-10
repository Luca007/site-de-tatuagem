"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { clientDb } from "@/lib/firebase";
import { collection, getDocs, query, limit as firestoreLimit, orderBy } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";

// Define the portfolio item type
interface PortfolioItem {
  id: string;
  imageUrl: string;
  title: string;
  style: string;
  description: string;
  createdAt: Date;
}

// For development/preview purposes - this will be replaced with real data from Firestore
const PLACEHOLDER_ITEMS: PortfolioItem[] = [
  {
    id: "1",
    imageUrl: "/portfolio/tattoo1.jpg",
    title: "Geometric Wolf",
    style: "Geometric",
    description: "Precision geometric wolf design with fine line work and sacred geometry elements.",
    createdAt: new Date("2023-06-15"),
  },
  {
    id: "2",
    imageUrl: "/portfolio/tattoo2.jpg",
    title: "Traditional Rose",
    style: "Traditional",
    description: "Bold traditional rose with vibrant colors and strong outlines.",
    createdAt: new Date("2023-08-22"),
  },
  {
    id: "3",
    imageUrl: "/portfolio/tattoo3.jpg",
    title: "Realistic Lion",
    style: "Realism",
    description: "Photorealistic lion portrait with detailed shading and texture.",
    createdAt: new Date("2023-09-10"),
  },
  {
    id: "4",
    imageUrl: "/portfolio/tattoo4.jpg",
    title: "Watercolor Abstract",
    style: "Watercolor",
    description: "Vibrant watercolor abstract design with fluid color transitions.",
    createdAt: new Date("2023-10-05"),
  },
  {
    id: "5",
    imageUrl: "/portfolio/tattoo5.jpg",
    title: "Japanese Dragon",
    style: "Japanese",
    description: "Traditional Japanese dragon with cloud work and vibrant colors.",
    createdAt: new Date("2023-11-12"),
  },
  {
    id: "6",
    imageUrl: "/portfolio/tattoo6.jpg",
    title: "Minimalist Mountain",
    style: "Minimalist",
    description: "Clean, simple mountain line work with geometric elements.",
    createdAt: new Date("2023-12-01"),
  },
  {
    id: "7",
    imageUrl: "/portfolio/tattoo7.jpg",
    title: "Blackwork Mandala",
    style: "Blackwork",
    description: "Intricate blackwork mandala with dotwork and geometric patterns.",
    createdAt: new Date("2024-01-18"),
  },
  {
    id: "8",
    imageUrl: "/portfolio/tattoo8.jpg",
    title: "Neo-Traditional Fox",
    style: "Neo-Traditional",
    description: "Colorful neo-traditional fox with bold outlines and stylized elements.",
    createdAt: new Date("2024-02-05"),
  },
  {
    id: "9",
    imageUrl: "/portfolio/tattoo9.jpg",
    title: "Dotwork Skull",
    style: "Dotwork",
    description: "Detailed skull composed entirely of meticulously placed dots.",
    createdAt: new Date("2024-03-20"),
  },
];

interface PortfolioGridProps {
  limit?: number;
  style?: string;
  isAdmin?: boolean;
}

export default function PortfolioGrid({ limit, style, isAdmin = false }: PortfolioGridProps) {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPortfolioItems() {
      try {
        // In a real application, this would fetch data from Firestore
        // For now, we'll use our placeholder data
        let items = [...PLACEHOLDER_ITEMS];

        // Filter by style if provided
        if (style) {
          items = items.filter(item => item.style.toLowerCase() === style.toLowerCase());
        }

        // Sort by most recent first
        items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        // Apply limit if provided
        if (limit && limit > 0) {
          items = items.slice(0, limit);
        }

        setPortfolioItems(items);
      } catch (error) {
        console.error("Error fetching portfolio items:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPortfolioItems();
  }, [limit, style]);

  if (loading) {
    return (
      <div className="w-full py-10 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (portfolioItems.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No portfolio items found.</p>
      </div>
    );
  }

  return (
    <div className="portfolio-grid">
      {portfolioItems.map((item) => (
        <Link
          key={item.id}
          href={`/portfolio/${item.id}`}
          className="portfolio-item group overflow-hidden"
        >
          <Card className="overflow-hidden border-0 transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-0 relative">
              <div className="aspect-square w-full relative">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <h3 className="text-white font-medium text-lg">{item.title}</h3>
                <p className="text-white/80 text-sm">{item.style}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
