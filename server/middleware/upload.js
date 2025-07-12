const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'skillswap/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  }
});

// Create multer upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Helper function to delete image from Cloudinary
const deleteFromCloudinary = async (imageUrl) => {
  try {
    if (imageUrl && imageUrl.includes('cloudinary.com')) {
      // Extract public_id from Cloudinary URL
      const urlParts = imageUrl.split('/');
      const publicIdWithExtension = urlParts[urlParts.length - 1];
      const publicId = `skillswap/profiles/${publicIdWithExtension.split('.')[0]}`;
      
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
  }
};

module.exports = {
  upload,
  deleteFromCloudinary,
  cloudinary
};