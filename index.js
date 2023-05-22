const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { google } = require("googleapis");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const uri =
  "mongodb+srv://umairathar0007:umair1122@cluster0.1e9myr5.mongodb.net/?retryWrites=true&w=majority";

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Successfully connected to MongoDB"))
  .catch((error) => console.error("Unable to connect to MongoDB", error));

const reviewSchema = new mongoose.Schema({
  reviewId: String,
  reviewer: Object,
  starRating: String,
  comment: String,
  createTime: String,
  updateTime: String,
  name: String,
  reviewReply: Object,
});

const Review = mongoose.model("Review", reviewSchema);

const oauth2Client = new google.auth.OAuth2(
  "488667876016-0abibhoju4fq25nakjvu2c9gtea829qs.apps.googleusercontent.com",
  "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",
  `${process.env.SERVER_URL}/oauth2callback`
);

const app = express();

app.use(cors());

app.get("/auth", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/business.manage"],
  });
  res.status(200).json({ url });
});

app.get("/oauth2callback", async (req, res) => {
  const { code } = req.query;
  const tokenResponse = await oauth2Client.getToken(code);
  tokens = tokenResponse.tokens;

  oauth2Client.setCredentials(tokens);

  res.redirect(`${process.env.SERVER_URL}/get-reviews`);
});

app.get("/get-account-id", async (req, res) => {
  if (!oauth2Client.credentials) {
    return res.status(401).send("Not authenticated");
  }

  try {
    const response = await axios.get(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      {
        headers: {
          Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
        },
      }
    );
    res.status(200).json(response.data);
  } catch (error) {
    console.error(JSON.stringify(error));
    res.status(500).send("An error occurred while fetching the accounts.");
  }
});

app.get("/get-location-id", async (req, res) => {
  if (!oauth2Client.credentials) {
    return res.status(401).send("Not authenticated");
  }

  try {
    const response = await axios.get(
      `https://mybusinessaccountmanagement.googleapis.com/v1/accounts/114716129450678632365/locations?readMask=name`,
      {
        headers: {
          Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
        },
      }
    );
    res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while fetching the locations.");
  }
});

app.get("/get-reviews", async (req, res) => {
  if (!oauth2Client.credentials) {
    return res.status(401).send("Not authenticated");
  }

  try {
    const response = await axios.get(
      `https://mybusinessaccountmanagement.googleapis.com/v4/accounts/114716129450678632365/locations/6822049341841245270/reviews`,
      {
        headers: {
          Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
        },
      }
    );
    await Review.deleteMany({});

    const reviews = response.data.reviews.map((review) => ({
      ...review,
      translated: false,
    }));
    await Review.insertMany(reviews);

    res.redirect(`${process.env.REVIEWS_REDIRECT_URL}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while fetching the reviews.");
  }
});

app.get("/reviews", async (req, res) => {
  try {
    const reviews = await Review.find({});
    res.status(200).json(reviews);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send("An error occurred while fetching the reviews from the database.");
  }
});

app.listen(8000, () => {
  console.log(`Server is running!`);
});
