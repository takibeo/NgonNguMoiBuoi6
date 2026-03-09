let jwt = require('jsonwebtoken')
let userController = require('../controllers/users')

module.exports = {
    checkLogin: async function (req, res, next) {
        try {
            let token
            if (req.cookies.token) {
                token = req.cookies.token
            } else {
                token = req.headers.authorization;
                if (!token || !token.startsWith("Bearer")) {
                    res.status(403).json({ message: "Bạn chưa đăng nhập" })
                    return;
                }
                token = token.split(' ')[1];
            }
            let result = jwt.verify(token, 'secret');
            if (result && result.exp * 1000 > Date.now()) {
                req.userId = result.id;
                next();
            } else {
                res.status(403).json({ message: "Token hết hạn hoặc không hợp lệ" })
            }
        } catch (error) {
            res.status(403).json({ message: "Bạn chưa đăng nhập" })
        }
    },

    checkRole: function (...requiredRole) {
        return async function (req, res, next) {
            try {
                let userId = req.userId;
                let user = await userController.FindUserById(userId);
                if (!user) {
                    return res.status(404).json({ message: "Người dùng không tồn tại" });
                }
                let currentRole = user.role.name;
                if (requiredRole.includes(currentRole)) {
                    next();
                } else {
                    res.status(403).json({ message: "Bạn không có quyền truy cập tài nguyên này" });
                }
            } catch (error) {
                res.status(403).json({ message: "Lỗi kiểm tra quyền" })
            }
        }
    },

    // Middleware kiểm tra role bao gồm cả admin
    isAdmin: function () {
        return async function (req, res, next) {
            try {
                let userId = req.userId;
                let user = await userController.FindUserById(userId);
                if (!user) {
                    return res.status(404).json({ message: "Người dùng không tồn tại" });
                }
                if (user.role.name === "ADMIN") {
                    next();
                } else {
                    res.status(403).json({ message: "Chỉ admin mới có quyền thực hiện hành động này" });
                }
            } catch (error) {
                res.status(403).json({ message: "Lỗi kiểm tra quyền" })
            }
        }
    },

    // Middleware cho phép admin và mod
    isAdminOrMod: function () {
        return async function (req, res, next) {
            try {
                let userId = req.userId;
                let user = await userController.FindUserById(userId);
                if (!user) {
                    return res.status(404).json({ message: "Người dùng không tồn tại" });
                }
                if (["ADMIN", "MODERATOR"].includes(user.role.name)) {
                    next();
                } else {
                    res.status(403).json({ message: "Chỉ admin và mod mới có quyền thực hiện hành động này" });
                }
            } catch (error) {
                res.status(403).json({ message: "Lỗi kiểm tra quyền" })
            }
        }
    }
}