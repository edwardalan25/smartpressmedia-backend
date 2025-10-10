const express = require("express");
const router = express.Router();
const Questions = require("../model/Questions");
const Option = require("../model/Option");
const { body, validationResult } = require("express-validator");

// POST /api/questions - Create a new question
router.post(
  "/questions",
  [
    body("questionText")
      .notEmpty()
      .isString()
      .withMessage("questionText is required and must be a string"),
    body("isRoot")
      .optional()
      .isBoolean()
      .withMessage("isRoot must be a boolean"),
    body("additional_metadata")
      .optional()
      .isObject()
      .withMessage("additional_metadata must be an object"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        questionText,
        isRoot = false,
        additional_metadata = {},
      } = req.body;
      const question = await Question.create({
        questionText,
        isRoot,
        additional_metadata,
      });
      res.status(201).json({ message: "Question created", question });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// POST /api/options - Create a new option
router.post(
  "/options",
  [
    body("questionId")
      .notEmpty()
      .isInt()
      .withMessage("questionId is required and must be an integer"),
    body("optionText")
      .notEmpty()
      .isString()
      .withMessage("optionText is required and must be a string"),
    body("tags").optional().isArray().withMessage("tags must be an array"),
    body("nextQuestionId")
      .optional()
      .isInt()
      .withMessage("nextQuestionId must be an integer"),
    body("additionalMetaData")
      .optional()
      .isObject()
      .withMessage("additionalMetaData must be an object"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        questionId,
        optionText,
        tags = [],
        nextQuestionId = null,
        additionalMetaData = {},
      } = req.body;

      // Validate questionId exists
      const question = await Question.findByPk(questionId);
      if (!question) {
        return res.status(404).json({ error: "questionId does not exist" });
      }

      // Validate nextQuestionId if provided
      if (nextQuestionId) {
        const nextQuestion = await Question.findByPk(nextQuestionId);
        if (!nextQuestion) {
          return res
            .status(404)
            .json({ error: "nextQuestionId does not exist" });
        }
      }

      const option = await Option.create({
        questionId,
        optionText,
        tags,
        nextQuestionId,
        additionalMetaData,
      });
      res.status(201).json({ message: "Option created", option });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// GET /api/questions/:id - Fetch a question and its options (for testing)
router.get("/questions/:id", async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id, {
      include: [{ model: Option, as: "Options" }],
    });
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    res.json({ question });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
