const { getSpotifyToken, importFromSpotify, redirectSpotifyLogin } = require('../api/spotify-calls');
const { convertMsToString } = require('../utils/convertMsToString')
const router = require("express").Router();
const isLoggedIn = require('../middleware/isLoggedIn')
const Track = require('../models/Track.model')
const Link = require('../models/Link.model')

router.get("/", isLoggedIn, (req, res, next) => {
  res.render("settings/settings");
});

router.get("/import", isLoggedIn, (req, res, next) => {
  res.render("settings/import");
});

router.get("/library", isLoggedIn, async (req, res, next) => {
  try {
    const tracklist = await req.user?.getLinks();
    res.render("settings/library", { tracklist });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

// !! TODO change to post !
router.get("/library/delete", isLoggedIn, async (req, res, next) => {
  try {
    await Link.deleteMany({ userId: req.user._id });
    res.redirect('/settings/library');
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.post("/library/create", isLoggedIn, (req, res, next) => {
  let { mySongs, myPlaylists, spotifyPlaylists } = req.body;
  mySongs = mySongs === 'on';
  myPlaylists = myPlaylists === 'on';
  spotifyPlaylists = spotifyPlaylists === 'on';

  if (!mySongs && !myPlaylists && !spotifyPlaylists) {
    res.redirect('/settings/import')
  } else {
    req.session.userFormData = { mySongs, myPlaylists, spotifyPlaylists };
    next();
  }
}, redirectSpotifyLogin);

router.get("/library/callback", isLoggedIn, async (req, res, next) => {

  const currentUser = req.user;
  console.log('CURRENT USERS', currentUser);
  const userCode = req.query.code;
  const receivedstate = req.query.state;
  const storedState = req.session.state;

  // check state in cookie, if ok clear it, if not redirect
  if (storedState !== receivedstate) {
    console.error('Not the right state');
    return res.status(400).send('wrong state');
  }
  delete req.session.state;

  try {
    const authToken = await getSpotifyToken(userCode);
    await importFromSpotify(currentUser, req.session.userFormData, authToken)
    res.redirect('/settings/library')
  } catch (error) {
    next(error);
  }

});

module.exports = router;
