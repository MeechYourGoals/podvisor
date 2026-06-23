import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star } from 'lucide-react';

export const TestimonialsSection = () => {
  return (
    <section className="py-12 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-6xl font-display font-bold mb-3">
            How Professionals Use Podvisor
          </h2>
          <p className="text-2xl text-muted-foreground">
            Real insights from real users
          </p>
        </div>

        <Card className="border-2">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
                    MR
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="space-y-4 flex-1">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-3xl leading-relaxed">
                  "As a CEO juggling a newborn and my boxing hobby, I analyze business podcasts, 
                  parenting expert videos, and training tutorials - all through my three different 
                  contexts. It's like having three different advisors in one tool. Absolute game 
                  changer for time management."
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <p className="font-semibold text-2xl">Maya Rodriguez</p>
                  <span className="text-muted-foreground">•</span>
                  <p className="text-xl text-muted-foreground">CEO & New Mom</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
