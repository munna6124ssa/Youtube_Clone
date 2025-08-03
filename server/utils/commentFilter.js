const Filter = require('bad-words');
const filter = new Filter();

const containsSpecialChars = (text) => {
  // Much more lenient check - only flag truly problematic patterns
  // Allow all normal punctuation, symbols, emojis, and Unicode characters
  
  // Check for excessive repetitive special characters (more than 5 in a row)
  const excessiveSpecialChars = /[^\w\s]{6,}/g;
  if (excessiveSpecialChars.test(text)) return true;
  
  // Check for very high concentration of special characters (more than 50%)
  const specialCharCount = (text.match(/[^\w\s\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]/g) || []).length;
  const specialCharRatio = specialCharCount / text.length;
  
  // Only disallow if more than 50% special characters (very generous)
  return specialCharRatio > 0.5;
};

const cleanComment = (text) => {
  // Very lenient cleaning - only remove truly dangerous characters
  // Keep all normal punctuation, symbols, emojis, and Unicode characters
  let cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters only
  
  // Filter profanity (but keep the structure)
  cleaned = filter.clean(cleaned);
  
  // Remove excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  return cleaned.trim();
};

const isCommentValid = (text) => {
  if (!text || text.trim().length === 0) return false;
  if (text.length > 1000) return false;
  if (text.length < 2) return false; // Minimum 2 characters
  
  // Check for excessive special characters
  if (containsSpecialChars(text)) return false;
  
  // Check for spam patterns (repeated characters - more than 4 consecutive)
  const repeatedCharsRegex = /(.)\1{4,}/g;
  if (repeatedCharsRegex.test(text)) return false;
  
  // Check for excessive capitalization (more than 70% uppercase)
  const upperCaseCount = (text.match(/[A-Z]/g) || []).length;
  const letterCount = (text.match(/[a-zA-Z]/g) || []).length;
  if (letterCount > 5 && (upperCaseCount / letterCount) > 0.7) return false;
  
  // Check for URL-like patterns (basic spam prevention)
  const urlPattern = /(https?:\/\/|www\.|\.com|\.org|\.net)/gi;
  if (urlPattern.test(text)) return false;
  
  return true;
};

const shouldAutoDelete = (comment) => {
  // Auto-delete if 2 or more dislikes
  return comment.dislikes && comment.dislikes.length >= 2;
};

module.exports = {
  containsSpecialChars,
  cleanComment,
  isCommentValid,
  shouldAutoDelete
};
