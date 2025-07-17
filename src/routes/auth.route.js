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
  "/auth/google",  (req, res, next) => {
      // passport.authenticate("google", {
      //   scope: ["profile", "email"],
      //   session: false,
      // })
      const redirect = req.query.redirectUri || `${frontendUrl}/dashboard`;

      console.log("Redirect URL :: " + redirect);

      res.cookie("postAuthRedirect", redirect, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "None",
        maxAge: 30 * 60 * 1000, // optional: 5 mins
      });

      passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false,
      })(req, res, next);
    }
);

router.get(
  "/auth/google/redirect",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${frontendUrl}/signin`,
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
          user.name.familyName || '',
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


      console.log("Redirect URL :: "+req.cookies?.postAuthRedirect)

      const redirectUrl =  req.cookies?.postAuthRedirect || `${frontendUrl}/dashboard`;

      let accessToken  = jwt.sign(claims, accessTokenSecret, {
          expiresIn: '30m',
        });
      claims = {...claims }


      const refreshToken = jwt.sign(claims, refreshTokenSecret, {
        expiresIn: "60m",
      });

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "None",
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "None",
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

    (req, res, next) => {
      // passport.authenticate("google", {
      //   scope: ["profile", "email"],
      //   session: false,
      // })
      const redirect = req.query.redirectUri || `${frontendUrl}/dashboard`;

      console.log("Redirect URL :: " + redirect);

      res.cookie("postAuthRedirect", redirect, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "None",
        maxAge: 5 * 60 * 1000, // optional: 5 mins
      });

      passport.authenticate("microsoft", {
        scope: ["openid", "profile", "email", "user.read"],
        session: false,
      })(req, res, next);
    }
  // passport.authenticate("microsoft", {
  //   scope: ["openid", "profile", "email", "user.read"],
  //   session: false,
  // })
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
            user.name.familyName || '',
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




      console.log("Redirect URL :: "+req.cookies?.postAuthRedirect)

      const redirectUrl =  req.cookies?.postAuthRedirect || `${frontendUrl}/dashboard`;

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
        sameSite: "None",
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "None",
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
        { expiresIn: "30m" }
    );

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
    });


    res.json({ accessToken: newAccessToken,   });
  });
});

router.get("/auth/logout", (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "None",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "None",
  });
  res.redirect(`${frontendUrl}/signin`);
});



module.exports = router;
