const {
  redirectSpotifyLogin,
  getSpotifyToken,
} = require('../api/spotify-api-calls');
const { importFromSpotify } = require('../api/spotify-import');

const mongoose = require('mongoose');
const { exportPlaylist } = require('../api/spotify-export');
const router = require("express").Router();
const isLoggedIn = require('../middleware/isLoggedIn')

const Group = require('../models/Group.model')
const Track = require('../models/Track.model')
const Link = require('../models/Link.model');
const isNotUpdating = require('../middleware/isNotUpdating');

router.get("/", isLoggedIn, isNotUpdating, (req, res, next) => {
  res.render("settings/settings");
});

router.get("/import", isLoggedIn, isNotUpdating, (req, res, next) => {
  res.render("settings/import");
});

router.get("/library", isLoggedIn, isNotUpdating, async (req, res, next) => {
  try {
    const tracklist = await req.user?.getLinks();
    res.render("settings/library", { tracklist });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

// !! TODO change to post !
router.get("/library/delete", isLoggedIn, isNotUpdating, async (req, res, next) => {
  try {
    await Link.deleteMany({ userId: req.user._id });
    res.redirect('/settings/library');
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.delete("/library/:id/delete", isLoggedIn, isNotUpdating, async (req, res, next) => {
  try {
    await Link.findByIdAndDelete({ userId: req.user._id, _id: req.params.id });
    const libraryContent = await Link.countDocuments({userId: req.user._id});
    res.status(200).send(libraryContent.toString());
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.post("/library/create", isLoggedIn, isNotUpdating, (req, res, next) => {
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

router.get("/library/callback", isLoggedIn, isNotUpdating, async (req, res, next) => {
  const createPlaylistGroupId = req.session?.createPlaylistGroupId;
  if (createPlaylistGroupId) {
    delete req.session.createPlaylistGroupId;
  }

  const currentUser = req.user;
  const userCode = req.query.code;
  const receivedstate = req.query.state;
  const storedState = req.session.state;

  try {
    const authToken = await getSpotifyToken(userCode);
    if (createPlaylistGroupId) {
      if (!mongoose.Types.ObjectId.isValid(createPlaylistGroupId)) {
        if (createPlaylistGroupId === 'ownTracks') {
          await exportPlaylist(currentUser, createPlaylistGroupId, authToken);
          return res.redirect('/');
        } else {
          return res.status(400).send('Invalid group id');
        }
      } else {
        const targetGroup = await Group.findById(createPlaylistGroupId);
        if (!targetGroup) {
          return res.status(400).send('Could not find group');
        }
        await exportPlaylist(currentUser, targetGroup, authToken);
        return res.redirect('/groups');
      }
    } else {
      await currentUser.setUpdatingStatus(true);
      // check state in cookie, if ok clear it, if not redirect
      if (storedState !== receivedstate) {
        console.error('Not the right state');
        return res.status(400).send('wrong state');
      }
      delete req.session.state;
      res.redirect('/settings/library')
      await importFromSpotify(currentUser, req.session.userFormData, authToken)
      await currentUser.setUpdatingStatus(false);
    }
  } catch (error) {
    next(error);
  }
});

router.get("/export/own-tracks", isLoggedIn, isNotUpdating, async (req, res, next) => {
  req.session.createPlaylistGroupId = 'ownTracks';
  next();
}, redirectSpotifyLogin);

router.get("/export/:groupId", isLoggedIn, isNotUpdating, async (req, res, next) => {
  req.session.createPlaylistGroupId = req.params.groupId;
  next();
}, redirectSpotifyLogin);

module.exports = router;
