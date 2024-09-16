const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];  

  if (token == null) {
    console.log('Token non fourni');
    return res.sendStatus(401); 
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ message: 'Token expiré' });
      }
      console.log('Token invalide:', err);
      return res.sendStatus(403);
    }
  
    req.user = user;
    next(); 
  });
}  


module.exports = authenticateToken;
