const { Product, Category, Author } = require("../model/index");
const { Op } = require("sequelize");

const addProduct = async (req, res, next) => {
  try {
    const {
      title,
      coverImageUrl,
      detail,
      price,
      authorId,
      categoryId,
      quantity,
    } = req.body;

    if (
      !title ||
      !coverImageUrl ||
      !detail ||
      !price ||
      !authorId ||
      !categoryId ||
      !quantity
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All fields (title, coverImageUrl, detail, price, authorId, categoryId) are required.",
      });
    }

    if (isNaN(price) || price <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Price must be a positive number." });
    }

    const author = await Author.findByPk(authorId);
    if (!author) {
      return res.status(404).json({
        success: false,
        message: `Author with ID ${authorId} not found.`,
      });
    }

    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Category with ID ${categoryId} not found.`,
      });
    }

    const product = await Product.create({
      title,
      coverImageUrl,
      detail,
      price,
      authorId,
      categoryId,
      quantity,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully.",
      data: product,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    next(error);
  }
};

const getProductDetails = async (req, res, next) => {
  const { id } = req.params;

  try {
    const product = await Product.findByPk(id, {
      include: [
        {
          model: Author,
          as: "author",
          attributes: ["id", "name", "bio"],
        },
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "description"],
        },
      ],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} not found.`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Product fetched successfully.",
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product details:", error);
    next(error);
  }
};

const getAllProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    const whereCondition = search
      ? {
          title: { [Op.like]: `%${search}%` },
        }
      : {};

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Author,
          as: "author",
          attributes: ["id", "name", "bio"],
        },
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "description"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      message: "Products fetched successfully.",
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
      data: products,
    });
  } catch (error) {
    console.error("Error fetching all products:", error);
    next(error);
  }
};

module.exports = {
  addProduct,
  getProductDetails,
  getAllProducts,
};
