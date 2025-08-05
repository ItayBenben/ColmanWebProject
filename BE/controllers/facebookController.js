import { fbPost } from '../services/facebookService.js';

export const createFacebookPost = async (req, res, next) => {
  try {
    const { fb } = req.body;
    
    if (!fb) {
      return res.status(400).json({ 
        error: 'Facebook post content is required' 
      });
    }

    await fbPost(fb);
    
    res.status(200).json({ 
      message: 'Facebook post posted successfully' 
    });

  } catch (error) {
    console.error('Facebook posting error:', error);
    res.status(500).json({ 
      error: 'Failed to post on facebook page', 
      details: error.message 
    });
  }
}; 