"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, User, LayoutDashboard, MessageSquare, FileText, LogOut } from "lucide-react";

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const navigationLinks = [
    { name: "Início", href: "/" },
    { name: "Portfólio", href: "/portfolio" },
    { name: "Serviços", href: "/services" },
    { name: "Sobre", href: "/about" },
    { name: "Contato", href: "/contact" },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/90 backdrop-blur-md shadow-md py-2"
          : "bg-background/20 backdrop-blur-sm py-4"
      }`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="relative z-10">
          <div className="flex items-center space-x-2">
            <span className="font-display font-bold text-2xl flex items-center">
              <span className="text-primary mr-1">Arte</span>em<span className="text-primary ml-1">Pele</span>
              <div className="w-2 h-2 bg-primary rounded-full ml-1 animate-pulse-glow"></div>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navigationLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary relative group ${
                isActive(link.href)
                  ? "text-primary font-semibold"
                  : "text-foreground"
              }`}
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full
                             ${isActive(link.href) ? "w-full" : "w-0"}"></span>
            </Link>
          ))}
        </nav>

        {/* Authentication Buttons (Desktop) */}
        <div className="hidden md:flex items-center space-x-4">
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none">
                <Avatar className="h-9 w-9 cursor-pointer hover:shadow-glow transition-all">
                  <AvatarImage src={session.user.image || ""} alt={session.user.name || "Usuário"} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {session.user.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-sm border-primary/20">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Perfil</span>
                  </Link>
                </DropdownMenuItem>
                {session.user.isAdmin && (
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/admin" className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Painel Admin</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/messages" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Mensagens</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/contracts" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Contratos</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-destructive cursor-pointer">
                  <div className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild className="border-primary/50 hover:border-primary">
                <Link href="/login">Entrar</Link>
              </Button>
              <Button size="sm" asChild className="bg-primary hover:bg-primary/90">
                <Link href="/register">Cadastrar</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-foreground p-2 rounded-md"
          onClick={toggleMenu}
          aria-label="Alternar menu"
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-md border-t border-primary/10 py-4 px-4 shadow-md">
          <nav className="flex flex-col space-y-4">
            {navigationLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary px-2 py-1 rounded-md ${
                  isActive(link.href) ? "text-primary font-semibold bg-primary/10" : ""
                }`}
                onClick={closeMenu}
              >
                {link.name}
              </Link>
            ))}
            {session ? (
              <>
                <div className="border-t border-primary/10 pt-4 mt-2"></div>
                <Link
                  href="/profile"
                  className="text-sm font-medium transition-colors hover:text-primary px-2 py-1 rounded-md flex items-center gap-2"
                  onClick={closeMenu}
                >
                  <User className="h-4 w-4" />
                  <span>Perfil</span>
                </Link>
                {session.user.isAdmin && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium transition-colors hover:text-primary px-2 py-1 rounded-md flex items-center gap-2"
                    onClick={closeMenu}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Painel Admin</span>
                  </Link>
                )}
                <Link
                  href="/messages"
                  className="text-sm font-medium transition-colors hover:text-primary px-2 py-1 rounded-md flex items-center gap-2"
                  onClick={closeMenu}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Mensagens</span>
                </Link>
                <Link
                  href="/contracts"
                  className="text-sm font-medium transition-colors hover:text-primary px-2 py-1 rounded-md flex items-center gap-2"
                  onClick={closeMenu}
                >
                  <FileText className="h-4 w-4" />
                  <span>Contratos</span>
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    signOut();
                    closeMenu();
                  }}
                  className="w-full mt-2 flex items-center justify-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </Button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2 border-t border-primary/10 mt-2">
                <Button variant="outline" size="sm" asChild className="border-primary/50">
                  <Link href="/login" onClick={closeMenu}>
                    Entrar
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register" onClick={closeMenu}>
                    Cadastrar
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
