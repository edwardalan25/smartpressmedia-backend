const Author = require("../model/Author");
const sanitizeInput = require("../utils/sanitizeInputs");

const addAuthor = async (req, res, next) => {
  const { name, bio, image, additionalMetaData } = req.body;
  try {
    const sanitizedData = {
      name: sanitizeInput(name),
      bio: sanitizeInput(bio),
      image: sanitizeInput(image),
      additionalMetaData: sanitizeInput(additionalMetaData),
    };
    const author = await Author.create(sanitizedData);
    res.status(201).json(author);
  } catch (error) {
    next(error);
  }
};

const authorDetails = async (req, res, next) => {
  const { id } = req.params;
  try {
    const author = await Author.findByPk(id);
    if (!author) {
      return res.status(400).json({ error: "No Author found!" });
    }
    res.status(200).json({
      success: true,
      data: author,
    });
  } catch (error) {
    next(error);
  }
};

const getAllAuthors = async (req, res, next) => {
  try {
    console.log("Fetching all authors...");
    const authors = await Author.findAndCountAll();
    res.status(200).json({
      success: true,
      count: authors.count,
      data: authors.rows,
    });
  } catch (error) {
    console.error("Error fetching authors:", error);
    next(error);
  }
};

module.exports = {
  addAuthor,
  authorDetails,
  getAllAuthors,
};
