const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Boilerplate JWT verifier untuk dipakai anggota lain nanti
    next();
};

module.exports = { verifyToken };