const express = require("express");
const fetch = require("node-fetch");
const { google } = require("googleapis");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ENV của Render
const serviceAccount = {
  client_email: process.env.CLIENT_EMAIL,
  private_key: process.env.PRIVATE_KEY.replace(/\\n/g, "\n"),
  project_id: process.env.PROJECT_ID,
};

async function getAccessToken() {
  const jwtClient = new google.auth.JWT(
    serviceAccount.client_email,
    null,
    serviceAccount.private_key,
    ["https://www.googleapis.com/auth/firebase.messaging"],
    null
  );

  const tokens = await jwtClient.authorize();
  return tokens.access_token;
}

app.post("/send-noti", async (req, res) => {
  try {
    const { title, body, tokens, data } = req.body;
    const accessToken = await getAccessToken();

    const results = [];

    for (const tk of tokens) {
      const message = {
        message: {
          token: tk,
          notification: { title, body },
          data,
        },
      };

      const response = await fetch(
        `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + accessToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(message),
        }
      );

      results.push(await response.json());
    }

    res.json(results);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error sending notification");
  }
});


app.listen(3000, () => console.log("Server running"));
