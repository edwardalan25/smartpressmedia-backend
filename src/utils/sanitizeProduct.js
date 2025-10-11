const sanitizeHtml = require('sanitize-html');
const validator = require('validator');

// Function to sanitize and validate the product input body
function sanitizeProductInput(body) {
  const sanitizedProduct = {};

  // Helper function to sanitize text (remove harmful HTML/JS)
  const sanitizeText = (text) => {
    return sanitizeHtml(text, {
      allowedTags: [], // Disallow all HTML tags
      allowedAttributes: {}, // No attributes allowed
    }).trim();
  };

  // 1. Title (STRING, required)
  if (!body.title) {
    throw new Error('Title is required');
  }
  sanitizedProduct.title = sanitizeText(body.title);
  if (sanitizedProduct.title.length === 0 || sanitizedProduct.title.length > 255) {
    throw new Error('Title must be between 1 and 255 characters');
  }

  // 2. AuthorId (INTEGER, required)
  if (!body.authorId || !validator.isInt(String(body.authorId))) {
    throw new Error('Valid authorId is required');
  }
  sanitizedProduct.authorId = parseInt(body.authorId, 10);

  // 3. Description (TEXT, required)
  if (!body.description) {
    throw new Error('Description is required');
  }
  sanitizedProduct.description = sanitizeText(body.description);
  if (sanitizedProduct.description.length === 0) {
    throw new Error('Description cannot be empty');
  }

  // 4. Price (DECIMAL(10,2), required)
  if (!body.price || !validator.isFloat(String(body.price), { min: 0 })) {
    throw new Error('Valid price is required (must be a non-negative number)');
  }
  sanitizedProduct.price = parseFloat(parseFloat(body.price).toFixed(2));

  // 5. Genres (JSON, required)
  if (!body.genres || !Array.isArray(body.genres)) {
    throw new Error('Genres must be a valid array');
  }
  sanitizedProduct.genres = body.genres.map((genre) => sanitizeText(String(genre)));
  if (sanitizedProduct.genres.length === 0) {
    throw new Error('At least one genre is required');
  }

  // 6. Tags (JSON, required)
  if (!body.tags || !Array.isArray(body.tags)) {
    throw new Error('Tags must be a valid array');
  }
  sanitizedProduct.tags = body.tags.map((tag) => sanitizeText(String(tag)));
  if (sanitizedProduct.tags.length === 0) {
    throw new Error('At least one tag is required');
  }

  // 7. Ratings (DECIMAL(3,2), required)
  if (!body.ratings || !validator.isFloat(String(body.ratings), { min: 0, max: 5 })) {
    throw new Error('Ratings must be a number between 0 and 5');
  }
  sanitizedProduct.ratings = parseFloat(parseFloat(body.ratings).toFixed(2));

  // 8. AdditionalMetaData (JSON, optional)
  sanitizedProduct.additionalMetaData = body.additionalMetaData || {};
  if (typeof sanitizedProduct.additionalMetaData !== 'object' || Array.isArray(sanitizedProduct.additionalMetaData)) {
    throw new Error('AdditionalMetaData must be a valid JSON object');
  }
  // Sanitize all string values in additionalMetaData
  sanitizedProduct.additionalMetaData = Object.keys(sanitizedProduct.additionalMetaData).reduce((acc, key) => {
    const value = sanitizedProduct.additionalMetaData[key];
    acc[sanitizeText(key)] = typeof value === 'string' ? sanitizeText(value) : value;
    return acc;
  }, {});

  // 9. CoverImageUrl (STRING(255), required)
  if (!body.coverImageUrl) {
    throw new Error('CoverImageUrl is required');
  }
  if (!validator.isURL(body.coverImageUrl)) {
    throw new Error('CoverImageUrl must be a valid URL');
  }
  sanitizedProduct.coverImageUrl = validator.trim(body.coverImageUrl);
  if (sanitizedProduct.coverImageUrl.length > 255) {
    throw new Error('CoverImageUrl must not exceed 255 characters');
  }

  return sanitizedProduct;
}



module.exports = { sanitizeProductInput };