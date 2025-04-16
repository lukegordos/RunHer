import React from 'react';
import { UserSearch } from '@/components/UserSearch';

const FindRunners = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Find Runners</h1>
      <UserSearch />
    </div>
  );
};

export default FindRunners;
