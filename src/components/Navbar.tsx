import { Link, useLocation } from 'react-router-dom';
import { BookOpen, User, LogOut, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center group-hover:scale-105 transition-transform">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-foreground">
              BookHaven
            </h1>
            <p className="text-xs text-muted-foreground">Discover & Review</p>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/">
            <Button 
              variant="ghost"
              className={isActive('/') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>

          {user ? (
            <>
              <Link to="/add-book">
                <Button 
                  variant="ghost"
                  className={isActive('/add-book') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Book
                </Button>
              </Link>

              <Link to="/profile">
                <Button 
                  variant="ghost"
                  className={isActive('/profile') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}
                >
                  <User className="h-4 w-4 mr-2" />
                  My Profile
                </Button>
              </Link>

              <div className="flex items-center gap-2 ml-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-foreground">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={signOut}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
