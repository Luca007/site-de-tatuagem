import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ArtistSection() {
  return (
    <section className="section-padding">
      <div className="container">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="relative w-full max-w-md mx-auto lg:mx-0">
            <div className="aspect-[3/4] rounded-lg overflow-hidden shadow-xl">
              <Image
                src="/artist.jpg"
                alt="Tattoo Artist"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground p-4 rounded-md">
              <p className="font-bold">10+ Years</p>
              <p className="text-sm">Professional Experience</p>
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">Meet Your Artist</h4>
              <h2 className="section-title mb-0 text-left">Alex Rivera</h2>
              <p className="text-lg text-muted-foreground">Master Tattoo Artist & Studio Owner</p>
            </div>

            <div className="space-y-4">
              <p>
                With over a decade of experience in the tattoo industry, I specialize in creating custom,
                high-quality tattoos that tell your unique story. My journey began with a passion for art
                and evolved into a dedication to the craft of tattooing.
              </p>
              <p>
                I believe that every tattoo should be a collaborative process between artist and client.
                My goal is to take your ideas and transform them into exceptional artwork that you'll be
                proud to wear for a lifetime.
              </p>
              <p>
                My studio is built on the principles of cleanliness, professionalism, and artistic integrity.
                I'm committed to creating a comfortable, welcoming environment where clients feel at ease
                throughout their tattoo experience.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <h3 className="text-3xl font-bold">300+</h3>
                <p className="text-sm text-muted-foreground">Custom Designs</p>
              </div>
              <div className="text-center">
                <h3 className="text-3xl font-bold">5</h3>
                <p className="text-sm text-muted-foreground">Award Wins</p>
              </div>
              <div className="text-center">
                <h3 className="text-3xl font-bold">100%</h3>
                <p className="text-sm text-muted-foreground">Client Satisfaction</p>
              </div>
            </div>

            <Button asChild>
              <Link href="/about">Learn More About Me</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
