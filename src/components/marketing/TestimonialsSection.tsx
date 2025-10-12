import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Product Manager',
    initials: 'SC',
    quote: "Podvisor helps me extract tactical lessons from PM podcasts in minutes. I've built a personal library of insights from top PMs at Meta, Google, and Stripe.",
    tag: 'Startup Founder',
    rating: 5
  },
  {
    name: 'Marcus Rodriguez',
    role: 'Sales Coach',
    initials: 'MR',
    quote: "I analyze sales training videos and get personalized tactics for my coaching style. It's like having a mentor in my pocket.",
    tag: 'Sales Leader',
    rating: 5
  },
  {
    name: 'Dr. Emily Watson',
    role: 'Researcher',
    initials: 'EW',
    quote: "As a researcher, I need to stay on top of academic lectures and conference talks. Podvisor turns 2-hour videos into 10 actionable takeaways.",
    tag: 'Academic',
    rating: 5
  }
];

export const TestimonialsSection = () => {
  return (
    <section className="py-16 sm:py-24 border-t border-border">
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Trusted by Professionals Worldwide
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands learning smarter with AI
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="border-2">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {testimonial.tag}
                  </Badge>
                </div>

                <div className="flex gap-0.5">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  "{testimonial.quote}"
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};