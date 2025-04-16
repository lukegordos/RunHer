import React, { useEffect, useState } from 'react';
import runsService, { RunnerProfile, Run, RunStats } from '../services/runs';

const RunningDashboard: React.FC = () => {
  const [profile, setProfile] = useState<RunnerProfile | null>(null);
  const [recentRuns, setRecentRuns] = useState<Run[]>([]);
  const [stats, setStats] = useState<RunStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileRes, runsRes, statsRes] = await Promise.all([
          runsService.getProfile(),
          runsService.getRuns(5), // Get 5 most recent runs
          runsService.getStats()
        ]);

        setProfile(profileRes.data);
        setRecentRuns(runsRes.data);
        setStats(statsRes.data);
      } catch (err) {
        setError('Failed to load running data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Runs</h3>
          <p className="text-2xl font-bold">{stats?.totalRuns || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Miles</h3>
          <p className="text-2xl font-bold">{stats?.totalDistance?.toFixed(1) || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Avg Pace</h3>
          <p className="text-2xl font-bold">
            {stats?.averagePace ? `${Math.floor(stats.averagePace)}:${((stats.averagePace % 1) * 60).toFixed(0).padStart(2, '0')}` : '0:00'}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Weekly Miles</h3>
          <p className="text-2xl font-bold">{profile?.weeklyMileage || 0}</p>
        </div>
      </div>

      {/* Recent Runs */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Recent Runs</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Distance</th>
                <th className="px-4 py-2">Duration</th>
                <th className="px-4 py-2">Pace</th>
                <th className="px-4 py-2">Type</th>
              </tr>
            </thead>
            <tbody>
              {recentRuns.map((run, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2">{new Date(run.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{run.distance.value} {run.distance.unit}</td>
                  <td className="px-4 py-2">
                    {Math.floor(run.duration / 3600)}:
                    {Math.floor((run.duration % 3600) / 60).toString().padStart(2, '0')}:
                    {(run.duration % 60).toString().padStart(2, '0')}
                  </td>
                  <td className="px-4 py-2">
                    {Math.floor(run.pace)}:
                    {((run.pace % 1) * 60).toFixed(0).padStart(2, '0')} /mi
                  </td>
                  <td className="px-4 py-2 capitalize">{run.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Personal Bests */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Personal Bests</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(profile?.personalBests || {}).map(([distance, time]) => (
            <div key={distance} className="text-center">
              <h3 className="font-semibold text-gray-700 capitalize">
                {distance.replace(/([A-Z])/g, ' $1').trim()}
              </h3>
              <p className="text-xl">
                {time ? `${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, '0')}` : '--:--'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Goals */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Running Goals</h2>
        <ul className="list-disc pl-5">
          {profile?.goals.map((goal, index) => (
            <li key={index} className="mb-2">{goal}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RunningDashboard;
