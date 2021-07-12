const cors = require("cors");
const express = require("express");
const uuid = require("uuid");
const dotenv = require("dotenv");

// load environment variables
dotenv.config();

//stripe secret key
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();

// middleware
app.use(express.json());
app.use(cors());

// routes
app.get("/", (req, res) => {
  res.send("Sever up and running!");
});

app.get("/ping", (req, res) => {
  res.send({
    message: "pong",
  });
});

// payment route
app.post("/payment", (req, res) => {
  const { product, token } = req.body;
  console.log("PRODUCT : ", product);
  console.log("PRICE : ", product.price);
  const idempotencyKey = uuid.v4();

  return stripe.customers
    .create({
      email: token.email,
      source: token.id,
    })
    .then((customer) => {
      console.log("Customer : ", customer);
      console.log("Token : ", token);

      stripe.charges
        .create(
          {
            amount: product.price * 100, // stripe process amounts in cent
            currency: "usd",
            customer: customer.id,
            description: `Payment for ${product.name}`,
            receipt_email: token.email,
            shipping: {
              name: token.card.name,
              address: {
                country: token.card.address_country,
                line1: token.card.address_line1,
              },
            },
          },
          { idempotencyKey }
        )
        .then((charge) => console.log("Charge info : ", charge))
        .catch((err) => console.log("Error : ", err));
    })
    .then((result) => res.status(200).json(result))
    .catch((err) => console.log(err));
});

app.listen(8080, () => console.log("Server started on http://localhost:8080"));
