import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import PortfolioGrid from "@/components/portfolio/portfolio-grid";
import TestimonialSlider from "@/components/home/testimonial-slider";
import ArtistSection from "@/components/home/artist-section";
import ServiceCards from "@/components/home/service-cards";

export default function HomePage() {
  return (
    <div className="flex flex-col w-full">
      {/* Seção Hero */}
      <section className="hero-section relative bg-gradient-to-b from-background via-background to-secondary/20 pt-20">
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full bg-ink-texture bg-no-repeat bg-right-top"></div>
        </div>

        <div className="container mx-auto px-4 md:px-6 flex flex-col lg:flex-row items-center gap-8 md:gap-12 relative z-10">
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <h1 className="font-bold tracking-tighter animate-fade-in">
              Transformando <span className="gradient-text">Ideias</span> Em <br />
              <span className="gradient-text">Arte na Pele</span>
            </h1>
            <p className="text-muted-foreground md:text-xl max-w-[600px] mx-auto lg:mx-0 animate-slide-up">
              Tatuagens artísticas que transformam sua visão em arte permanente.
              Designs exclusivos, execução impecável e uma experiência memorável.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up">
              <Button size="lg" className="btn-hover-effect" asChild>
                <Link href="/portfolio">Explorar Portfólio</Link>
              </Button>
              <Button size="lg" variant="outline" className="btn-hover-effect" asChild>
                <Link href="/contact">Agendar Consulta</Link>
              </Button>
            </div>
          </div>
          <div className="flex-1 relative w-full max-w-[500px] mx-auto">
            <div className="relative aspect-square rounded-full overflow-hidden border-8 border-primary/20 shadow-lg animate-fade-in">
              <Image
                src="/images/tattoo-artist-banner.jpg"
                alt="Artista tatuando"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 500px"
                priority
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-background rounded-lg shadow-lg p-3 border border-border animate-slide-up tattoo-card">
              <p className="font-medium text-sm">+10 Anos de Experiência</p>
              <p className="text-muted-foreground text-xs">Artista Profissional</p>
            </div>
          </div>
        </div>

        <div className="w-full flex justify-center mt-16 pb-8 animate-fade-in">
          <div className="flex gap-4 md:gap-12">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold">1000+</p>
              <p className="text-muted-foreground">Clientes Satisfeitos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold">500+</p>
              <p className="text-muted-foreground">Designs Exclusivos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold">15+</p>
              <p className="text-muted-foreground">Prêmios Conquistados</p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Prévia do Portfólio */}
      <section className="section-padding bg-muted/20 relative overflow-hidden">
        <div className="needle-divider absolute top-0 left-1/2 transform -translate-x-1/2"></div>
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="section-title">Trabalhos em Destaque</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore uma seleção das nossas melhores criações de tatuagem, destacando diversos estilos e técnicas.
            </p>
          </div>
          <PortfolioGrid limit={6} />
          <div className="flex justify-center mt-10">
            <Button size="lg" asChild>
              <Link href="/portfolio">Ver Portfólio Completo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Seção de Serviços */}
      <section className="section-padding relative">
        <div className="absolute inset-0 z-0 opacity-5 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full bg-ink-texture bg-no-repeat bg-right-top"></div>
        </div>
        <div className="container relative z-10">
          <div className="text-center mb-10">
            <h2 className="section-title">Nossos Serviços</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Oferecemos uma variedade de serviços profissionais de tatuagem para dar vida à sua visão
            </p>
          </div>
          <ServiceCards />
        </div>
      </section>

      {/* Seção Bio do Artista */}
      <ArtistSection />

      {/* Seção de Depoimentos */}
      <section className="section-padding bg-muted/20 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 bottom-0 bg-tattoo-pattern bg-repeat"></div>
        </div>
        <div className="container relative z-10">
          <div className="text-center mb-10">
            <h2 className="section-title">O Que Nossos Clientes Dizem</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Leia o que nossos clientes satisfeitos têm a dizer sobre suas experiências de tatuagem
            </p>
          </div>
          <TestimonialSlider />
        </div>
      </section>

      {/* Chamada para Ação */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="section-title text-primary-foreground">Pronto Para Sua Nova Tatuagem?</h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Entre em contato hoje para agendar uma consulta e dar vida às suas ideias de tatuagem.
          </p>
          <Button size="lg" variant="secondary" className="btn-hover-effect shadow-lg" asChild>
            <Link href="/contact">Agende Sua Sessão</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
