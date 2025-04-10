import Link from 'next/link';
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin, Clock } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-secondary-foreground relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute left-0 top-0 w-full h-full bg-tattoo-pattern bg-repeat"></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <h3 className="font-display font-bold text-2xl mb-6 flex items-center">
              <span className="text-primary mr-1">Arte</span>em<span className="text-primary ml-1">Pele</span>
            </h3>
            <p className="text-secondary-foreground/80 mb-6">
              Estúdio profissional de tatuagem oferecendo designs personalizados
              e trabalho de alta qualidade em um ambiente limpo e confortável.
            </p>
            <div className="flex space-x-5">
              <Link
                href="https://instagram.com"
                target="_blank"
                className="text-secondary-foreground/70 hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-6 w-6" />
              </Link>
              <Link
                href="https://facebook.com"
                target="_blank"
                className="text-secondary-foreground/70 hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-6 w-6" />
              </Link>
              <Link
                href="https://twitter.com"
                target="_blank"
                className="text-secondary-foreground/70 hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-6 w-6" />
              </Link>
            </div>
          </div>

          <div className="md:ml-10">
            <h4 className="font-display text-lg mb-5 relative inline-block">
              Links Rápidos
              <span className="absolute -bottom-1 left-0 w-12 h-0.5 bg-primary"></span>
            </h4>
            <nav className="flex flex-col space-y-3 mt-6">
              <Link href="/" className="text-secondary-foreground/70 hover:text-primary transition-colors flex items-center">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2 opacity-0 group-hover:opacity-100"></span>
                Início
              </Link>
              <Link href="/portfolio" className="text-secondary-foreground/70 hover:text-primary transition-colors flex items-center">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2 opacity-0 group-hover:opacity-100"></span>
                Portfólio
              </Link>
              <Link href="/services" className="text-secondary-foreground/70 hover:text-primary transition-colors flex items-center">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2 opacity-0 group-hover:opacity-100"></span>
                Serviços
              </Link>
              <Link href="/about" className="text-secondary-foreground/70 hover:text-primary transition-colors flex items-center">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2 opacity-0 group-hover:opacity-100"></span>
                Sobre Nós
              </Link>
              <Link href="/contact" className="text-secondary-foreground/70 hover:text-primary transition-colors flex items-center">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2 opacity-0 group-hover:opacity-100"></span>
                Contato
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="font-display text-lg mb-5 relative inline-block">
              Contato
              <span className="absolute -bottom-1 left-0 w-12 h-0.5 bg-primary"></span>
            </h4>
            <div className="space-y-4 mt-6">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-secondary-foreground/80">Rua das Tatuagens, 123, Distrito Artístico, Cidade</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span className="text-secondary-foreground/80">(11) 99999-9999</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span className="text-secondary-foreground/80">contato@arteempele.com.br</span>
              </div>
              <div className="mt-6 pt-4 border-t border-secondary-foreground/10">
                <h5 className="font-medium mb-3 flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-primary" />
                  Horário de Funcionamento
                </h5>
                <p className="text-secondary-foreground/80">Segunda - Sexta: 10h - 20h</p>
                <p className="text-secondary-foreground/80">Sábado: 11h - 18h</p>
                <p className="text-secondary-foreground/80">Domingo: Fechado</p>
              </div>
            </div>
          </div>
        </div>

        <div className="needle-divider my-12"></div>

        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-secondary-foreground/70">
            © {currentYear} Arte em Pele. Todos os direitos reservados.
          </p>
          <div className="flex space-x-6 mt-6 md:mt-0">
            <Link href="/terms" className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors">
              Termos de Serviço
            </Link>
            <Link href="/privacy" className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors">
              Política de Privacidade
            </Link>
            <Link href="/contracts" className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors">
              Documentos Legais
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
