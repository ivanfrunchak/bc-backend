import jwt from "jsonwebtoken";

const config = process.env;

export const verifyToken = (req, res, next) => {
	const token = req.headers["x-access-token"];

	if (req.path == '/login' || req.path == '/register' || req.path == '/bought') {
		return next();
	}
	if (!token) {
		return res.status(403).send("A token is required for authentication");
	}
	try {
		const decoded = jwt.verify(token, config.TOKEN_KEY);
		req.user = decoded;
	} catch (err) {
		return res.status(401).send("Invalid Token");
	}
	return next();
};

export const verifyAdmin = (req, res, next) => {
	const token = req.headers["x-access-token"];

	if (!token) {
		return res.status(403).json({
			result: false,
			payload: "A token is required for authentication"
		});
	}
	try {
		
		const decoded = jwt.verify(token, config.TOKEN_KEY);
		req.user = decoded;
		if (!req.user.is_admin) {
			return res.status(403).json({
				result: false,
				payload: "You are not administrator"
			});
		}
	} catch (err) {
		// console.log('ERR', err);
		return res.status(401).json({
			result: false,
			payload: "Invalid token"
		});
	}
	return next();
};
