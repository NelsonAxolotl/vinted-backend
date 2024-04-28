const express = require("express");
const router = express.Router();
const createStripe = require("stripe");

/* Votre clé privée doit être indiquée ici */
const stripe = createStripe(process.env.STRIPE_API_SECRET);

router.post("/payment", async (req, res) => {
  console.log(req.body);
  try {
    // on envoie le token a Stripe avec le montant
    const paymentIntent = await stripe.paymentIntents.create({
      // Montant de la transaction
      amount: (req.body.amount * 100).toFixed(0),
      // Devise de la transaction
      currency: "eur",
      // Description du produit
      description: `Paiement vinted pour : ${req.body.title}`,
    });
    // Le paiement a fonctionné
    // On peut mettre à jour la base de données
    // On renvoie une réponse au client pour afficher un message de statut
    // Si la confirmation du paiement est réussie
    // if (paymentIntent.status === "succeeded") {
    //   // Mettre à jour la base de données si nécessaire
    //   // Renvoyer une réponse au client avec le statut de réussite
    //   res.status(200).json({ message: "Paiement réussi", status: "succeeded" });
    // } else {
    //   // Si la confirmation du paiement échoue, renvoyer une réponse avec le statut correspondant
    //   res.status(400).json({ message: "Échec de la confirmation du paiement", status: "failed" });
    // }
    res.json(paymentIntent);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

// if (paymentIntent.status === "requires_payment_method") {
//   // Si le paiement nécessite une méthode de paiement supplémentaire
//   res.status(400).json({
//     message: "Échec de la confirmation du paiement",
//     status: "requires_payment_method",
//   });
// } else if (paymentIntent.status === "succeeded") {
//   // Si le paiement a réussi
//   res.status(200).json({
//     message: "Paiement réussi",
//     status: "succeeded",
//     paymentIntentId: paymentIntent.id,
//   });
// } else {
//   // Gérer d'autres états de paymentIntent ici si nécessaire
//   res.status(400).json({
//     message: "Échec de la confirmation du paiement",
//     status: "failed",
//   });
// }
// } catch (error) {
// console.log(error.message);
// res
//   .status(500)
//   .json({
//     message: "Erreur lors du traitement du paiement",
//     error: error.message,
//   });
// }
// });
