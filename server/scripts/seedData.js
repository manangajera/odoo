const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const SwapRequest = require('../models/SwapRequest');

// Sample users data
const sampleUsers = [
  {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    password: 'password123',
    location: 'New York, NY',
    bio: 'Creative designer with 5+ years of experience in visual communication and brand development.',
    skillsOffered: ['Graphic Design', 'Photoshop', 'Illustrator', 'UI/UX Design'],
    skillsWanted: ['Web Development', 'React', 'JavaScript'],
    availability: ['Weekends', 'Evenings'],
    isPublic: true,
    rating: 4.8
  },
  {
    name: 'Bob Smith',
    email: 'bob@example.com',
    password: 'password123',
    location: 'San Francisco, CA',
    bio: 'Full-stack developer passionate about creating amazing user experiences and scalable applications.',
    skillsOffered: ['Web Development', 'React', 'Node.js', 'JavaScript', 'Python'],
    skillsWanted: ['UI/UX Design', 'Photoshop', 'Digital Marketing'],
    availability: ['Weekdays', 'Evenings'],
    isPublic: true,
    rating: 4.9
  },
  {
    name: 'Carol Davis',
    email: 'carol@example.com',
    password: 'password123',
    location: 'Austin, TX',
    bio: 'Data analyst helping businesses make data-driven decisions with advanced analytics.',
    skillsOffered: ['Data Analysis', 'Excel', 'Python', 'SQL', 'Tableau'],
    skillsWanted: ['Machine Learning', 'R Programming', 'Statistics'],
    availability: ['Weekends'],
    isPublic: true,
    rating: 4.7
  },
  {
    name: 'David Wilson',
    email: 'david@example.com',
    password: 'password123',
    location: 'Seattle, WA',
    bio: 'Marketing specialist with expertise in digital growth strategies and content creation.',
    skillsOffered: ['Digital Marketing', 'SEO', 'Content Writing', 'Social Media'],
    skillsWanted: ['Graphic Design', 'Video Editing', 'Photography'],
    availability: ['Evenings', 'Weekends'],
    isPublic: true,
    rating: 4.6
  },
  {
    name: 'Emma Thompson',
    email: 'emma@example.com',
    password: 'password123',
    location: 'Boston, MA',
    bio: 'Professional photographer and video editor with a passion for storytelling through visuals.',
    skillsOffered: ['Photography', 'Video Editing', 'Adobe Premiere', 'Lightroom'],
    skillsWanted: ['Web Development', 'Social Media Marketing', 'Business Strategy'],
    availability: ['Weekdays', 'Mornings'],
    isPublic: true,
    rating: 4.9
  },
  {
    name: 'Frank Rodriguez',
    email: 'frank@example.com',
    password: 'password123',
    location: 'Miami, FL',
    bio: 'Business consultant specializing in startup strategy and operations optimization.',
    skillsOffered: ['Business Strategy', 'Project Management', 'Financial Planning'],
    skillsWanted: ['Digital Marketing', 'Web Development', 'Data Analysis'],
    availability: ['Weekdays', 'Evenings'],
    isPublic: true,
    rating: 4.5
  },
  {
    name: 'Grace Lee',
    email: 'grace@example.com',
    password: 'password123',
    location: 'Los Angeles, CA',
    bio: 'Mobile app developer focused on creating intuitive and performant iOS and Android applications.',
    skillsOffered: ['Mobile Development', 'iOS', 'Android', 'Flutter', 'Swift'],
    skillsWanted: ['Backend Development', 'DevOps', 'Cloud Computing'],
    availability: ['Weekends', 'Evenings'],
    isPublic: true,
    rating: 4.8
  },
  {
    name: 'Henry Chen',
    email: 'henry@example.com',
    password: 'password123',
    location: 'Chicago, IL',
    bio: 'DevOps engineer with expertise in cloud infrastructure and automation.',
    skillsOffered: ['DevOps', 'AWS', 'Docker', 'Kubernetes', 'CI/CD'],
    skillsWanted: ['Machine Learning', 'Data Science', 'Python'],
    availability: ['Weekdays', 'Mornings'],
    isPublic: true,
    rating: 4.7
  }
];

// Admin user
const adminUser = {
  name: 'Admin User',
  email: 'admin@skillswap.com',
  password: 'admin123',
  skillsOffered: [],
  skillsWanted: [],
  availability: [],
  isPublic: false,
  isAdmin: true,
  rating: 5.0
};

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await SwapRequest.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const admin = new User(adminUser);
    await admin.save();
    console.log('👑 Admin user created');

    // Create sample users
    const users = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      users.push(user);
    }
    console.log(`👥 Created ${users.length} sample users`);

    // Create some sample swap requests
    const sampleSwaps = [
      {
        requester: users[0]._id, // Alice
        receiver: users[1]._id,  // Bob
        skillOffered: 'Graphic Design',
        skillWanted: 'React',
        message: 'Hi Bob! I\'d love to learn React from you. I can help you with graphic design in return.',
        status: 'pending'
      },
      {
        requester: users[1]._id, // Bob
        receiver: users[2]._id,  // Carol
        skillOffered: 'Web Development',
        skillWanted: 'Data Analysis',
        message: 'Hi Carol! I\'m interested in learning data analysis. I can teach you web development.',
        status: 'accepted'
      },
      {
        requester: users[3]._id, // David
        receiver: users[4]._id,  // Emma
        skillOffered: 'Digital Marketing',
        skillWanted: 'Photography',
        message: 'Hi Emma! I\'d like to improve my photography skills. I can help you with digital marketing.',
        status: 'completed',
        rating: 5,
        feedback: 'Emma was an excellent teacher! Very patient and knowledgeable.'
      },
      {
        requester: users[5]._id, // Frank
        receiver: users[6]._id,  // Grace
        skillOffered: 'Business Strategy',
        skillWanted: 'Mobile Development',
        message: 'Hi Grace! I\'m looking to learn mobile development. I can share business strategy insights.',
        status: 'rejected'
      }
    ];

    for (const swapData of sampleSwaps) {
      const swap = new SwapRequest(swapData);
      await swap.save();
    }
    console.log(`🔄 Created ${sampleSwaps.length} sample swap requests`);

    console.log('🎉 Database seeded successfully!');
    console.log('\n📋 Login credentials:');
    console.log('Admin: admin@skillswap.com / admin123');
    console.log('User: alice@example.com / password123');
    console.log('User: bob@example.com / password123');
    console.log('(All sample users use password: password123)');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seed function
seedDatabase();