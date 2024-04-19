require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

app.use(cors());
app.use(express.json());
console.log(process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Les modèles:
const User = require("./models/User");
const Offer = require("./models/Offer");

//Import des routes user
const userRoutes = require("./routes/user");
app.use(userRoutes);

const offerRoutes = require("./routes/offer");
app.use(offerRoutes);

app.get("/", (req, res) => {
  try {
    return res.status(200).json("Bienvenue sur Vinted");
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});
// app.post("/upload" , isAuthenticated, fileUpload(), async(req, res)=>{
//     try {
//         // console.log(req.body);
//         // console.log(req.files);
//         // console.log(convertToBase64(req.files.picture))
//         console.log(req.headers.authorization.replace("Bearer", ""));
//         const result=await cloudinary.uploader.upload(convertToBase64(req.files.picture));
//         // console.log(result);
//         console.log(req.user);
//         res.json("ok");
//     } catch (error) {
//         res.status(400).json({error:error.message})
//     }
// })

app.all("*", (req, res) => {
  return res.status(404).json("Not found");
});

app.listen(process.env.PORT, () => {
  console.log("Serveur on fire 🔥🔥🔥🔥🔥🔥");
});
