import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  User as UserIcon,
  Ban,
  Shield,
  Star,
  Calendar,
  Download,
  Send,
  Mail,
  AlertCircle as AlertIcon, // Add this line for the alert button icon
} from "lucide-react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


// Configure axios defaults
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";
axios.defaults.baseURL = API_BASE_URL;

export default function AdminDashboard() {
  const { users, swapRequests, banUser, unbanUser } = useData();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<
    "overview" | "users" | "swaps" | "reports"
  >("overview");
  const [announcementMessage, setAnnouncementMessage] = useState("");

  // Add these lines for the alert system state
  const [alertType, setAlertType] = useState<
    "alert" | "downtime" | "maintenance"
  >("alert");
  const [alertSubject, setAlertSubject] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [isSendingAlert, setIsSendingAlert] = useState(false);

  // Add this function for sending alerts (dummy implementation)
  const handleSendAlert = () => {
    if (!alertMessage.trim()) return;
    setIsSendingAlert(true);
    // Replace with your API call
    setTimeout(() => {
      alert("Alert sent!");
      setIsSendingAlert(false);
      setAlertMessage("");
      setAlertSubject("");
      setAlertType("alert");
    }, 1500);
  };

  if (!user?.isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  const totalUsers = users.length;
  const totalSwaps = swapRequests.length;
  const pendingSwaps = swapRequests.filter(
    (req) => req.status === "pending"
  ).length;
  const completedSwaps = swapRequests.filter(
    (req) => req.status === "completed"
  ).length;
  const publicUsers = users.filter((u) => u.isPublic).length;

  const handleSendAnnouncement = () => {
    if (announcementMessage.trim()) {
      // Create announcement via API
      axios
        .post("/admin/announcements", {
          title: "Platform Announcement",
          message: announcementMessage,
          type: "info",
        })
        .then(() => {
          alert("Announcement sent successfully!");
          setAnnouncementMessage("");
        })
        .catch((error) => {
          console.error("Error sending announcement:", error);
          alert("Failed to send announcement. Please try again.");
        });
    }
  };
  
  // Modify the downloadReport function - replace the existing function with this:
  const downloadReport = async (type: string) => {
    const endpoints = {
      users: "/admin/reports/users",
      swaps: "/admin/reports/swaps",
      activity: "/admin/reports/activity",
    };

    const endpoint = endpoints[type as keyof typeof endpoints];
    if (endpoint) {
      try {
        const response = await axios.get(endpoint);
        const data = response.data.data;

        // Create PDF
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;

        // Set title
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");

        let yPosition = 30;

        if (type === "users") {
          doc.text("User Activity Report", pageWidth / 2, yPosition, {
            align: "center",
          });
          yPosition += 20;

          // Add summary stats
          doc.setFontSize(12);
          doc.setFont("helvetica", "normal");
          doc.text(`Total Users: ${data.totalUsers}`, margin, yPosition);
          yPosition += 10;
          doc.text(
            `Generated: ${new Date(data.generatedAt).toLocaleString()}`,
            margin,
            yPosition
          );
          yPosition += 20;

          // Create table data
          const tableData = data.users.map((user: any) => [
            user.name,
            user.email,
            user.location || "Not specified",
            user.skillsOffered?.join(", ") || "None",
            user.rating?.toString() || "N/A",
            user.isPublic ? "Active" : "Inactive",
            user.swapStats?.completed || 0,
            new Date(user.createdAt).toLocaleDateString(),
          ]);

          // Add table
          autoTable(doc, {
            head: [
              [
                "Name",
                "Email",
                "Location",
                "Skills",
                "Rating",
                "Status",
                "Swaps",
                "Joined",
              ],
            ],
            body: tableData,
            startY: yPosition,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [59, 130, 246] },
            columnStyles: {
              0: { cellWidth: 25 },
              1: { cellWidth: 35 },
              2: { cellWidth: 20 },
              3: { cellWidth: 30 },
              4: { cellWidth: 15 },
              5: { cellWidth: 15 },
              6: { cellWidth: 15 },
              7: { cellWidth: 20 },
            },
          });
        } else if (type === "swaps") {
          doc.text("Swap Statistics Report", pageWidth / 2, yPosition, {
            align: "center",
          });
          yPosition += 20;

          // Add summary stats
          doc.setFontSize(12);
          doc.setFont("helvetica", "normal");
          doc.text(`Total Swaps: ${data.statistics.total}`, margin, yPosition);
          yPosition += 10;
          doc.text(
            `Average Rating: ${data.statistics.averageRating}`,
            margin,
            yPosition
          );
          yPosition += 10;
          doc.text(
            `Generated: ${new Date(data.generatedAt).toLocaleString()}`,
            margin,
            yPosition
          );
          yPosition += 20;

          // Status breakdown
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text("Status Breakdown:", margin, yPosition);
          yPosition += 15;

          doc.setFontSize(12);
          doc.setFont("helvetica", "normal");
          Object.entries(data.statistics.byStatus).forEach(
            ([status, count]) => {
              doc.text(
                `${status.charAt(0).toUpperCase() + status.slice(1)}: ${count}`,
                margin,
                yPosition
              );
              yPosition += 10;
            }
          );

          yPosition += 10;

          // Create table data for swaps
          const tableData = data.swapRequests.map((swap: any) => [
            swap.requester?.name || "Unknown",
            swap.receiver?.name || "Unknown",
            swap.skillOffered,
            swap.skillWanted,
            swap.status.charAt(0).toUpperCase() + swap.status.slice(1),
            swap.rating?.toString() || "N/A",
            new Date(swap.createdAt).toLocaleDateString(),
          ]);

          // Add table
          autoTable(doc, {
            head: [
              [
                "Requester",
                "Receiver",
                "Skill Offered",
                "Skill Wanted",
                "Status",
                "Rating",
                "Date",
              ],
            ],
            body: tableData,
            startY: yPosition,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [59, 130, 246] },
            columnStyles: {
              0: { cellWidth: 25 },
              1: { cellWidth: 25 },
              2: { cellWidth: 30 },
              3: { cellWidth: 30 },
              4: { cellWidth: 20 },
              5: { cellWidth: 15 },
              6: { cellWidth: 20 },
            },
          });
        } else if (type === "activity") {
          doc.text("Platform Activity Report", pageWidth / 2, yPosition, {
            align: "center",
          });
          yPosition += 20;

          // Add report period
          doc.setFontSize(12);
          doc.setFont("helvetica", "normal");
          doc.text(
            `Report Period: ${new Date(
              data.reportPeriod.from
            ).toLocaleDateString()} - ${new Date(
              data.reportPeriod.to
            ).toLocaleDateString()}`,
            margin,
            yPosition
          );
          yPosition += 10;
          doc.text(
            `Generated: ${new Date(data.generatedAt).toLocaleString()}`,
            margin,
            yPosition
          );
          yPosition += 20;

          // User Statistics
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text("User Statistics:", margin, yPosition);
          yPosition += 15;

          doc.setFontSize(12);
          doc.setFont("helvetica", "normal");
          doc.text(`Total Users: ${data.users.total}`, margin, yPosition);
          yPosition += 10;
          doc.text(`Active Users: ${data.users.active}`, margin, yPosition);
          yPosition += 10;
          doc.text(`Banned Users: ${data.users.banned}`, margin, yPosition);
          yPosition += 10;
          doc.text(
            `New This Month: ${data.users.newThisMonth}`,
            margin,
            yPosition
          );
          yPosition += 10;
          doc.text(
            `New This Week: ${data.users.newThisWeek}`,
            margin,
            yPosition
          );
          yPosition += 20;

          // Swap Statistics
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text("Swap Statistics:", margin, yPosition);
          yPosition += 15;

          doc.setFontSize(12);
          doc.setFont("helvetica", "normal");
          doc.text(`Total Swaps: ${data.swaps.total}`, margin, yPosition);
          yPosition += 10;
          doc.text(`Pending Swaps: ${data.swaps.pending}`, margin, yPosition);
          yPosition += 10;
          doc.text(
            `Completed Swaps: ${data.swaps.completed}`,
            margin,
            yPosition
          );
          yPosition += 10;
          doc.text(
            `Swaps This Month: ${data.swaps.thisMonth}`,
            margin,
            yPosition
          );
          yPosition += 10;
          doc.text(
            `Swaps This Week: ${data.swaps.thisWeek}`,
            margin,
            yPosition
          );
          yPosition += 20;

          // Top Skills Table
          if (data.topSkills && data.topSkills.length > 0) {
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Top Skills:", margin, yPosition);
            yPosition += 15;

            const skillsTableData = data.topSkills.map((skill: any) => [
              skill._id,
              skill.count.toString(),
            ]);

            autoTable(doc, {
              head: [["Skill", "Count"]],
              body: skillsTableData,
              startY: yPosition,
              styles: { fontSize: 10 },
              headStyles: { fillColor: [59, 130, 246] },
              columnStyles: {
                0: { cellWidth: 100 },
                1: { cellWidth: 30 },
              },
            });
          }
        }

        // Save the PDF
        const filename = `${type}-report-${
          new Date().toISOString().split("T")[0]
        }.pdf`;
        doc.save(filename);
      } catch (error) {
        console.error("Error downloading report:", error);
        alert("Failed to download report. Please try again.");
      }
    }
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Manage users, monitor activity, and oversee the platform
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-8">
        {[
          { key: "overview", label: "Overview", icon: TrendingUp },
          { key: "users", label: "Users", icon: Users },
          { key: "swaps", label: "Swaps", icon: MessageSquare },
          { key: "reports", label: "Reports", icon: Download },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSelectedTab(key as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
              selectedTab === key
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === "overview" && (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalUsers}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Swaps</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalSwaps}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {pendingSwaps}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {completedSwaps}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Email Alert System */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              Send Platform Alert Email
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alert Type
                </label>
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="alert">General Alert</option>
                  <option value="downtime">Downtime Notice</option>
                  <option value="maintenance">Maintenance Notice</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Subject (optional)
                </label>
                <input
                  type="text"
                  value={alertSubject}
                  onChange={(e) => setAlertSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Leave empty to use default subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alert Message *
                </label>
                <textarea
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={
                    alertType === "downtime"
                      ? "The platform will be down for maintenance from 2:00 AM to 4:00 AM EST on Sunday, January 15th. During this time, you won't be able to access the platform."
                      : alertType === "maintenance"
                      ? "We will be performing scheduled maintenance to improve platform performance. Expected duration: 2 hours."
                      : "Important platform update or announcement message..."
                  }
                />
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={handleSendAlert}
                  disabled={!alertMessage.trim() || isSendingAlert}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSendingAlert ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <AlertIcon className="w-4 h-4" />
                  )}
                  <span>
                    {isSendingAlert ? "Sending..." : "Send Alert to All Users"}
                  </span>
                </button>

                <div className="text-sm text-gray-600">
                  This will send an email to all active users (
                  {users.filter((u) => !u.isAdmin && u.isPublic).length} users)
                </div>
              </div>
            </div>
          </div>

          {/* Announcements */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Send Platform Announcement
            </h2>
            <div className="space-y-4">
              <textarea
                value={announcementMessage}
                onChange={(e) => setAnnouncementMessage(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your announcement message..."
              />
              <button
                onClick={handleSendAnnouncement}
                disabled={!announcementMessage.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Send Announcement</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {selectedTab === "users" && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">User Management</h2>
            <p className="text-gray-600 mt-1">
              Manage user accounts and permissions
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Skills Offered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users
                  .filter((u) => !u.isAdmin)
                  .map((userData) => (
                    <tr key={userData.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {userData.profilePhoto ? (
                            <img
                              src={userData.profilePhoto}
                              alt={userData.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                              <UserIcon className="w-5 h-5 text-gray-500" />
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {userData.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {userData.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {userData.skillsOffered.slice(0, 2).map((skill) => (
                            <span
                              key={skill}
                              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                          {userData.skillsOffered.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{userData.skillsOffered.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 mr-1" />
                          <span className="text-sm text-gray-900">
                            {userData.rating}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            userData.isPublic
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {userData.isPublic ? "Active" : "Banned"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {userData.isPublic ? (
                          <button
                            onClick={() => banUser(userData.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors duration-200 flex items-center space-x-1"
                          >
                            <Ban className="w-3 h-3" />
                            <span>Ban</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => unbanUser(userData.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center space-x-1"
                          >
                            <Shield className="w-3 h-3" />
                            <span>Unban</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Swaps Tab */}
      {selectedTab === "swaps" && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Swap Monitoring</h2>
            <p className="text-gray-600 mt-1">
              Monitor all skill swap requests and activities
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Skills
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {swapRequests.map((request) => {
                  const requester = users.find(
                    (u) => u.id === request.requesterId
                  );
                  const receiver = users.find(
                    (u) => u.id === request.receiverId
                  );

                  return (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {requester?.name} → {receiver?.name}
                          </div>
                          <div className="text-gray-500">
                            {requester?.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-blue-600">
                            {request.skillOffered}
                          </div>
                          <div className="text-purple-600">
                            ↔ {request.skillWanted}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            request.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : request.status === "accepted"
                              ? "bg-green-100 text-green-800"
                              : request.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {request.status.charAt(0).toUpperCase() +
                            request.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(request.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {request.rating ? (
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 mr-1" />
                            <span className="text-sm text-gray-900">
                              {request.rating}/5
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {selectedTab === "reports" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                User Activity Report
              </h3>
              <p className="text-gray-600 mb-4">
                Download comprehensive user activity data
              </p>
              <button
                onClick={() => downloadReport("activity")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Users Data
              </h3>
              <p className="text-gray-600 mb-4">
                Export all user profiles and information
              </p>
              <button
                onClick={() => downloadReport("users")}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Swap Statistics
              </h3>
              <p className="text-gray-600 mb-4">
                Download swap requests and feedback data
              </p>
              <button
                onClick={() => downloadReport("swaps")}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
