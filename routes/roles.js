var express = require("express");
var router = express.Router();

let roleModel = require("../schemas/roles");
let { checkLogin, isAdmin, isAdminOrMod } = require('../utils/authHandler.js')

// GET - Lấy danh sách role - Admin và Mod
router.get("/", checkLogin, isAdminOrMod(), async function (req, res, next) {
    try {
        let roles = await roleModel.find({ isDeleted: false });
        res.json(roles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET - Lấy role theo id - Admin và Mod
router.get("/:id", checkLogin, isAdminOrMod(), async function (req, res, next) {
    try {
        let result = await roleModel.findOne({ _id: req.params.id, isDeleted: false });
        if (result) {
            res.json(result);
        }
        else {
            res.status(404).json({ message: "ID không tìm thấy" });
        }
    } catch (error) {
        res.status(404).json({ message: "ID không tìm thấy" });
    }
});

// POST - Tạo role mới - Chỉ admin
router.post("/", checkLogin, isAdmin(), async function (req, res, next) {
    try {
        let newItem = new roleModel({
            name: req.body.name,
            description: req.body.description
        });
        await newItem.save();
        res.status(201).json(newItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT - Cập nhật role - Chỉ admin
router.put("/:id", checkLogin, isAdmin(), async function (req, res, next) {
    try {
        let id = req.params.id;
        let updatedItem = await roleModel.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedItem) {
            return res.status(404).json({ message: "ID không tìm thấy" });
        }
        res.json(updatedItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE - Xóa role - Chỉ admin
router.delete("/:id", checkLogin, isAdmin(), async function (req, res, next) {
    try {
        let id = req.params.id;
        let updatedItem = await roleModel.findByIdAndUpdate(
            id,
            { isDeleted: true },
            { new: true }
        );
        if (!updatedItem) {
            return res.status(404).json({ message: "ID không tìm thấy" });
        }
        res.json(updatedItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;