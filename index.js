require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

const fileUpload = require("express-fileupload");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

app.use(cors());
app.use(express.json());
//console.log(process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
/*app.get("/", (req, res) => {
    try {
        return res.status(200).json("Bienvenue sur Vinted");
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }

});*/ // c'est ok

// les modèles:

const User = mongoose.model("User", {
    email: String,
    account: {
        username: String,
        avatar: Object,
    },
    newsletter: Boolean,
    token: String,
    hash: String,
    salt: String,
});

const Offer = mongoose.model("Offer", {
    product_name: String,
    product_description: String,
    product_price: Number,
    product_details: Array,
    product_image: Object,
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
});

//SIGNUP
app.post("/user/signup", async (req, res) => {

    try {

        //on met en place des conditions pour gérer les erreurs.
        //si l'une de ces 3 conditions ne passent pas on ne va pas plus loin.(le username n'est pas renseigné).
        if (!req.body.username || !req.body.email || !req.body.password) { //si falsy
            return res.status(400).json("Missing parameters");
        }
        //l'email renseigné lors de l'inscription existe déjà dans la base de données
        const existingUser = await User.findOne({ email: req.body.email });
        if (!existingUser) { // si falsy
            //console.log(req.body); //ok 
            // destructuring
            const { username, email, password, newsletter } = req.body;
            //on attend une réponse avec un id ,token de l'utilisateur ainsi que son username pris dans l'account.
            //on s'occupe de la partie hachage avec salt, hash et token.
            const salt = uid2(16);
            //formule magique
            const hash = SHA256(req.body.password + salt).toString(encBase64);
            const token = uid2(32);//GzSn0TZT88_oqSPI-jSCzG6NX77Y0Kqv
            //console.log(token, salt);
            //on cherche les infos du boby email, account(username),
            //newsletter,token, hash salt.
            //on aura aussi un _id: new ObjectId (automatique).

            const newUser = new User({
                email: req.body.email,
                account: {
                    username: req.body.username,
                },
                newsletter: req.body.newsletter,
                token: token,
                hash: hash,
                salt: salt,
            });

            //console.log(newUser); //vérif si l'on a bien les infos.ok. 
            //on save notre newUser
            await newUser.save();
            //réponse que l'on doit recevoir, donc seulement le token,
            //l'account(username).

            const responseObject = {
                _id: newUser._id,
                token: newUser.token,
                account: {
                    username: newUser.account.username,
                },
            };

            // revoi la réponse
            return res.status(201).json(responseObject);
        } else {
            return res.status(409).json("Cet email est déjà utilisé");
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//LOGIN
app.post("/user/login", async (req, res) => {
    try {

        //console.log(req.body);//ok email & password
        // je  récupére le salt et la hash du user correspondant au mail :
        //je cherche un utilisateur dont la clé email correspond à l'email que j'ai reçu.
        const userFound = await User.findOne({ email: req.body.email });
        //console.log(userFound);//vérif de l'obet 
        // on fait une condition pour savoir si c'est bien le bon user sinon pas la même de continuer.
        //si il existe je continue sinon erreur.
        if (userFound) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // on va rajoute le salt récupéré dans la BDD, et hash le tout, puis comparer le nouveau hash généré avec celui enregistré en BDD

        const newHash = SHA256(req.body.password + userFound.salt).toString(encBase64);

        //soit le newhash et le même et je continue soit je stop.
        if (newHash === userFound.hash) {
            // si égal alors le password est bon.
            const responseObject = {
                _id: userFound._id,
                token: userFound.token,
                account: {
                    username: userFound.account.username,
                },
            };
            return res.status(200).json(responseObject);
        } else {
            return res.status(401).json({ error: "Unauthorized" });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

const isAuthenticated = async (req, res, next) => {
    //console.log("ok");
    //console.log(req.headers.authorization);// ok
    try {
        //on vérifie sinon on renvoi un message d'erreur.
        if (!req.headers.authorization) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const token = req.headers.authorization.replace("Bearer ", "");
        //console.log(token);
        const user = await User.findOne({ token: token }).select("account _ids");//impact la route mais pas la bse de donnée.
        //console.log(user);

        if (user === null) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const convertToBase64 = (file) => {
    return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

//POSTER UNE ANNONCE
app.post("/offer/publish", isAuthenticated, fileUpload(), async (req, res) => {

    try {
        //console.log(req.headers.authorization);
        //destructuring
        const { description, price, condition, city, brand, size, color, title } = req.body;
        const picture = req.files.picture;
        //console.log(req.body);//ok 
        //console.log(req.files);

        const newOffer = new Offer({
            product_name: title,
            product_description: description,
            product_price: price,
            product_details: [
                {
                    MARQUE: brand,
                },
                {
                    TAILLE: size,
                },
                {
                    ÉTAT: condition,
                },
                {
                    COULEUR: color,
                },
                {
                    EMPLACEMENT: city,
                },
            ],
            owner: req.user, //_id mongo comprends que c'est le  même id utilisateur même sans _id
        });
        //console.log(newOffer);//je vérifie si j'ai toutes les clés/mais attention car du coup on a le hash et salt.
        //du coup on va utiliser select() dans cont isAuthentification
        //pour préciser qu'on ne veut des certains élements.
        // on covert l'image en base 64


        const result = await cloudinary.uploader.upload(convertToBase64(req.files.picture));
        newOffer.product_image = result;
        //console.log(result);
        await newOffer.save();
        res.status(201).json(newOffer);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }

});

app.get("/offers", async (req, res) => {
    try {
        //console.log(req.query);
        // const title = req.query.title;
        const { title, priceMin, priceMax, sort, page } = req.query;
        // console.log(priceMin);

        const filters = {
            // product_name: new RegExp(title, "i"),
            // product_price: { $gte: priceMin },
        };

        if (title) {
            filters.product_name = new RegExp(title, "i");
        }

        if (priceMin) {
            filters.product_price = { $gte: priceMin };
            // console.log(filters);
        }

        if (priceMax) {
            if (priceMin) {
                filters.product_price.$lte = priceMax;
            } else {
                filters.product_price = { $lte: priceMax };
            }

            // console.log(filters);
        }

        const sorter = {};

        if (sort === "price-asc") {
            sorter.product_price = "asc";
        } else if (sort === "price-desc") {
            sorter.product_price = "desc";
        }

        let skip = 0;

        // 5 résultats par page. Page 1 => skip = 0 ;;;;;; Page 2 => skip = 5 ;;;;;;; Page 3 => skip = 10
        // 3 résultats par page. Page 1 => skip = 0 ;;;;;; Page 2 => skip = 3 ;;;;;;; Page 3 => skip = 6

        if (page) {
            skip = (page - 1) * 5;
        }
        // console.log(skip);

        console.log(filters);
        // console.log(sorter);
        const offers = await Offer.find(filters)
            .sort(sorter)
            .skip(skip)
            .limit(5)
            .populate("owner", "account");
        // .select("product_name product_price");

        const count = await Offer.countDocuments(filters);
        // const count = result.length;

        res.json({
            count: count,
            offers: offers,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get("/offers/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const offer = await Offer.findById(id).populate("owner", "account");
        res.json(offer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.all("*", (req, res) => {
    return res.status(404).json("Not found");
});

app.listen(process.env.PORT, () => {
    console.log("Serveur on fire 🔥🔥🔥🔥🔥🔥");
});