import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Send, User as UserIcon } from 'lucide-react';

export default function CreateSwapRequest() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { users, createSwapRequest } = useData();
  const { user: currentUser } = useAuth();
  
  const [formData, setFormData] = useState({
    skillOffered: '',
    skillWanted: '',
    message: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const targetUser = users.find(u => u.id === userId);

  if (!targetUser || !currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">User not found</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await createSwapRequest({
        requesterId: currentUser.id,
        receiverId: targetUser.id,
        skillOffered: formData.skillOffered,
        skillWanted: formData.skillWanted,
        message: formData.message,
      });
      
      navigate('/requests', { 
        state: { message: `Swap request sent to ${targetUser.name}!` }
      });
    } catch (error) {
      console.error('Failed to create swap request:', error);
      alert('Failed to create swap request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Link
        to={`/user/${targetUser.id}`}
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors duration-200"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Profile
      </Link>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
          <h1 className="text-2xl font-bold text-white">Create Skill Swap Request</h1>
          <p className="text-blue-100 mt-2">
            Send a request to swap skills with {targetUser.name}
          </p>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {targetUser.profilePhoto ? (
              <img
                src={targetUser.profilePhoto}
                alt={targetUser.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-white" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900">{targetUser.name}</h2>
              <p className="text-gray-600">{targetUser.email}</p>
              {targetUser.location && (
                <p className="text-gray-500 text-sm">{targetUser.location}</p>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Skill You Offer */}
          <div>
            <label htmlFor="skillOffered" className="block text-sm font-medium text-gray-700 mb-2">
              Skill You Want to Offer *
            </label>
            <select
              id="skillOffered"
              required
              value={formData.skillOffered}
              onChange={(e) => setFormData(prev => ({ ...prev, skillOffered: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            >
              <option value="">Select a skill you can offer</option>
              {currentUser.skillsOffered.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
            {currentUser.skillsOffered.length === 0 && (
              <p className="text-sm text-red-600 mt-1">
                You need to add skills to your profile first.{' '}
                <Link to="/profile" className="underline">
                  Update your profile
                </Link>
              </p>
            )}
          </div>

          {/* Skill You Want */}
          <div>
            <label htmlFor="skillWanted" className="block text-sm font-medium text-gray-700 mb-2">
              Skill You Want to Learn *
            </label>
            <select
              id="skillWanted"
              required
              value={formData.skillWanted}
              onChange={(e) => setFormData(prev => ({ ...prev, skillWanted: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
            >
              <option value="">Select a skill you want to learn</option>
              {targetUser.skillsOffered.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              placeholder={`Hi ${targetUser.name},\n\nI'd love to learn ${formData.skillWanted || '[skill]'} from you, and I can teach you ${formData.skillOffered || '[your skill]'} in return.\n\nLet me know if you're interested!\n\nBest regards,\n${currentUser.name}`}
            />
          </div>

          {/* Skills Summary */}
          {formData.skillOffered && formData.skillWanted && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-2">Swap Summary</h3>
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
                <div className="text-center">
                  <p className="text-sm text-gray-600">You teach</p>
                  <p className="font-medium text-blue-600">{formData.skillOffered}</p>
                </div>
                <div className="text-gray-400">⇄</div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">You learn</p>
                  <p className="font-medium text-purple-600">{formData.skillWanted}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || currentUser.skillsOffered.length === 0}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Send className="w-5 h-5" />
            <span>{isLoading ? 'Sending Request...' : 'Send Swap Request'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}