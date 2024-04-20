const express = require("express");
const router = express.Router();
const createStripe = require("stripe");

/* Votre clé privée doit être indiquée ici */
const stripe = createStripe(process.env.STRIPE_API_SECRET);

router.post("/payment", async (req, res) => {
  console.log(req.body);
  try {
    // on envoie le token a Stripe avec le montant
    let { status } = await stripe.charges.create({
      // Montant de la transaction
      amount: (req.body.amount * 100).toFixed(0),
      // Devise de la transaction
      currency: "eur",
      // Description du produit
      description: `Paiement vinted pour : ${req.body.title}`,
      source: req.body.token,
    });
    // Le paiement a fonctionné
    // On peut mettre à jour la base de données
    // On renvoie une réponse au client pour afficher un message de statut
    res.status(201).json("Payment validé");
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
