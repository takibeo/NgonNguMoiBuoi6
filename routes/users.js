var express = require("express");
var router = express.Router();
let { postUserValidator, validateResult } = require('../utils/validatorHandler')
let userController = require('../controllers/users')

let { checkLogin, checkRole, isAdmin, isAdminOrMod } = require('../utils/authHandler.js')


let userModel = require("../schemas/users");

// GET - Lấy danh sách user - Admin và Mod
router.get("/", checkLogin, isAdminOrMod(), async function (req, res, next) {
    try {
        let users = await userModel
            .find({ isDeleted: false })
            .populate({
                'path': 'role',
                'select': "name"
            })
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET - Lấy thông tin user theo id - checkLogin
router.get("/:id", checkLogin, async function (req, res, next) {
    try {
        let result = await userModel
            .findOne({ _id: req.params.id, isDeleted: false })
            .populate('role')
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

// POST - Tạo user mới - Chỉ admin
router.post("/", checkLogin, isAdmin(), postUserValidator, validateResult,
    async function (req, res, next) {
        try {
            let newItem = await userController.CreateAnUser(
                req.body.username,
                req.body.password,
                req.body.email,
                req.body.role
            )
            let saved = await userModel
                .findById(newItem._id)
                .populate('role')
            res.status(201).json(saved);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    });

// PUT - Cập nhật user - Chỉ admin
router.put("/:id", checkLogin, isAdmin(), async function (req, res, next) {
    try {
        let id = req.params.id;
        let updatedItem = await userModel.findById(id);
        if (!updatedItem) {
            return res.status(404).json({ message: "ID không tìm thấy" });
        }
        for (const key of Object.keys(req.body)) {
            // Không cho phép update password qua endpoint này
            if (key !== 'password') {
                updatedItem[key] = req.body[key];
            }
        }
        await updatedItem.save();

        let populated = await userModel
            .findById(updatedItem._id)
            .populate('role')
        res.json(populated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE - Xóa user - Chỉ admin
router.delete("/:id", checkLogin, isAdmin(), async function (req, res, next) {
    try {
        let id = req.params.id;
        let updatedItem = await userModel.findByIdAndUpdate(
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

// POST - Đổi mật khẩu - All login user
router.post("/change-password/:id", checkLogin, async function (req, res, next) {
    try {
        let userId = req.params.id;
        
        // Kiểm tra người dùng chỉ có thể đổi mật khẩu của chính mình (trừ admin)
        let user = await userController.FindUserById(req.userId);
        if (userId !== req.userId && user.role.name !== "ADMIN") {
            return res.status(403).json({ message: "Bạn chỉ có thể đổi mật khẩu của chính mình" });
        }

        let { oldPassword, newPassword } = req.body;
        
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: "Vui lòng cung cấp mật khẩu cũ và mật khẩu mới" });
        }

        let result = await userController.ChangePassword(userId, oldPassword, newPassword);
        
        if (result.success) {
            res.json({ message: result.message });
        } else {
            res.status(400).json({ message: result.message });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;