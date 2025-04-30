import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { searchUsers, User } from '@/services/users';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const UserSearch = () => {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<string>('');
  const [preferredTime, setPreferredTime] = useState<string>('');

  const handleSearch = async () => {
    if (!isAuthenticated) {
      setError('Please log in to search users');
      return;
    }

    setLoading(true);
    setError('');
    setUsers([]);

    try {
      // Make the search request with optional query
      console.log('Searching with query:', searchQuery);
      const results = await searchUsers({
        query: searchQuery,
        experienceLevel,
        preferredTime
      });

      console.log('Search results:', results);
      if ('error' in results) {
        setError(results.error);
        setUsers([]);
      } else {
        setUsers(results);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to search for users';
      console.error('Search error:', err);
      setError(errorMessage);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
        <div className="flex gap-4">
          <Select value={experienceLevel} onValueChange={setExperienceLevel}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Experience Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any Experience Level</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>

          <Select value={preferredTime} onValueChange={setPreferredTime}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Preferred Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any Time</SelectItem>
              <SelectItem value="morning">Morning</SelectItem>
              <SelectItem value="afternoon">Afternoon</SelectItem>
              <SelectItem value="evening">Evening</SelectItem>
              <SelectItem value="weekend">Weekend</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}

      <div className="space-y-2">
        {users.map((user) => (
          <Card key={user._id}>
            <CardContent className="flex items-center gap-4 p-4">
              <Avatar>
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{user.name}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {users.length === 0 && searchQuery && !loading && (
          <p className="text-center text-gray-500">No users found</p>
        )}
      </div>
    </div>
  );
};
