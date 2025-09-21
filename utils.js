import jwt from "jsonwebtoken";

// Generate JWT Token
export const generateToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    },
    process.env.JWT_SECRET || "secret", 
    {
      expiresIn: "30d",
    }
  );
};

// Auth Middleware (protect routes)
export const isAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7); // remove "Bearer "
    jwt.verify(token, process.env.JWT_SECRET || "secret", (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid Token" });
      }
      req.user = decoded;
      next();
    });
  } else {
    res.status(401).json({ message: "No Token Provided" });
  }
};

//  Admin Middleware (only admin access)
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: "Admin access denied" });
  }
};

export { isAuth as protect };
