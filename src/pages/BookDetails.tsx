import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase as sb } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { RatingStars } from '@/components/RatingStars';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, User, Edit, Trash2, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const supabase = sb as any;

interface Book {
  id: string;
  title: string;
  author: string;
  description: string | null;
  genre: string;
  published_year: number | null;
  cover_image: string | null;
  added_by: string;
  created_at: string;
}

interface Review {
  id: string;
  book_id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  profiles: {
    display_name: string | null;
  } | null;
}

const BookDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRating, setNewRating] = useState(0);
  const [newReviewText, setNewReviewText] = useState('');
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [editingReview, setEditingReview] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBookDetails();
      fetchReviews();
    }
  }, [id]);

  const fetchBookDetails = async () => {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      setBook(data);
    }
    setLoading(false);
  };

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('book_id', id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Fetch profile data separately
      const userIds = data.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const reviewsWithProfiles = data.map(review => ({
        ...review,
        profiles: profileMap.get(review.user_id) || null
      }));
      
      setReviews(reviewsWithProfiles as any);
      const myReview = reviewsWithProfiles.find(r => r.user_id === user?.id);
      if (myReview) {
        setUserReview(myReview as any);
        setNewRating(myReview.rating);
        setNewReviewText(myReview.review_text || '');
      }
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to leave a review",
        variant: "destructive"
      });
      return;
    }

    if (newRating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating",
        variant: "destructive"
      });
      return;
    }

    if (userReview) {
      // Update existing review
      const { error } = await supabase
        .from('reviews')
        .update({
          rating: newRating,
          review_text: newReviewText
        })
        .eq('id', userReview.id);

      if (!error) {
        toast({
          title: "Review updated",
          description: "Your review has been updated successfully"
        });
        setEditingReview(false);
        fetchReviews();
      }
    } else {
      // Create new review
      const { error } = await supabase
        .from('reviews')
        .insert({
          book_id: id,
          user_id: user.id,
          rating: newRating,
          review_text: newReviewText
        });

      if (!error) {
        toast({
          title: "Review submitted",
          description: "Thank you for your review!"
        });
        setNewRating(0);
        setNewReviewText('');
        fetchReviews();
      }
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (!error) {
      toast({
        title: "Review deleted",
        description: "Your review has been deleted"
      });
      setUserReview(null);
      setNewRating(0);
      setNewReviewText('');
      fetchReviews();
    }
  };

  const handleDeleteBook = async () => {
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id);

    if (!error) {
      toast({
        title: "Book deleted",
        description: "The book has been deleted successfully"
      });
      navigate('/');
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Book not found</h1>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === book.added_by;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Book Details */}
        <div className="grid md:grid-cols-[300px,1fr] gap-8 mb-12">
          <div className="space-y-4">
            <div className="aspect-[3/4] bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden shadow-book">
              {book.cover_image ? (
                <img 
                  src={book.cover_image} 
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-9xl font-bold text-muted-foreground/20">
                    {book.title.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {isOwner && (
              <div className="flex gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link to={`/edit-book/${book.id}`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="flex-1">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this book and all its reviews.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteBook}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>

          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-4xl font-bold mb-2">{book.title}</h1>
              <div className="flex items-center gap-2 text-lg text-muted-foreground mb-4">
                <User className="h-4 w-4" />
                <span>by {book.author}</span>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <RatingStars rating={averageRating} size="lg" />
                <span className="text-2xl font-semibold">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-muted-foreground">
                  ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                </span>
              </div>

              <div className="flex gap-2 mb-6">
                <Badge>{book.genre}</Badge>
                {book.published_year && (
                  <Badge variant="outline">
                    <Calendar className="h-3 w-3 mr-1" />
                    {book.published_year}
                  </Badge>
                )}
              </div>

              {book.description && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">Description</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {book.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Reviews Section */}
        <div className="max-w-4xl space-y-6">
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            Reviews
          </h2>

          {/* Add/Edit Review Form */}
          {user && (
            <Card className="shadow-book">
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-lg font-semibold">
                  {userReview && !editingReview ? 'Your Review' : userReview ? 'Edit Your Review' : 'Write a Review'}
                </h3>
                
                {(!userReview || editingReview) && (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Rating</label>
                      <RatingStars 
                        rating={newRating} 
                        size="lg" 
                        interactive 
                        onRatingChange={setNewRating}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Review (optional)</label>
                      <Textarea
                        placeholder="Share your thoughts about this book..."
                        value={newReviewText}
                        onChange={(e) => setNewReviewText(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleSubmitReview}>
                        {userReview ? 'Update Review' : 'Submit Review'}
                      </Button>
                      {userReview && editingReview && (
                        <Button variant="outline" onClick={() => setEditingReview(false)}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </>
                )}

                {userReview && !editingReview && (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <RatingStars rating={userReview.rating} size="md" />
                        {userReview.review_text && (
                          <p className="text-muted-foreground">{userReview.review_text}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setEditingReview(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete review?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete your review.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteReview(userReview.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* All Reviews */}
          <div className="space-y-4">
            {reviews
              .filter(review => review.user_id !== user?.id)
              .map((review) => (
                <Card key={review.id} className="shadow-book">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">
                          {review.profiles?.display_name || 'Anonymous'}
                        </p>
                        <RatingStars rating={review.rating} size="sm" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {review.review_text && (
                      <p className="text-muted-foreground mt-2">{review.review_text}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            
            {reviews.filter(r => r.user_id !== user?.id).length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No reviews yet. Be the first to review this book!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
