"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  image?: string;
  rating: number;
  text: string;
  date: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: "1",
    name: "Alex Johnson",
    image: "/testimonials/alex.jpg",
    rating: 5,
    text: "Absolutely incredible work! My sleeve tattoo exceeded all expectations. The attention to detail and the ability to bring my concept to life was amazing. Couldn't be happier with the result!",
    date: "March 15, 2024",
  },
  {
    id: "2",
    name: "Sarah Williams",
    image: "/testimonials/sarah.jpg",
    rating: 5,
    text: "I was nervous about getting my first tattoo, but the artist made me feel comfortable throughout the entire process. The studio was immaculately clean, and the final result is beautiful. Will definitely be back!",
    date: "February 28, 2024",
  },
  {
    id: "3",
    name: "Michael Chen",
    image: "/testimonials/michael.jpg",
    rating: 5,
    text: "The level of professionalism and artistic skill here is unmatched. My custom design was perfectly executed, and the healing process was smooth thanks to the excellent aftercare advice. Highly recommend!",
    date: "January 17, 2024",
  },
  {
    id: "4",
    name: "Emma Rodriguez",
    image: "/testimonials/emma.jpg",
    rating: 4,
    text: "A fantastic experience from consultation to completion. The artist really listened to what I wanted and offered valuable creative input to enhance my original idea. The shop is clean, welcoming, and the atmosphere is relaxed.",
    date: "December 5, 2023",
  },
  {
    id: "5",
    name: "David Thompson",
    image: "/testimonials/david.jpg",
    rating: 5,
    text: "This was my third tattoo here, and as always, the experience was excellent. The attention to detail and artistic vision continue to impress me. Already planning my next piece!",
    date: "November 20, 2023",
  },
  {
    id: "6",
    name: "Sample User",
    image: "/testimonials/sample.jpg",
    rating: 4,
    text: "This is a sample testimonial for testing purposes. The service was great and the tattoo turned out amazing!",
    date: "October 10, 2023",
  },
];

export default function TestimonialSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % TESTIMONIALS.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  // Number of testimonials to show at once based on screen size
  const itemsToShow = isMobile ? 1 : 2;

  // Create a circular array of testimonials, starting from currentIndex
  const visibleTestimonials = Array.from({ length: itemsToShow }, (_, i) =>
    TESTIMONIALS[(currentIndex + i) % TESTIMONIALS.length]
  );

  // Generate unique star keys for rating display
  const generateStarKey = (testimonialId: string, position: number) => {
    return `star-${testimonialId}-pos-${position}`;
  };

  // Generate unique indicator keys
  const generateIndicatorKey = (testimonialId: string) => {
    return `indicator-${testimonialId}`;
  };

  return (
    <div className="relative w-full py-4">
      {/* Navigation Buttons */}
      <div className="flex justify-between absolute top-1/2 -translate-y-1/2 left-0 right-0 z-10 px-4">
        <button
          onClick={prevTestimonial}
          className="bg-background/80 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-background transition-colors"
          aria-label="Previous testimonial"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button
          onClick={nextTestimonial}
          className="bg-background/80 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-background transition-colors"
          aria-label="Next testimonial"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>

      {/* Testimonials */}
      <div className="flex gap-6 items-stretch">
        {visibleTestimonials.map((testimonial) => (
          <Card key={testimonial.id} className="flex-1 border border-border/40 h-full">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-12 w-12 border-2 border-primary/10">
                  {testimonial.image ? (
                    <AvatarImage src={testimonial.image} alt={testimonial.name} />
                  ) : (
                    <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h4 className="font-semibold">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.date}</p>
                </div>
              </div>

              <div className="flex mb-3">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={generateStarKey(testimonial.id, i)}
                    className={`h-4 w-4 ${
                      i < testimonial.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>

              <p className="text-muted-foreground flex-grow">{testimonial.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center space-x-2 mt-6">
        {TESTIMONIALS.map((testimonial) => (
          <button
            key={generateIndicatorKey(testimonial.id)}
            onClick={() => setCurrentIndex(TESTIMONIALS.findIndex(t => t.id === testimonial.id))}
            className={`h-2 rounded-full transition-all ${
              TESTIMONIALS.findIndex(t => t.id === testimonial.id) === currentIndex
                ? "w-6 bg-primary"
                : "w-2 bg-primary/30"
            }`}
            aria-label={`Go to testimonial from ${testimonial.name}`}
          />
        ))}
      </div>
    </div>
  );
}
