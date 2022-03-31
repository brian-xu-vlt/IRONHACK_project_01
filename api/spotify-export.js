const {
	postToEndpoint,
	getUserSpotifyId,
} = require('./spotify-api-calls');

// const {
// 	CLIENT_ID,
// 	SPOTIFY_TOKEN_URL,
// 	CLIENT_SECRET,
// 	REDIRECT_URL,
// 	SPOTIFY_AUTH_URL,
// } = require('../utils/consts')
// const { convertMsToString } = require('../utils/convertMsToString')
// const generateRandomString = require('../utils/random-generator')
// const axios = require('axios')
// const qs = require('qs');
// const Track = require('../models/Track.model');
// const Link = require('../models/Link.model');
// const User = require('../models/User.model');

async function testExport(currentUser, authToken) {
	try {
		const userLib = (await currentUser.getLibrary()).map(track => track?.importId?.spotifyUri);
		console.log('userLib', userLib);
		const userId = await getUserSpotifyId(authToken);

		const { data } = await postToEndpoint(
			authToken,
			`https://api.spotify.com/v1/users/${userId}/playlists`,
			{
				name: `test_${Date.now()}`,
				public: false,
			}
		);
		const playlistId = data?.id;
		if (playlistId) {
			console.log('playlistId------------- ', playlistId);
			do {
				const uploadTracks = userLib.splice(0, 99);
				await postToEndpoint(
					authToken,
					`https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
					{
						uris: uploadTracks,
					},
				);
			} while (userLib.length);
		} else {
			throw new Error('no playlist id');
		}
	} catch (error) {
		console.error('error', error);
	}
}

async function createPlaylist(currentUser, originGroup, authToken) {
	console.log('CREATE PLAYLIST function', originGroup);
	try {
		if (originGroup === 'test') {
			await testExport(currentUser, authToken);
		}
	} catch (error) {
		console.error(error);
	}
}

module.exports = {
	createPlaylist,

}
