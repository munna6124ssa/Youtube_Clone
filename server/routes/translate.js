const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { translateText } = require('../utils/translate');

const router = express.Router();

// Simple text translation endpoint
router.post('/', auth, [
  body('text').isLength({ min: 1, max: 1000 }).trim(),
  body('targetLanguage').isLength({ min: 2, max: 5 }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text, targetLanguage } = req.body;
    
    // Translate the text
    const translationResult = await translateText(text, targetLanguage);
    
    if (!translationResult || !translationResult.translatedText) {
      return res.status(400).json({ 
        message: 'Translation failed. Please try again.' 
      });
    }

    res.json({
      originalText: text,
      translatedText: translationResult.translatedText,
      targetLanguage,
      message: 'Translation successful'
    });

  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ 
      message: 'Translation service error. Please try again later.' 
    });
  }
});

module.exports = router;
