const express = require ('express');
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload");
const Offer =require ("../models/Offer");
const isAuthenticated=require("../middlewares/isAuthenticated");
const convertToBase64 = (file) => {
    return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};


//POSTER UNE ANNONCE
router.post("/offer/publish", isAuthenticated, fileUpload(), async (req, res) => {

    try {
        // console.log(req.body);
        // console.log(req.files);
        // console.log(req.headers.authorization);
        //destructuring
        const { title ,description, price, condition, city, brand, size, color } = req.body;
        const picture = req.files.picture;

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
        // console.log(newOffer);//je vérifie si j'ai toutes les clés/mais attention car du coup on a le hash et salt.
        //du coup on va utiliser select() dans const isAuthentification
        //pour préciser qu'on ne veut de certains élements.
        // on covert l'image en base 64.


        const result = await cloudinary.uploader.upload(convertToBase64(req.files.picture));
        newOffer.product_image = result;
        // console.log(result);
        await newOffer.save();
        // console.log(newOffer);
        res.status(201).json(newOffer);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }

});

router.get("/offer", async (req, res) => {
    try {
        //console.log(req.query);
        // const title = req.query.title;
        const { title, priceMin, priceMax} = req.query;

        const filters = {};

          if (title) {
            filters.product_name = new RegExp(title, "i");
        }

        if (priceMin) {
            filters.product_price = { $gte: Number(priceMin)};
        }  

         if (priceMax) {
            if(filters.product_price){
                filters.product_price.$lte = Number(priceMax);

            } else {
                filters.product_price = { $lte: Number(priceMax) };
            }
         }

        //  console.log(filters.product_price);

         const sort = {};
         if (req.query.sort === "price-desc") {
                 sort.product_price = "desc"; //-1
         
       } else if (req.query.sort === "price-asc") {
            sort.product_price = "asc"; // 1 
         }

let limit =10;
if(req.query.limit){
    page=req.query.limit;
}
let page =1;

if(req.query.page){
    page=req.query.page;
}
const skip = (page -1) * limit;

        const results= await Offer.find(filters)
        .sort(sort)
        .skip(skip)
        .limit(limit)
       
        const count = await Offer.countDocuments(filters);

        res.json({count: count, offers:results});
      
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get("/offer/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const offer = await Offer.findById(id).populate("owner", "account");
        res.json(offer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



module.exports = router;