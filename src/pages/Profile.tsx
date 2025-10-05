import { useState, useEffect } from 'react';
import { supabase as sb } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { BookCard } from '@/components/BookCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { User, BookOpen, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const supabase = sb as any;

interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  published_year: number | null;
  cover_image: string | null;
}

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  book: {
    id: string;
    title: string;
    author: string;
  } | null;
}

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookRatings, setBookRatings] = useState<Record<string, { avg: number; count: number }>>({});
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchMyBooks();
      fetchMyReviews();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', user!.id)
      .single();

    if (data) {
      setDisplayName(data.display_name || '');
    }
  };

  const fetchMyBooks = async () => {
    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('added_by', user!.id)
      .order('created_at', { ascending: false });

    if (data) {
      setMyBooks(data);
      
      // Fetch ratings
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
    }
    setLoading(false);
  };

  const fetchMyReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('id, rating, review_text, created_at, book_id')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (data) {
      // Fetch book details
      const bookIds = data.map(r => r.book_id);
      const { data: books } = await supabase
        .from('books')
        .select('id, title, author')
        .in('id', bookIds);
      
      const bookMap = new Map(books?.map(b => [b.id, b]) || []);
      
      const reviewsWithBooks = data.map(review => ({
        ...review,
        book: bookMap.get(review.book_id) || null
      }));
      
      setMyReviews(reviewsWithBooks as any);
    }
  };

  const handleUpdateProfile = async () => {
    setUpdating(true);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('user_id', user!.id);

    if (!error) {
      toast({
        title: "Profile updated",
        description: "Your display name has been updated successfully"
      });
    }
    setUpdating(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              <User className="h-12 w-12 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">My Profile</h1>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <Card className="shadow-book">
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                />
              </div>
              <Button onClick={handleUpdateProfile} disabled={updating}>
                {updating ? 'Updating...' : 'Update Profile'}
              </Button>
            </CardContent>
          </Card>

          <Tabs defaultValue="books" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="books" className="gap-2">
                <BookOpen className="h-4 w-4" />
                My Books ({myBooks.length})
              </TabsTrigger>
              <TabsTrigger value="reviews" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                My Reviews ({myReviews.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="books" className="mt-6">
              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : myBooks.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-xl text-muted-foreground">You haven't added any books yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myBooks.map((book) => (
                    <BookCard
                      key={book.id}
                      id={book.id}
                      title={book.title}
                      author={book.author}
                      genre={book.genre}
                      publishedYear={book.published_year || undefined}
                      coverImage={book.cover_image || undefined}
                      averageRating={bookRatings[book.id]?.avg || 0}
                      reviewCount={bookRatings[book.id]?.count || 0}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-6">
              {myReviews.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-xl text-muted-foreground">You haven't written any reviews yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myReviews.map((review) => (
                    <Card key={review.id} className="shadow-book">
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg">
                            {review.book?.title || 'Unknown Book'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            by {review.book?.author || 'Unknown Author'}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-accent font-semibold">{review.rating}/5</span>
                            <span className="text-sm text-muted-foreground">
                              • {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {review.review_text && (
                            <p className="text-muted-foreground mt-2">{review.review_text}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;
