-- Force type regeneration by adding helpful comments
COMMENT ON TABLE public.books IS 'Stores book information including title, author, genre, and publication details';
COMMENT ON TABLE public.reviews IS 'Stores user reviews and ratings for books';
COMMENT ON TABLE public.profiles IS 'Stores additional user profile information';