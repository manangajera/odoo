import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User as UserIcon, 
  Mail, 
  MapPin, 
  Edit2, 
  Save, 
  X, 
  Plus,
  Eye,
  EyeOff,
  Star
} from 'lucide-react';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    location: user?.location || '',
    bio: user?.bio || '',
    skillsOffered: user?.skillsOffered || [],
    skillsWanted: user?.skillsWanted || [],
    availability: user?.availability || [],
    isPublic: user?.isPublic ?? true,
  });
  const [currentSkillOffered, setCurrentSkillOffered] = useState('');
  const [currentSkillWanted, setCurrentSkillWanted] = useState('');

  const availabilityOptions = ['Weekdays', 'Weekends', 'Evenings', 'Mornings'];

  const handleSave = () => {
    updateProfile(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      location: user?.location || '',
      bio: user?.bio || '',
      skillsOffered: user?.skillsOffered || [],
      skillsWanted: user?.skillsWanted || [],
      availability: user?.availability || [],
      isPublic: user?.isPublic ?? true,
    });
    setIsEditing(false);
  };

  const addSkillOffered = () => {
    if (currentSkillOffered.trim() && !formData.skillsOffered.includes(currentSkillOffered.trim())) {
      setFormData(prev => ({
        ...prev,
        skillsOffered: [...prev.skillsOffered, currentSkillOffered.trim()]
      }));
      setCurrentSkillOffered('');
    }
  };

  const addSkillWanted = () => {
    if (currentSkillWanted.trim() && !formData.skillsWanted.includes(currentSkillWanted.trim())) {
      setFormData(prev => ({
        ...prev,
        skillsWanted: [...prev.skillsWanted, currentSkillWanted.trim()]
      }));
      setCurrentSkillWanted('');
    }
  };

  const removeSkillOffered = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skillsOffered: prev.skillsOffered.filter(s => s !== skill)
    }));
  };

  const removeSkillWanted = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skillsWanted: prev.skillsWanted.filter(s => s !== skill)
    }));
  };

  const toggleAvailability = (option: string) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.includes(option)
        ? prev.availability.filter(a => a !== option)
        : [...prev.availability, option]
    }));
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            
            <div className="text-center sm:text-left text-white">
              <h1 className="text-3xl font-bold">{user.name}</h1>
              <div className="flex items-center justify-center sm:justify-start space-x-4 mt-2">
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

            <div className="ml-auto">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-lg hover:bg-white/30 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center space-x-1"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center space-x-1"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Profile Visibility */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center space-x-3">
              {formData.isPublic ? (
                <Eye className="w-5 h-5 text-green-600" />
              ) : (
                <EyeOff className="w-5 h-5 text-gray-600" />
              )}
              <div>
                <h3 className="font-semibold text-gray-900">Profile Visibility</h3>
                <p className="text-sm text-gray-600">
                  {formData.isPublic ? 'Your profile is public and visible to others' : 'Your profile is private'}
                </p>
              </div>
            </div>
            {isEditing && (
              <button
                onClick={() => setFormData(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  formData.isPublic
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {formData.isPublic ? 'Public' : 'Private'}
              </button>
            )}
          </div>

          {/* Basic Info */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="py-3 text-gray-900">{user.name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="City, State"
                  />
                ) : (
                  <p className="py-3 text-gray-900">{user.location || 'Not specified'}</p>
                )}
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tell others about yourself and your expertise..."
                />
              ) : (
                <p className="py-3 text-gray-900">{user.bio || 'No bio provided'}</p>
              )}
            </div>
          </div>

          {/* Skills Offered */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Skills I Offer</h2>
            {isEditing ? (
              <div>
                <div className="flex space-x-2 mb-4">
                  <input
                    type="text"
                    value={currentSkillOffered}
                    onChange={(e) => setCurrentSkillOffered(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillOffered())}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add a skill you can offer"
                  />
                  <button
                    type="button"
                    onClick={addSkillOffered}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skillsOffered.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-2 rounded-full"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkillOffered(skill)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user.skillsOffered.map((skill) => (
                  <span
                    key={skill}
                    className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-medium"
                  >
                    {skill}
                  </span>
                ))}
                {user.skillsOffered.length === 0 && (
                  <p className="text-gray-500">No skills added yet</p>
                )}
              </div>
            )}
          </div>

          {/* Skills Wanted */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Skills I Want to Learn</h2>
            {isEditing ? (
              <div>
                <div className="flex space-x-2 mb-4">
                  <input
                    type="text"
                    value={currentSkillWanted}
                    onChange={(e) => setCurrentSkillWanted(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillWanted())}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Add a skill you want to learn"
                  />
                  <button
                    type="button"
                    onClick={addSkillWanted}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skillsWanted.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center space-x-1 bg-purple-100 text-purple-800 px-3 py-2 rounded-full"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkillWanted(skill)}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user.skillsWanted.map((skill) => (
                  <span
                    key={skill}
                    className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-medium"
                  >
                    {skill}
                  </span>
                ))}
                {user.skillsWanted.length === 0 && (
                  <p className="text-gray-500">No skills specified</p>
                )}
              </div>
            )}
          </div>

          {/* Availability */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Availability</h2>
            {isEditing ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {availabilityOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleAvailability(option)}
                    className={`px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                      formData.availability.includes(option)
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user.availability.map((time) => (
                  <span
                    key={time}
                    className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium"
                  >
                    {time}
                  </span>
                ))}
                {user.availability.length === 0 && (
                  <p className="text-gray-500">No availability specified</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}