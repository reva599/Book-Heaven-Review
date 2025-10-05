import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RatingStars } from './RatingStars';
import { Calendar, User } from 'lucide-react';

interface BookCardProps {
  id: string;
  title: string;
  author: string;
  genre: string;
  publishedYear?: number;
  coverImage?: string;
  averageRating: number;
  reviewCount: number;
  description?: string;
}

export const BookCard = ({
  id,
  title,
  author,
  genre,
  publishedYear,
  coverImage,
  averageRating,
  reviewCount,
  description
}: BookCardProps) => {
  return (
    <Link to={`/book/${id}`}>
      <Card className="h-full hover:shadow-hover transition-all duration-300 hover:-translate-y-1 overflow-hidden group cursor-pointer bg-card border-border/50">
        <CardHeader className="p-0 relative">
          <Badge className="absolute top-3 right-3 z-10 bg-primary/90 text-primary-foreground border-0">
            {genre}
          </Badge>
          <div className="aspect-[3/4] bg-gradient-to-br from-secondary to-muted overflow-hidden">
            {coverImage ? (
              <img 
                src={coverImage} 
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-8xl font-bold bg-gradient-to-br from-primary to-purple-500 bg-clip-text text-transparent">
                  {title.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            <span className="line-clamp-1">{author}</span>
          </div>

          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <RatingStars rating={averageRating} size="sm" />
            <span className="text-sm font-medium text-foreground">
              {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
            </span>
            <span className="text-sm text-muted-foreground">
              ({reviewCount})
            </span>
          </div>
          {publishedYear && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {publishedYear}
            </div>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
};
