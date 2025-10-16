const Category = require("../model/Category");

const addCategory = async (req, res, next) => {
  const { name, description } = req.body;
  try {
    const category = await Category.create({ name, description });
    res.status(201).json({ success: true, category });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const category = await Category.findAll({
      attributes: ["id", "name", "description"],
    });
    res.status(200).json({ success: true, category });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addCategory,
  getAll,
};
