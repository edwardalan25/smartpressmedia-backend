const express = require("express");
const router = express.Router();
const Question = require("../model/Questions");
const Option = require("../model/Option");
const QuizResponse = require("../model/QuizResponse");
const Book = require("../model/Book");



router.get("/start", async (req, res) => {
  const question = await Question.findOne({ where: { isRoot: true } });
  if (!question)
    return res.status(404).json({ error: "No root question found" });
  const options = await Option.findAll({ where: { questionId: question.id } });
  res.json({ question, options });
});



router.get("/question/:id", async (req, res) => {
  const question = await Question.findByPk(req.params.id);
  if (!question) return res.status(404).json({ error: "Question not found" });
  const options = await Option.findAll({ where: { questionId: question.id } });
  res.json({ question, options });
});



router.post("/submit", async (req, res) => {
  const { userId, answers } = req.body; 
  
  const options = await Option.findAll({
    where: { id: answers.map((a) => a.optionId) },
  });
  const tags = options.flatMap((o) => o.tags || []);
  const books = await Book.findAll({
    where: { genres: { [Op.contains]: tags } },
  });
  const recommendedBooks = books.map((b) => b.id);
  const quizResponse = await QuizResponse.create({
    userId: userId || null,
    answers,
    recommendedBooks,
  });
  res.json({ quizResponse, books });
});



module.exports = router;
