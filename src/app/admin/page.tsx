"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PortfolioManagement from "@/components/admin/portfolio-management";
import ClientMessages from "@/components/admin/client-messages";
import WatermarkSettings from "@/components/admin/watermark-settings";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("portfolio");

  // This effect makes sure that the URL hash is in sync with the active tab
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (hash && ["portfolio", "messages", "watermark"].includes(hash)) {
        setActiveTab(hash);
      }

      // Update the URL when the tab changes
      const handleTabChange = (value: string) => {
        window.location.hash = value;
        setActiveTab(value);
      };

      // Listen for hash changes
      const onHashChange = () => {
        const newHash = window.location.hash.replace("#", "");
        if (newHash && ["portfolio", "messages", "watermark"].includes(newHash)) {
          setActiveTab(newHash);
        }
      };

      window.addEventListener("hashchange", onHashChange);

      return () => {
        window.removeEventListener("hashchange", onHashChange);
      };
    }
  }, []);

  // If not logged in or not an admin, redirect to home
  if (status === "loading") {
    return (
      <div className="container py-16 flex justify-center items-center min-h-[75vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (status === "unauthenticated" || !session?.user.isAdmin) {
    redirect("/");
  }

  return (
    <div className="container py-12 max-w-7xl">
      <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-8">
        Manage your portfolio, client messages, and site settings
      </p>

      <Tabs
        defaultValue="portfolio"
        value={activeTab}
        onValueChange={(value) => {
          window.location.hash = value;
          setActiveTab(value);
        }}
        className="space-y-6"
      >
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="watermark">Watermark</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Portfolio Management</h2>
            <p className="text-muted-foreground mb-6">
              Upload, arrange, and manage your tattoo portfolio images
            </p>
          </div>
          <PortfolioManagement />
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Client Messages</h2>
            <p className="text-muted-foreground mb-6">
              View and respond to client inquiries and consultation requests
            </p>
          </div>
          <ClientMessages />
        </TabsContent>

        <TabsContent value="watermark" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Watermark Settings</h2>
            <p className="text-muted-foreground mb-6">
              Configure your logo watermark settings for portfolio images
            </p>
          </div>
          <WatermarkSettings />
        </TabsContent>
      </Tabs>

      <Alert className="mt-12">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Admin Tip</AlertTitle>
        <AlertDescription>
          All changes you make in the admin panel are automatically saved to the cloud and will be immediately visible to your visitors.
        </AlertDescription>
      </Alert>
    </div>
  );
}
