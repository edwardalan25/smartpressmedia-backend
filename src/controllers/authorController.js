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
    const author = await Author.findByPk(id, {
      attributes: ["id", "name", "bio", "image", "additionalMetaData"],
    });
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    const whereCondition = search
      ? {
          title: { [require("sequelize").Op.like]: `%${search}%` },
        }
      : {};

    const { count, rows: authors } = await Author.findAndCountAll({
      where: whereCondition,
      attributes: ["id", "name", "image"],
      limit,
      offset,
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
      data: authors,
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
