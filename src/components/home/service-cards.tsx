import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const services = [
  {
    id: "custom-tattoos",
    title: "Custom Tattoos",
    description: "Bring your unique vision to life with a completely custom design created specifically for you.",
    features: [
      "Personal consultation",
      "Custom artwork design",
      "Unlimited revisions",
      "High-quality execution",
    ],
    link: "/services/custom-tattoos",
  },
  {
    id: "cover-ups",
    title: "Tattoo Cover-ups",
    description: "Transform an existing tattoo into something new and beautiful that you'll love.",
    features: [
      "Assessment consultation",
      "Custom cover design",
      "Expert technique",
      "Seamless integration",
    ],
    link: "/services/cover-ups",
  },
  {
    id: "touch-ups",
    title: "Touch-ups & Restoration",
    description: "Breathe new life into faded or aging tattoos with professional restoration services.",
    features: [
      "Color refreshing",
      "Line work enhancement",
      "Detail restoration",
      "Modern techniques",
    ],
    link: "/services/touch-ups",
  },
];

export default function ServiceCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service) => (
        <Card key={service.id} className="flex flex-col h-full border border-border/40 hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle>{service.title}</CardTitle>
            <CardDescription>{service.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-2">
              {service.features.map((feature, i) => (
                <li key={`${service.id}-feature-${i}`} className="flex items-baseline gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0 mt-1" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full group" asChild>
              <Link href={service.link}>
                <span>Learn More</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
