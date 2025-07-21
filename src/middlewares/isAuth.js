const jwt = require('jsonwebtoken');

const isAuthenticated = (req, res, next) => {
    try {
        // Check for the authorization header
        const authHeader = req.headers.authorization;
        if(!authHeader) {
            return res.status(401).json({message: 'Authentication failed: Authorization header missing'});
        }

        const token = authHeader.split(' ')[1];
        if(!token) {
            return res.status(401).json({message: 'Authentication failed: Token missing'});
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if(!decoded) {
            return res.staus(401).json({message: 'Authentication failed: Token verification failed'});
        }

        // this req.user i can change it to req.admin depending on who i want to have access to certain routes in the application
        req.user = decoded;
        next();

    } catch (error) {
        console.log('Authentication Error:', error);
        return res.status(401).json({message: 'Internal Server Error'});
    }
}

module.exports = { isAuthenticated };