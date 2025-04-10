import Link from 'next/link';
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-raleway font-bold text-2xl mb-4">
              Ink<span className="text-primary">Master</span>
            </h3>
            <p className="text-muted-foreground mb-4">
              Professional tattoo studio offering custom designs and high-quality work in a clean,
              comfortable environment.
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://instagram.com"
                target="_blank"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link
                href="https://facebook.com"
                target="_blank"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link
                href="https://twitter.com"
                target="_blank"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-lg mb-4">Quick Links</h4>
            <nav className="flex flex-col space-y-2">
              <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">Home</Link>
              <Link href="/portfolio" className="text-muted-foreground hover:text-primary transition-colors">Portfolio</Link>
              <Link href="/services" className="text-muted-foreground hover:text-primary transition-colors">Services</Link>
              <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link>
              <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link>
            </nav>
          </div>

          <div>
            <h4 className="font-medium text-lg mb-4">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-muted-foreground">123 Tattoo Street, Art District, City</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span className="text-muted-foreground">(123) 456-7890</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span className="text-muted-foreground">contact@inkmaster.com</span>
              </div>
              <div className="mt-4">
                <h5 className="font-medium mb-2">Hours</h5>
                <p className="text-muted-foreground">Monday - Friday: 10am - 8pm</p>
                <p className="text-muted-foreground">Saturday: 11am - 6pm</p>
                <p className="text-muted-foreground">Sunday: Closed</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-4 border-t border-border/50 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} InkMaster. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/contracts" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Legal Documents
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
