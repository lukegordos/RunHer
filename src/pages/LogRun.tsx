import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import runsService, { Run } from '../services/runs';

const LogRun: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Run>>({
    distance: { value: 0, unit: 'miles' },
    duration: 0,
    type: 'solo',
    date: new Date(),
    feelingRating: 3
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await runsService.logRun(formData as Omit<Run, 'pace'>);
      navigate('/running-dashboard');
    } catch (error) {
      console.error('Failed to log run:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'distance.value') {
      setFormData(prev => ({
        ...prev,
        distance: { ...prev.distance!, value: parseFloat(value) }
      }));
    } else if (name === 'distance.unit') {
      setFormData(prev => ({
        ...prev,
        distance: { ...prev.distance!, unit: value as 'miles' | 'kilometers' }
      }));
    } else if (name === 'duration') {
      // Convert HH:MM:SS to seconds
      const [hours = 0, minutes = 0, seconds = 0] = value.split(':').map(Number);
      setFormData(prev => ({
        ...prev,
        duration: hours * 3600 + minutes * 60 + seconds
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Log a Run</h1>
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white rounded-lg shadow p-6">
        {/* Distance */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Distance
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              name="distance.value"
              value={formData.distance?.value}
              onChange={handleInputChange}
              step="0.1"
              min="0"
              className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline flex-1"
              required
            />
            <select
              name="distance.unit"
              value={formData.distance?.unit}
              onChange={handleInputChange}
              className="shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="miles">Miles</option>
              <option value="kilometers">Kilometers</option>
            </select>
          </div>
        </div>

        {/* Duration */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Duration (HH:MM:SS)
          </label>
          <input
            type="text"
            name="duration"
            value={formatDuration(formData.duration || 0)}
            onChange={handleInputChange}
            pattern="\\d{2}:\\d{2}:\\d{2}"
            placeholder="00:00:00"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        {/* Run Type */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Run Type
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="solo">Solo Run</option>
            <option value="group">Group Run</option>
            <option value="race">Race</option>
            <option value="training">Training</option>
          </select>
        </div>

        {/* Feeling Rating */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            How did you feel? (1-5)
          </label>
          <input
            type="range"
            name="feelingRating"
            min="1"
            max="5"
            value={formData.feelingRating}
            onChange={handleInputChange}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-600">
            <span>😫</span>
            <span>😕</span>
            <span>😐</span>
            <span>🙂</span>
            <span>😄</span>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes || ''}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows={3}
          />
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Log Run'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/running-dashboard')}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default LogRun;
