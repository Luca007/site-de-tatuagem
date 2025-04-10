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
      {/* Hero Section */}
      <section className="hero-section bg-gradient-to-b from-background to-muted/20 pt-20">
        <div className="container mx-auto px-4 md:px-6 flex flex-col lg:flex-row items-center gap-8 md:gap-12">
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <h1 className="font-bold tracking-tighter animate-fade-in">
              Transforming <span className="gradient-text">Ideas</span> Into <br />
              Stunning <span className="gradient-text">Tattoo Art</span>
            </h1>
            <p className="text-muted-foreground md:text-xl max-w-[600px] mx-auto lg:mx-0 animate-slide-up">
              Expert tattoo artistry that turns your vision into permanent art.
              Custom designs, flawless execution, and an experience to remember.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up">
              <Button size="lg" className="btn-hover-effect" asChild>
                <Link href="/portfolio">Explore Portfolio</Link>
              </Button>
              <Button size="lg" variant="outline" className="btn-hover-effect" asChild>
                <Link href="/contact">Book Consultation</Link>
              </Button>
            </div>
          </div>
          <div className="flex-1 relative w-full max-w-[500px] mx-auto">
            <div className="relative aspect-square rounded-full overflow-hidden border-8 border-primary/20 shadow-xl animate-fade-in">
              <Image
                src="/hero-tattoo.jpg"
                alt="Tattoo artist at work"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 500px"
                priority
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-background rounded-lg shadow-lg p-3 border border-border animate-slide-up">
              <p className="font-medium text-sm">10+ Years Experience</p>
              <p className="text-muted-foreground text-xs">Professional Artist</p>
            </div>
          </div>
        </div>

        <div className="w-full flex justify-center mt-16 pb-8 animate-fade-in">
          <div className="flex gap-4 md:gap-12">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold">1000+</p>
              <p className="text-muted-foreground">Happy Clients</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold">500+</p>
              <p className="text-muted-foreground">Unique Designs</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold">15+</p>
              <p className="text-muted-foreground">Awards Won</p>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Preview Section */}
      <section className="section-padding bg-muted/20">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="section-title">Featured Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore a selection of our finest tattoo creations, showcasing diverse styles and techniques.
            </p>
          </div>
          <PortfolioGrid limit={6} />
          <div className="flex justify-center mt-10">
            <Button size="lg" asChild>
              <Link href="/portfolio">View Full Portfolio</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="section-padding">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="section-title">Our Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We offer a range of professional tattoo services to bring your vision to life
            </p>
          </div>
          <ServiceCards />
        </div>
      </section>

      {/* Artist Bio Section */}
      <ArtistSection />

      {/* Testimonials Section */}
      <section className="section-padding bg-muted/20">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="section-title">What Our Clients Say</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Read what our satisfied clients have to say about their tattoo experiences
            </p>
          </div>
          <TestimonialSlider />
        </div>
      </section>

      {/* Call to Action */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="section-title text-primary-foreground">Ready for Your New Tattoo?</h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Contact us today to schedule a consultation and bring your tattoo ideas to life.
          </p>
          <Button size="lg" variant="secondary" className="btn-hover-effect" asChild>
            <Link href="/contact">Book Your Session</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
