import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Search, MapPin, Star, Clock, MessageSquare, Filter } from 'lucide-react';

export default function Home() {
  const { searchUsers } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');

  const users = searchUsers(searchTerm).filter(u => u.id !== user?.id && u.isPublic && !u.isBanned);
  
  const filteredUsers = availabilityFilter 
    ? users.filter(u => u.availability.includes(availabilityFilter))
    : users;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Discover Amazing Skills
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Connect with talented individuals and exchange skills to grow together
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by skill (e.g., Photoshop, React, Marketing)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
            >
              <option value="">All Availability</option>
              <option value="Weekdays">Weekdays</option>
              <option value="Weekends">Weekends</option>
              <option value="Evenings">Evenings</option>
              <option value="Mornings">Mornings</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((profile) => (
          <div key={profile.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              {/* Profile Header */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="relative">
                  {profile.profilePhoto ? (
                    <img
                      src={profile.profilePhoto}
                      alt={profile.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {profile.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{profile.name}</h3>
                  {profile.location && (
                    <div className="flex items-center text-gray-500 text-sm mt-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      {profile.location}
                    </div>
                  )}
                  <div className="flex items-center mt-1">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="text-sm font-medium text-gray-700">{profile.rating}</span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{profile.bio}</p>
              )}

              {/* Skills Offered */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Skills Offered</h4>
                <div className="flex flex-wrap gap-1">
                  {profile.skillsOffered.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                  {profile.skillsOffered.length > 3 && (
                    <span className="text-xs text-gray-500 px-2 py-1">
                      +{profile.skillsOffered.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Skills Wanted */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Looking to Learn</h4>
                <div className="flex flex-wrap gap-1">
                  {profile.skillsWanted.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                  {profile.skillsWanted.length > 3 && (
                    <span className="text-xs text-gray-500 px-2 py-1">
                      +{profile.skillsWanted.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Availability */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Availability</h4>
                <div className="flex items-center text-gray-600 text-sm">
                  <Clock className="w-4 h-4 mr-1" />
                  {profile.availability.join(', ') || 'Not specified'}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <Link
                  to={`/user/${profile.id}`}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg text-sm font-medium text-center hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                >
                  View Profile
                </Link>
                <Link
                  to={`/create-request/${profile.id}`}
                  className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center"
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Request
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {searchTerm 
              ? `No users found with skills matching "${searchTerm}". Try a different search term.`
              : 'No users available at the moment. Check back later!'
            }
          </p>
        </div>
      )}
    </div>
  );
}