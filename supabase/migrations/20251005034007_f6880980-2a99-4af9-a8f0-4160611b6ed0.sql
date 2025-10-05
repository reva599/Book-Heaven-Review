-- Remove foreign key constraint on added_by to allow sample data
ALTER TABLE public.books DROP CONSTRAINT IF EXISTS books_added_by_fkey;

-- Insert sample books
INSERT INTO public.books (title, author, genre, published_year, description, added_by) VALUES
('The Great Gatsby', 'F. Scott Fitzgerald', 'Fiction', 1925, 'A classic American novel set in the Jazz Age, exploring themes of wealth, love, and the American Dream.', '00000000-0000-0000-0000-000000000001'),
('To Kill a Mockingbird', 'Harper Lee', 'Fiction', 1960, 'A gripping tale of racial injustice and childhood innocence in the American South.', '00000000-0000-0000-0000-000000000001'),
('1984', 'George Orwell', 'Science Fiction', 1949, 'A dystopian masterpiece about totalitarianism, surveillance, and the power of truth.', '00000000-0000-0000-0000-000000000001'),
('The Hobbit', 'J.R.R. Tolkien', 'Fantasy', 1937, 'An epic adventure of Bilbo Baggins and his unexpected journey to reclaim a treasure guarded by a dragon.', '00000000-0000-0000-0000-000000000001'),
('Pride and Prejudice', 'Jane Austen', 'Romance', 1813, 'A timeless romance exploring themes of love, class, and social expectations in Georgian England.', '00000000-0000-0000-0000-000000000001'),
('The Da Vinci Code', 'Dan Brown', 'Mystery', 2003, 'A thrilling mystery involving secret societies, religious history, and a desperate race across Europe.', '00000000-0000-0000-0000-000000000001'),
('Sapiens', 'Yuval Noah Harari', 'Non-Fiction', 2011, 'A brief history of humankind, exploring how Homo sapiens came to dominate the world.', '00000000-0000-0000-0000-000000000001'),
('The Girl with the Dragon Tattoo', 'Stieg Larsson', 'Thriller', 2005, 'A gripping thriller about a journalist and a hacker investigating a decades-old disappearance.', '00000000-0000-0000-0000-000000000001'),
('Steve Jobs', 'Walter Isaacson', 'Biography', 2011, 'The authorized biography of the Apple co-founder, revealing his innovative genius and complex personality.', '00000000-0000-0000-0000-000000000001'),
('A Brief History of Time', 'Stephen Hawking', 'Non-Fiction', 1988, 'A landmark volume in science writing exploring the nature of time, space, and the universe.', '00000000-0000-0000-0000-000000000001'),
('The Alchemist', 'Paulo Coelho', 'Fiction', 1988, 'A philosophical novel about a shepherd boy on a journey to find his personal legend and discover his destiny.', '00000000-0000-0000-0000-000000000001'),
('Atomic Habits', 'James Clear', 'Self-Help', 2018, 'A practical guide to building good habits and breaking bad ones through small, incremental changes.', '00000000-0000-0000-0000-000000000001');