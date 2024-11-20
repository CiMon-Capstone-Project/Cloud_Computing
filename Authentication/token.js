const admin = require('firebase-admin');

const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 'error',
                message: 'Authorization header must start with "Bearer "'
            });
        }

        const token = authHeader.split('Bearer ')[1];
        if (!token || token.trim() === '') {
            return res.status(401).json({
                status: 'error',
                message: 'Token is empty or malformed'
            });
        }

        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({
                status: 'error',
                message: 'Token has expired'
            });
        }
        console.error("Error verifying token:", error.message);
        res.status(401).json({
            status: "error",
            message: 'Invalid or expired token'
        });
    }
};

module.exports = { verifyToken };
