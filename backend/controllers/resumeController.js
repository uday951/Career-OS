import Resume from '../models/Resume.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// @desc    Upload new resume and basic parse
// @route   POST /api/resumes/upload
// @access  Private
export const uploadResume = async (req, res, next) => {
  try {
    const { title } = req.body;
    let original_text = req.body.original_text || '';
    
    // Parse PDF if uploaded
    if (req.file) {
      const pdfData = await pdfParse(req.file.buffer);
      original_text = pdfData.text;
    }

    if (!original_text || original_text.trim() === '') {
      res.status(400);
      throw new Error('Please provide resume text or a PDF file');
    }

    const resume = await Resume.create({
      user_id: req.user._id,
      title: title || 'New Resume',
      original_text,
    });

    res.status(201).json(resume);
  } catch (error) {
    console.error('uploadResume error:', error);
    next(error);
  }
};

// @desc    Get all user resumes
// @route   GET /api/resumes
// @access  Private
export const getMyResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ user_id: req.user._id }).sort({ createdAt: -1 });
    res.json(resumes);
  } catch (error) {
    next(error);
  }
};
