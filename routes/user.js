const express = require("express");
const router=express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const User=require("../models/User");


//SIGNUP
router.post("/user/signup",  async (req, res) => {

    try {
        console.log(req.body);
        const { username, email, password, newsletter } = req.body; // destructuring
        if (!username || !email || !password) { 
            return res.status(400).json("Missing parameters");
        }
        //l'email renseigné lors de l'inscription existe déjà dans la base de données
        const existingUser = await User.findOne({ email: email });
        if (!existingUser) { 
            //on attend une réponse avec un id ,token de l'utilisateur ainsi que son username pris dans l'account.
            //on s'occupe de la partie hachage avec salt, hash et token.
            const salt = uid2(16);
            //formule magique
            const hash = SHA256(password + salt).toString(encBase64);
            const token = uid2(64);
            // console.log(token, salt);
            console.log(hash);
            //on cherche les infos du boby email, account(username), newsletter,token, hash salt.
            //on aura aussi un _id: new ObjectId (automatique).

            const newUser = new User({
                email: email,
                account: {
                    username: username,
                },
                newsletter: newsletter,
                token: token,
                hash: hash,
                salt: salt,
            });

            // console.log(newUser); //vérif si l'on a bien les infos. 
            //on save notre newUser
            await newUser.save();
            //réponse que l'on doit recevoir, donc seulement le token, l'account(username).
        
            const responseObject = {
                _id: newUser._id,
                token: newUser.token,
                account: {
                    username: newUser.account.username,
                },
            };
            return res.status(201).json(responseObject);

        } else {
            return res.status(409).json("Cet email est déjà utilisé");
        }
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
});


//LOGIN
router.post("/user/login", async (req, res) => {
    try {

        console.log(req.body);
        // je  récupére le salt et la hash du user correspondant au mail :
        //je cherche un utilisateur dont la clé email correspond à l'email que j'ai reçu.
        const userFound = await User.findOne({ email: req.body.email });
        // console.log(userFound);//vérif de l'objet .
        // on fait une condition pour savoir si c'est bien le bon user (email) sinon pas la peine de continuer.
        //si il existe je continue sinon erreur.
        if (!userFound) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // on va rajouter le salt récupéré dans la BDD, et hash le tout, puis comparer le nouveau hash généré avec celui enregistré en BDD.

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
        return res.status(400).json({ message: error.message });
    }
});

module.exports =router;