var express = require('express');
let slugify = require('slugify')
var router = express.Router();
let modelProduct = require('../schemas/products')
let { checkLogin, isAdmin, isAdminOrMod } = require('../utils/authHandler.js')

// GET - Lấy danh sách sản phẩm - Không cần đăng nhập
router.get('/', async function (req, res, next) {
  try {
    let data = await modelProduct.find({});
    let queries = req.query;
    let titleQ = queries.title ? queries.title : '';
    let maxPrice = queries.maxPrice ? queries.maxPrice : 1E4;
    let minPrice = queries.minPrice ? queries.minPrice : 0;
    let limit = queries.limit ? queries.limit : 5;
    let page = queries.page ? queries.page : 1;
    let result = data.filter(
      function (e) {
        return (!e.isDeleted) && e.price >= minPrice
          && e.price <= maxPrice && e.title.toLowerCase().includes(titleQ);
      }
    )
    result = result.splice(limit * (page - 1), limit)
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET - Lấy sản phẩm theo id - Không cần đăng nhập
router.get('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await modelProduct.findById(id)
    if (result && (!result.isDeleted)) {
      res.json(result)
    } else {
      res.status(404).json({
        message: "ID không tìm thấy"
      })
    }
  } catch (error) {
    res.status(404).json({
      message: "ID không tìm thấy"
    })
  }
})

// POST - Tạo sản phẩm - Admin và Mod
router.post('/', checkLogin, isAdminOrMod(), async function (req, res, next) {
  try {
    // Validate input
    if (!req.body.title || !req.body.price || !req.body.category) {
      return res.status(400).json({
        message: "Vui lòng cung cấp title, price và category"
      })
    }

    let newObj = new modelProduct({
      title: req.body.title,
      slug: slugify(req.body.title, {
        replacement: '-', remove: undefined,
        locale: 'vi', trim: true
      }),
      price: req.body.price,
      description: req.body.description,
      category: req.body.category,
      images: req.body.images
    })
    await newObj.save();
    res.status(201).json(newObj)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// PUT - Cập nhật sản phẩm - Admin và Mod
router.put('/:id', checkLogin, isAdminOrMod(), async function (req, res, next) {
  let id = req.params.id;
  try {
    // Nếu có cập nhật title, cập nhật slug
    if (req.body.title) {
      req.body.slug = slugify(req.body.title, {
        replacement: '-', remove: undefined,
        locale: 'vi', trim: true
      })
    }

    let result = await modelProduct.findByIdAndUpdate(
      id, req.body, {
        new: true,
        runValidators: true
      }
    )
    
    if (!result) {
      return res.status(404).json({
        message: "ID không tìm thấy"
      })
    }

    res.json(result);
  } catch (error) {
    res.status(400).json({
      message: error.message
    })
  }
})

// DELETE - Xóa sản phẩm - Chỉ Admin
router.delete('/:id', checkLogin, isAdmin(), async function (req, res, next) {
  let id = req.params.id;
  try {
    let result = await modelProduct.findByIdAndUpdate(
      id, {
        isDeleted: true
      }, {
        new: true
      }
    )
    
    if (!result) {
      return res.status(404).json({
        message: "ID không tìm thấy"
      })
    }

    res.json(result);
  } catch (error) {
    res.status(400).json({
      message: error.message
    })
  }
})

module.exports = router;
