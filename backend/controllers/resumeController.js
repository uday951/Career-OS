import Resume from '../models/Resume.js';
import AutomationSettings from '../models/AutomationSettings.js';
import { extractTextFromPdf } from '../services/resumeParserService.js';

// @desc    Upload new resume and basic parse
// @route   POST /api/resumes/upload
// @access  Private
export const uploadResume = async (req, res, next) => {
  try {
    const { title } = req.body;
    let original_text = req.body.original_text || '';
    
    // Parse PDF if uploaded
    if (req.file) {
      original_text = await extractTextFromPdf(req.file.buffer);
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

// @desc    Delete user resume
// @route   DELETE /api/resumes/:id
// @access  Private
export const deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user_id: req.user._id });
    if (!resume) {
      res.status(404);
      throw new Error("Resume not found");
    }
    
    await resume.deleteOne();
    
    // Clean up active resume selection in automation settings
    await AutomationSettings.updateOne(
      { user_id: req.user._id, resume_id: req.params.id },
      { $unset: { resume_id: "" } }
    );
    
    res.json({ message: 'Resume removed successfully' });
  } catch (error) {
    next(error);
  }
};
