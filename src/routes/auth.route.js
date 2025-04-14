require("dotenv").config();
const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const authService = require("../service/Auth.service");
const logger = require("../config/winston.config.js");

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
 const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const frontendUrl = process.env.FRONTEND_URL  ;

router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/auth/google/redirect",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${frontendUrl}/login`,
  }),
  async (req, res) => {
    try {
      const user = req.user;
      console.log(user)
      const email = user.emails?.[0]?.value;
      const userDataFromDB = await authService.findUser(email);

      let userId;
      if (!userDataFromDB) {
        const newUser = await authService.createUser(
          user.name.givenName || user.displayName,
          user.name.familyName || user.displayName,
          email,
          null
        );
        userId = newUser.userId;
      } else {
        userId = userDataFromDB.userId;
      }

      let claims = {
        userId,
        userEmail: email,
      };




      const redirectUrl = `${frontendUrl}/dashboard`

      let accessToken  = jwt.sign(claims, accessTokenSecret, {
          expiresIn: '1m',
        });
      claims = {...claims }


      const refreshToken = jwt.sign(claims, refreshTokenSecret, {
        expiresIn: "15m",
      });

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.cookie("userId", userId)

      res.redirect(redirectUrl);
    } catch (err) {
      console.error("Authentication Error:", err);
      res.redirect(`${frontendUrl}/signin`);
    }
  }
);

router.get(
  "/auth/microsoft",
  passport.authenticate("microsoft", {
    scope: ["openid", "profile", "email", "user.read"],
    session: false,
  })
);

router.get(
  "/auth/microsoft/redirect",
  passport.authenticate("microsoft", {
    session: false,
    failureRedirect: `${frontendUrl}/login`,
  }),
  async (req, res) => {
    try {
      const user = req.user;
      const email = user.emails?.[0]?.value;
      const userDataFromDB = await authService.findUser(email);

      let userId;
      if (!userDataFromDB) {
        const newUser = await authService.createUser(
            user.name.givenName || user.displayName,
            user.name.familyName || user.displayName,
            email,
            null
        );
        userId = newUser.userId;
      } else {
        userId = userDataFromDB.userId;
      }

      let claims = {
        userId,
        userEmail: email,
      };




      const redirectUrl = `${frontendUrl}/dashboard`

      let accessToken  = jwt.sign(claims, accessTokenSecret, {
        expiresIn: '1m',
      });
      claims = {...claims }


      const refreshToken = jwt.sign(claims, refreshTokenSecret, {
        expiresIn: "15m",
      });

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.cookie("userId")

      res.redirect(redirectUrl);
    } catch (err) {
      console.error("Authentication Error:", err);
      res.redirect(`${frontendUrl}/signin`);
    }
  }
);



router.post("/auth/refresh-token", (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(403).json({ error: "Refresh token is missing" });
  }

  jwt.verify(refreshToken, refreshTokenSecret, (err, decoded) => {
    if (err) {
      return res
          .status(403)
          .json({ error: "Invalid or expired refresh token" });
    }

    const newAccessToken = jwt.sign(
        {
          userId: decoded.userId,
          userEmail: decoded.userEmail,
        },
        accessTokenSecret,
        { expiresIn: "1m" }
    );

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });


    res.json({ accessToken: newAccessToken,   });
  });
});

router.get("/auth/logout", (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.redirect(`${frontendUrl}/signin`);
});



module.exports = router;
