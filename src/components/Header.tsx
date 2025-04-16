import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function Header() {
  const auth = useAuth();
  const user = auth?.user;

  // Get initials from username
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex gap-6 md:gap-10">
          <Link to="/" className="flex items-center space-x-2">
            <span className="inline-block font-bold">runher</span>
          </Link>
          {auth?.isAuthenticated && (
            <nav className="hidden md:flex gap-6">
              <Link to="/running-dashboard" className="text-sm font-medium hover:text-primary">
                Running Dashboard
              </Link>
              <Link to="/log-run" className="text-sm font-medium hover:text-primary">
                Log Run
              </Link>
              <Link to="/routes" className="text-sm font-medium hover:text-primary">
                Routes
              </Link>
              <Link to="/buddies" className="text-sm font-medium hover:text-primary">
                Find Buddies
              </Link>
              <Link to="/find-runners" className="text-sm font-medium hover:text-primary">
                Find Runners
              </Link>
            </nav>
          )}
        </div>
        
        <nav className="flex items-center space-x-4">
          {auth?.isAuthenticated ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{user?.username ? getInitials(user.username) : '?'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/running-dashboard">Running Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/log-run">Log Run</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => auth.logout()}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild variant="default">
              <Link to="/login">Sign In</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
