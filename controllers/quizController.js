const Quiz = require('../models/quiz');

exports.getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.findAll();
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createQuiz = async (req, res) => {
  const { question, options, correctOptionIndex } = req.body;
  try {
    const newQuiz = await Quiz.create({ question, options, correctOptionIndex });
    res.status(201).json(newQuiz);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};