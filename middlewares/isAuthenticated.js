const User =require("../models/User");
const Offer =require("../models/Offer");

const isAuthenticated = async (req, res, next) => {
    // console.log("ok");
    //console.log(req.headers.authorization);// ok
    try {
        //on vérifie sinon on renvoi un message d'erreur.
        if (!req.headers.authorization) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const token = req.headers.authorization.replace("Bearer ", "");
        //console.log(token);
        const user = await User.findOne({ token: token }).select("account _ids");//impact la route mais pas la base de donnée.
        // console.log(user);

        if (user === null) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports=isAuthenticated; 