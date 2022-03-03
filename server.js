require('dotenv').config();
const msal = require('@azure/msal-node');

const express = require("express");
const jwt = require("jsonwebtoken");
const app = express();

const EMBED_ID = process.env.EMBED_ID;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

app.set("view engine", "html");
app.set("views", __dirname);
app.use(express.static(__dirname + "/public"));
app.engine("html", require("ejs").renderFile);

// Before running the sample, you will need to replace the values in the config,
// including the clientSecret
const config = {
  auth: {
    clientId: "d527452d-c249-47d2-9282-bbdc0a6a488b",
    authority: "https://login.microsoftonline.com/organizations",
    clientSecret: "-eP7Q~w.ctUMmkPLgTDfrSzWv-Q9f5CV6a5Rw"
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, containsPii) {
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: msal.LogLevel.Verbose,
    }
  }
};

// Create msal application object
const cca = new msal.ConfidentialClientApplication(config);

app.get("/", async (_req, res) => {
  const authCodeUrlParameters = {
    scopes: ["user.read"],
    redirectUri: "https://flatfile-app.azurewebsites.net/redirect",
  };
  // get url to sign user in and consent to scopes needed for application
  cca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
    res.redirect(response);
  }).catch((error) => console.log(JSON.stringify(error)));

  /*return res.render("index.html", {
    token: jwt.sign(
      {
        embed: EMBED_ID,
        user: {
          id: "23796",
          email: "alnoor@flatfile.io",
          name: "Alnoor Pirani",
        },
        org: {
          id: "27173",
          name: "Team Pirani",
        },
      },
      PRIVATE_KEY
    ),
  });*/
});

app.get('/redirect', (req, res) => {
  const tokenRequest = {
    code: req.query.code,
    scopes: ["user.read"],
    redirectUri: "https://flatfile-app.azurewebsites.net/redirect",
  };

  cca.acquireTokenByCode(tokenRequest).then((response) => {
    console.log("\nResponse: \n:", response);

    res.render("index.html", {
      token: jwt.sign(
        {
          embed: EMBED_ID,
          user: {
            id: response.uniqueId,
            email: response.account.username,
            name: response.account.name,
          },
          org: {
            id: response.tenantId,
            name: "AZ Finance",
          },
        },
        PRIVATE_KEY
      ),
    });
  }).catch((error) => {
    console.log(error);
    res.status(500).send(error);
  });
});

app.listen(process.env.PORT, "127.0.0.1");