const { Schema, model } = require("mongoose");

const trackSchema = new Schema({
  isrc: { type: String, unique: true, required: true },
  title: { type: String, required: true },
  artist: [{ type: String, required: true }],
  duration: { type: String },
  year: String,
  album: String,
  album_id: String,
  img: String,
  importId: {
    spotifyId: String,
    spotifyUri: String,
    appleId: String
  }
});

const Track = model("Track", trackSchema);

module.exports = Track;
