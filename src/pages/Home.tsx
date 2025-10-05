import { useState, useEffect, useMemo } from 'react';
import { supabase as sb } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { BookCard } from '@/components/BookCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ChevronLeft, ChevronRight, BookOpen, SlidersHorizontal, TrendingUp, Star } from 'lucide-react';

const supabase = sb as any;

interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  published_year: number | null;
  cover_image: string | null;
  description: string | null;
}

const ITEMS_PER_PAGE = 9;

const Home = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [bookRatings, setBookRatings] = useState<Record<string, { avg: number; count: number }>>({});

  // Stats calculation
  const stats = useMemo(() => {
    const totalBooks = books.length;
    const avgRating = Object.values(bookRatings).reduce((acc, r) => acc + r.avg, 0) / (Object.keys(bookRatings).length || 1);
    const totalReviews = Object.values(bookRatings).reduce((acc, r) => acc + r.count, 0);
    return { totalBooks, avgRating, totalReviews };
  }, [books, bookRatings]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchBooks();
    }, searchTerm ? 300 : 0);

    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, searchTerm, genreFilter, sortBy, ratingFilter, yearFilter]);

  const fetchBooks = async () => {
    setLoading(true);
    
    let query = supabase
      .from('books')
      .select('*', { count: 'exact' });

    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%`);
    }

    if (genreFilter !== 'all') {
      query = query.eq('genre', genreFilter as any);
    }

    if (yearFilter !== 'all') {
      const currentYear = new Date().getFullYear();
      if (yearFilter === 'recent') {
        query = query.gte('published_year', currentYear - 5);
      } else if (yearFilter === 'classic') {
        query = query.lt('published_year', 2000);
      }
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'title-asc':
        query = query.order('title', { ascending: true });
        break;
      case 'title-desc':
        query = query.order('title', { ascending: false });
        break;
      case 'year-desc':
        query = query.order('published_year', { ascending: false, nullsFirst: false });
        break;
      case 'year-asc':
        query = query.order('published_year', { ascending: true, nullsFirst: false });
        break;
    }

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error, count } = await query.range(from, to);

    if (!error && data) {
      setBooks(data);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
      
      // Fetch ratings for all books
      const bookIds = data.map(b => b.id);
      const { data: reviews } = await supabase
        .from('reviews')
        .select('book_id, rating')
        .in('book_id', bookIds);

      if (reviews) {
        const ratings: Record<string, { avg: number; count: number }> = {};
        reviews.forEach(review => {
          if (!ratings[review.book_id]) {
            ratings[review.book_id] = { avg: 0, count: 0 };
          }
          ratings[review.book_id].avg += review.rating;
          ratings[review.book_id].count += 1;
        });
        
        Object.keys(ratings).forEach(bookId => {
          ratings[bookId].avg = ratings[bookId].avg / ratings[bookId].count;
        });
        
        setBookRatings(ratings);
      }

      // Apply rating filter on client side
      if (ratingFilter !== 'all') {
        const minRating = parseInt(ratingFilter);
        const filteredData = data.filter(book => {
          const rating = bookRatings[book.id]?.avg || 0;
          return rating >= minRating;
        });
        setBooks(filteredData);
        setTotalPages(Math.ceil(filteredData.length / ITEMS_PER_PAGE));
      } else {
        setBooks(data);
        setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
      }
    }
    
    setLoading(false);
  };

  // Skeleton loader component
  const BookSkeleton = () => (
    <div className="space-y-3">
      <Skeleton className="aspect-[3/4] w-full" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary mb-4 animate-scale-in shadow-hover">
              <BookOpen className="h-10 w-10 text-primary-foreground" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
              Discover Your Next Great Read
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore thousands of books, read reviews, and share your thoughts with our community
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-6 pt-6">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border/50">
                <BookOpen className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="text-xs text-muted-foreground">Total Books</div>
                  <div className="text-lg font-bold">{stats.totalBooks}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border/50">
                <Star className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="text-xs text-muted-foreground">Avg Rating</div>
                  <div className="text-lg font-bold">{stats.avgRating.toFixed(1)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border/50">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="text-xs text-muted-foreground">Reviews</div>
                  <div className="text-lg font-bold">{stats.totalReviews}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="container mx-auto px-4 pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="Search by title or author..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 bg-card border-border focus:border-primary transition-colors"
              />
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="md:w-auto bg-card border-border"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {(genreFilter !== 'all' || ratingFilter !== 'all' || yearFilter !== 'all' || sortBy !== 'newest') && (
                <Badge className="ml-2 bg-primary text-primary-foreground">Active</Badge>
              )}
            </Button>
          </div>

          {/* Advanced Filters - Collapsible */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-card border border-border rounded-lg animate-fade-in">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Genre</label>
                <Select value={genreFilter} onValueChange={(v) => {
                  setGenreFilter(v);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="All Genres" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    <SelectItem value="all">All Genres</SelectItem>
                    <SelectItem value="Fiction">Fiction</SelectItem>
                    <SelectItem value="Non-Fiction">Non-Fiction</SelectItem>
                    <SelectItem value="Mystery">Mystery</SelectItem>
                    <SelectItem value="Science Fiction">Science Fiction</SelectItem>
                    <SelectItem value="Fantasy">Fantasy</SelectItem>
                    <SelectItem value="Romance">Romance</SelectItem>
                    <SelectItem value="Thriller">Thriller</SelectItem>
                    <SelectItem value="Biography">Biography</SelectItem>
                    <SelectItem value="History">History</SelectItem>
                    <SelectItem value="Self-Help">Self-Help</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Min Rating</label>
                <Select value={ratingFilter} onValueChange={(v) => {
                  setRatingFilter(v);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Any Rating" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    <SelectItem value="all">Any Rating</SelectItem>
                    <SelectItem value="4">⭐ 4+ Stars</SelectItem>
                    <SelectItem value="3">⭐ 3+ Stars</SelectItem>
                    <SelectItem value="2">⭐ 2+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Publication</label>
                <Select value={yearFilter} onValueChange={(v) => {
                  setYearFilter(v);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Any Year" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    <SelectItem value="all">Any Year</SelectItem>
                    <SelectItem value="recent">Recent (Last 5 years)</SelectItem>
                    <SelectItem value="classic">Classic (Before 2000)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Sort By</label>
                <Select value={sortBy} onValueChange={(v) => {
                  setSortBy(v);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Newest First" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                    <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                    <SelectItem value="year-desc">Year (Newest)</SelectItem>
                    <SelectItem value="year-asc">Year (Oldest)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Active Filters Display */}
        {(genreFilter !== 'all' || ratingFilter !== 'all' || yearFilter !== 'all') && (
          <div className="flex flex-wrap gap-2 mb-6 animate-fade-in">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {genreFilter !== 'all' && (
              <Badge variant="secondary" className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors" onClick={() => setGenreFilter('all')}>
                {genreFilter} ✕
              </Badge>
            )}
            {ratingFilter !== 'all' && (
              <Badge variant="secondary" className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors" onClick={() => setRatingFilter('all')}>
                {ratingFilter}+ ⭐ ✕
              </Badge>
            )}
            {yearFilter !== 'all' && (
              <Badge variant="secondary" className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors" onClick={() => setYearFilter('all')}>
                {yearFilter === 'recent' ? 'Recent' : 'Classic'} ✕
              </Badge>
            )}
          </div>
        )}

        <div className="text-sm text-muted-foreground mb-6">
          Showing {books.length} books
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <BookSkeleton key={i} />
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-xl text-muted-foreground mb-2">No books found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or search term</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {books.map((book, index) => (
                <div 
                  key={book.id} 
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <BookCard
                    id={book.id}
                    title={book.title}
                    author={book.author}
                    genre={book.genre}
                    publishedYear={book.published_year || undefined}
                    coverImage={book.cover_image || undefined}
                    averageRating={bookRatings[book.id]?.avg || 0}
                    reviewCount={bookRatings[book.id]?.count || 0}
                    description={book.description || undefined}
                  />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
