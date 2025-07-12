import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { 
  User as UserIcon, 
  Mail, 
  MapPin, 
  Star, 
  Clock, 
  MessageSquare,
  ArrowLeft
} from 'lucide-react';

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const { users } = useData();
  const { user: currentUser } = useAuth();
  
  const user = users.find(u => u.id === id);
  
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">User not found</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Link
        to="/"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors duration-200"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Browse
      </Link>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="relative">
              {user.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt={user.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                  <UserIcon className="w-16 h-16 text-white" />
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white"></div>
            </div>
            
            <div className="text-center sm:text-left text-white flex-1">
              <h1 className="text-3xl font-bold">{user.name}</h1>
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-2">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  <span>{user.email}</span>
                </div>
                {user.location && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{user.location}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center sm:justify-start mt-2">
                <Star className="w-5 h-5 text-yellow-400 mr-1" />
                <span className="font-semibold">{user.rating}</span>
                <span className="ml-1">Rating</span>
              </div>
            </div>

            {/* Action Button */}
            {currentUser?.id !== user.id && (
              <Link
                to={`/create-request/${user.id}`}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2 shadow-lg"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Request Skill Swap</span>
              </Link>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Bio */}
          {user.bio && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
              <p className="text-gray-700 leading-relaxed">{user.bio}</p>
            </div>
          )}

          {/* Skills Offered */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Skills Offered</h2>
            <div className="flex flex-wrap gap-3">
              {user.skillsOffered.map((skill) => (
                <span
                  key={skill}
                  className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-medium text-sm"
                >
                  {skill}
                </span>
              ))}
              {user.skillsOffered.length === 0 && (
                <p className="text-gray-500">No skills listed</p>
              )}
            </div>
          </div>

          {/* Skills Wanted */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Looking to Learn</h2>
            <div className="flex flex-wrap gap-3">
              {user.skillsWanted.map((skill) => (
                <span
                  key={skill}
                  className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-medium text-sm"
                >
                  {skill}
                </span>
              ))}
              {user.skillsWanted.length === 0 && (
                <p className="text-gray-500">No learning preferences specified</p>
              )}
            </div>
          </div>

          {/* Availability */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Availability</h2>
            <div className="flex items-center space-x-4">
              <Clock className="w-5 h-5 text-gray-500" />
              <div className="flex flex-wrap gap-2">
                {user.availability.map((time) => (
                  <span
                    key={time}
                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {time}
                  </span>
                ))}
                {user.availability.length === 0 && (
                  <span className="text-gray-500">No availability specified</span>
                )}
              </div>
            </div>
          </div>

          {/* Call to Action */}
          {currentUser?.id !== user.id && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Interested in a skill swap?
              </h3>
              <p className="text-gray-600 mb-4">
                Send {user.name} a swap request to start learning together!
              </p>
              <Link
                to={`/create-request/${user.id}`}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 inline-flex items-center space-x-2"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Send Request</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}