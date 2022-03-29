const { redirectSpotifyLogin } = require('../api/spotify-calls');
const router = require("express").Router();
const isLoggedIn = require('../middleware/isLoggedIn')
const Link = require('../models/Link.model')

router.get("/", (req, res, next) => {
  res.render("settings/settings");
});

router.get("/import", isLoggedIn, (req, res, next) => {
  res.render("settings/import");
});

router.get("/library", isLoggedIn, async (req, res, next) => {
  try {
    const tracklist = await Link.find({ userId: req.userId }).populate('trackId');
    res.render("settings/library", tracklist);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.post("/library/create", isLoggedIn, (req, res, next) => {
  const { mySongs, myPlaylists, spotifyPlaylist } = req.body;
  if (mySongs != 'on' && myPlaylists != 'on' && spotifyPlaylist != 'on') {
    res.redirect('/settings/import')
  } else {
    next();
  }
}, redirectSpotifyLogin);

router.get("/library/callback", isLoggedIn, (req, res, next) => {
  console.log('CALLBACK called by spotify ->', req.body);
});

module.exports = router;
