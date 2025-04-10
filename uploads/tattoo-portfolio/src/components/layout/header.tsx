"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { Menu, X } from "lucide-react";

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
    { name: "Home", href: "/" },
    { name: "Portfolio", href: "/portfolio" },
    { name: "Services", href: "/services" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/90 backdrop-blur-md shadow-md py-2"
          : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center space-x-2">
            <span className="font-raleway font-bold text-2xl">
              Ink<span className="text-primary">Master</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navigationLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive(link.href)
                  ? "text-primary font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Authentication Buttons (Desktop) */}
        <div className="hidden md:flex items-center space-x-4">
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none">
                <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                  <AvatarImage src={session.user.image || ""} alt={session.user.name || "User"} />
                  <AvatarFallback>
                    {session.user.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                {session.user.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Admin Dashboard</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/messages">Messages</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/contracts">Contracts</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-red-500">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Sign Up</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-foreground p-2 rounded-md"
          onClick={toggleMenu}
          aria-label="Toggle menu"
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
        <div className="md:hidden bg-background border-t py-4 px-4 shadow-md">
          <nav className="flex flex-col space-y-4">
            {navigationLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(link.href) ? "text-primary font-semibold" : ""
                }`}
                onClick={closeMenu}
              >
                {link.name}
              </Link>
            ))}
            {session ? (
              <>
                <Link
                  href="/profile"
                  className="text-sm font-medium transition-colors hover:text-primary"
                  onClick={closeMenu}
                >
                  Profile
                </Link>
                {session.user.isAdmin && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium transition-colors hover:text-primary"
                    onClick={closeMenu}
                  >
                    Admin Dashboard
                  </Link>
                )}
                <Link
                  href="/messages"
                  className="text-sm font-medium transition-colors hover:text-primary"
                  onClick={closeMenu}
                >
                  Messages
                </Link>
                <Link
                  href="/contracts"
                  className="text-sm font-medium transition-colors hover:text-primary"
                  onClick={closeMenu}
                >
                  Contracts
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    signOut();
                    closeMenu();
                  }}
                  className="w-full mt-2"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login" onClick={closeMenu}>
                    Sign In
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register" onClick={closeMenu}>
                    Sign Up
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
