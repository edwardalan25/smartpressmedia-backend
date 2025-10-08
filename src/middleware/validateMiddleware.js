const Joi = require("joi");

// Validation schemas
const schemas = {
  register: Joi.object({
    username: Joi.string().min(4).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    role: Joi.string().valid("user", "admin").optional(),
  }),
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

// Validation middleware
const validate = (schemaName) => (req, res, next) => {
  const schema = schemas[schemaName];
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.details.map((err) => err.message),
    });
  }
  next();
};

module.exports = { validate };
