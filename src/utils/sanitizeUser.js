const sanitizeHtml = require("sanitize-html");
const validator = require("validator");

// Function to sanitize and validate user input for register/login
function sanitizeUserInput(body, isRegister = true) {
  const sanitizedUser = {};

  // Helper function to sanitize text (remove harmful HTML/JS)
  const sanitizeText = (text) => {
    return sanitizeHtml(text, {
      allowedTags: [], // Disallow all HTML tags
      allowedAttributes: {}, // No attributes allowed
    }).trim();
  };

  // 1. Username (STRING(100), optional for register, not used in login)
  if (isRegister) {
    if (body.username) {
      sanitizedUser.username = sanitizeText(body.username);
      if (sanitizedUser.username.length > 100) {
        throw new Error("Username must not exceed 100 characters");
      }
    } else {
      sanitizedUser.username = null; // Allow null as per schema
    }
  }

  // 2. Email (STRING(255), required)
  if (!body.email) {
    throw new Error("Email is required");
  }
  sanitizedUser.email = validator.normalizeEmail(sanitizeText(body.email));
  if (!validator.isEmail(sanitizedUser.email)) {
    throw new Error("Invalid email format");
  }
  if (sanitizedUser.email.length > 255) {
    throw new Error("Email must not exceed 255 characters");
  }

  // 3. Password (STRING(255), required)
  if (!body.password) {
    throw new Error("Password is required");
  }
  sanitizedUser.password = body.password; // Password will be hashed by model
  if (!validator.isLength(body.password, { min: 8 })) {
    throw new Error("Password must be at least 8 characters long");
  }
  // Optional: Enforce stronger password requirements
  if (!validator.isStrongPassword(body.password, { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })) {
    throw new Error("Password must include at least one uppercase letter, one lowercase letter, one number, and one symbol");
  }

  // 4. Role (STRING(50), optional for register, defaults to "user")
  if (isRegister) {
    const validRoles = ["user", "admin"]; // Adjust based on your app's roles
    sanitizedUser.role = body.role ? sanitizeText(body.role) : "user";
    if (!validRoles.includes(sanitizedUser.role)) {
      throw new Error(`Role must be one of: ${validRoles.join(", ")}`);
    }
    if (sanitizedUser.role.length > 50) {
      throw new Error("Role must not exceed 50 characters");
    }
  }

  return sanitizedUser;
}

module.exports = { sanitizeUserInput };