var express = require('express');
var router = express.Router();
let userController = require('../controllers/users');
let jwt = require('jsonwebtoken')
let { checkLogin } = require('../utils/authHandler.js')
let bcrypt = require('bcrypt')

/* POST - Đăng ký user mới*/
router.post('/register', async function (req, res, next) {
    try {
        // Validate input
        if (!req.body.username || !req.body.password || !req.body.email) {
            return res.status(400).json({
                message: "Vui lòng cung cấp username, password và email"
            })
        }

        let newUser = await userController.CreateAnUser(
            req.body.username,
            req.body.password,
            req.body.email,
            "69a5462f086d74c9e772b804" // Default role (user)
        )
        res.status(201).json({
            message: "Đăng ký thành công"
        })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
});

/* POST - Đăng nhập */
router.post('/login', async function (req, res, next) {
    try {
        if (!req.body.username || !req.body.password) {
            return res.status(400).json({
                message: "Vui lòng cung cấp username và password"
            })
        }

        let result = await userController.QueryByUserNameAndPassword(
            req.body.username, req.body.password
        )

        if (result) {
            // Kiểm tra mật khẩu
            let isPasswordValid = await bcrypt.compare(req.body.password, result.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: "Thông tin đăng nhập không chính xác" })
            }

            let token = jwt.sign({
                id: result.id
            }, 'secret', {
                expiresIn: '1h'
            })
            res.cookie("token", token, {
                maxAge: 60 * 60 * 1000,
                httpOnly: true
            });
            res.json({
                message: "Đăng nhập thành công",
                token: token
            })
        } else {
            res.status(401).json({ message: "Thông tin đăng nhập không chính xác" })
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
});

/* GET - Lấy thông tin user đang đăng nhập */
router.get('/me', checkLogin, async function (req, res, next) {
    try {
        let getUser = await userController.FindUserById(req.userId);
        res.json(getUser);
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

/* POST - Đăng xuất */
router.post('/logout', checkLogin, function (req, res, next) {
    res.cookie('token', null, {
        maxAge: 0,
        httpOnly: true
    })
    res.json({ message: "Đăng xuất thành công" })
})




module.exports = router;
