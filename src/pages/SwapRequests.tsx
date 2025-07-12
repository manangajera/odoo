import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { 
  Clock, 
  Check, 
  X, 
  Star, 
  MessageSquare, 
  User as UserIcon,
  Trash2,
  Award
} from 'lucide-react';

export default function SwapRequests() {
  const { swapRequests, updateSwapRequest, deleteSwapRequest, users } = useData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [ratingData, setRatingData] = useState<{ [key: string]: { rating: number; feedback: string } }>({});

  if (!user) return null;

  const receivedRequests = swapRequests.filter(req => req.receiverId === user.id);
  const sentRequests = swapRequests.filter(req => req.requesterId === user.id);

  const getUserById = (id: string) => users.find(u => u.id === id);

  const handleAccept = (requestId: string) => {
    updateSwapRequest(requestId, { status: 'accepted' }).catch(error => {
      console.error('Error accepting request:', error);
      alert('Failed to accept request. Please try again.');
    });
  };

  const handleReject = (requestId: string) => {
    updateSwapRequest(requestId, { status: 'rejected' }).catch(error => {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request. Please try again.');
    });
  };

  const handleDelete = (requestId: string) => {
    deleteSwapRequest(requestId).catch(error => {
      console.error('Error deleting request:', error);
      alert('Failed to delete request. Please try again.');
    });
  };

  const handleComplete = (requestId: string) => {
    const data = ratingData[requestId];
    updateSwapRequest(requestId, { 
      status: 'completed',
      rating: data?.rating || 5,
      feedback: data?.feedback || ''
    }).catch(error => {
      console.error('Error completing request:', error);
      alert('Failed to complete request. Please try again.');
    });
    setRatingData(prev => ({ ...prev, [requestId]: { rating: 5, feedback: '' } }));
  };

  const updateRating = (requestId: string, rating: number) => {
    setRatingData(prev => ({
      ...prev,
      [requestId]: { ...prev[requestId], rating }
    }));
  };

  const updateFeedback = (requestId: string, feedback: string) => {
    setRatingData(prev => ({
      ...prev,
      [requestId]: { ...prev[requestId], feedback }
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderRequest = (request: any, isReceived: boolean) => {
    const otherUser = getUserById(isReceived ? request.requesterId : request.receiverId);
    if (!otherUser) return null;

    const currentRating = ratingData[request.id]?.rating || 5;
    const currentFeedback = ratingData[request.id]?.feedback || '';

    return (
      <div key={request.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6">
          {/* User Info */}
          <div className="flex items-center space-x-4 mb-4">
            {otherUser.profilePhoto ? (
              <img
                src={otherUser.profilePhoto}
                alt={otherUser.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{otherUser.name}</h3>
              <p className="text-sm text-gray-600">{otherUser.email}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </span>
          </div>

          {/* Swap Details */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mb-4">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {isReceived ? 'They teach' : 'You teach'}
                </p>
                <p className="font-medium text-blue-600">{request.skillOffered}</p>
              </div>
              <div className="text-gray-400 transform rotate-90 sm:rotate-0">⇄</div>
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {isReceived ? 'You learn' : 'They learn'}
                </p>
                <p className="font-medium text-purple-600">{request.skillWanted}</p>
              </div>
            </div>
          </div>

          {/* Message */}
          {request.message && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Message</h4>
              <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                {request.message}
              </p>
            </div>
          )}

          {/* Rating & Feedback (for completed requests) */}
          {request.status === 'completed' && request.rating && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">Rating: {request.rating}/5</span>
              </div>
              {request.feedback && (
                <p className="text-sm text-gray-700">{request.feedback}</p>
              )}
            </div>
          )}

          {/* Date */}
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <Clock className="w-4 h-4 mr-2" />
            {new Date(request.createdAt).toLocaleDateString()}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {/* Received requests */}
            {isReceived && request.status === 'pending' && (
              <>
                <button
                  onClick={() => handleAccept(request.id)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Accept</span>
                </button>
                <button
                  onClick={() => handleReject(request.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center space-x-1"
                >
                  <X className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              </>
            )}

            {/* Sent requests */}
            {!isReceived && request.status === 'pending' && (
              <button
                onClick={() => handleDelete(request.id)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            )}

            {/* Complete swap (for accepted requests) */}
            {request.status === 'accepted' && (
              <div className="w-full space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate this swap (1-5 stars)
                  </label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => updateRating(request.id, star)}
                        className={`p-1 rounded ${
                          star <= currentRating ? 'text-yellow-500' : 'text-gray-300'
                        }`}
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Feedback (optional)
                  </label>
                  <textarea
                    value={currentFeedback}
                    onChange={(e) => updateFeedback(request.id, e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Share your experience..."
                  />
                </div>
                <button
                  onClick={() => handleComplete(request.id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-1"
                >
                  <Award className="w-4 h-4" />
                  <span>Mark as Completed</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Swap Requests</h1>
        <p className="text-gray-600">Manage your skill swap requests and collaborations</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-8 max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('received')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
            activeTab === 'received'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Received ({receivedRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
            activeTab === 'sent'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Sent ({sentRequests.length})
        </button>
      </div>

      {/* Requests List */}
      <div className="space-y-6">
        {activeTab === 'received' ? (
          receivedRequests.length > 0 ? (
            receivedRequests.map(request => renderRequest(request, true))
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No received requests
              </h3>
              <p className="text-gray-600">
                When others send you swap requests, they'll appear here.
              </p>
            </div>
          )
        ) : (
          sentRequests.length > 0 ? (
            sentRequests.map(request => renderRequest(request, false))
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No sent requests
              </h3>
              <p className="text-gray-600">
                Start browsing users and send swap requests to begin learning!
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}