const sanitizeHtml = require("sanitize-html");

const sanitizeInput = (data) => {
  // Recursively sanitize strings in the input object
  if (typeof data === "string") {
    return sanitizeHtml(data, {
      allowedTags: [], // Disallow all HTML tags
      allowedAttributes: {}, // Disallow all attributes
    });
  } else if (typeof data === "object" && data !== null) {
    const sanitized = {};
    for (const key in data) {
      sanitized[key] = sanitizeInput(data[key]);
    }
    return sanitized;
  }
  return data;
};

module.exports = sanitizeInput;
