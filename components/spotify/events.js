// General issues:
// 
// Deploy/Update cycle.
// Would love to set up a watcher that auto deploys when I make changes.
// * No way to auto set props (cli doesn't have a quiet mode, and expect doesn't work properly)
// * For new users, first time deploy should show example commandline for updating code (when would you not need to update soon after?)

// Issue: I really want local requires so that I don't have to do a push every time I want to change the app
// Issue: Can't use branch named ac/rally - must use ac-rally. Attempting to deploy creates a massive wall of text without a clear error message.
// Issue: When doing remote requires, errors in the require are not shown with filename - difficult to find the actual error.
// Issue: When doing remote requires, changes to required files don't get registered unless updating component.js - NOT JUST CALLINIG PD-UPDATE!
//   The component.js must actually change for changes in required files to be picked up.
// Issue: console.error vs console.log
// NTH: Freeze/Reset/Rollback DB state between runs - for testing.
const spotify = require("https://github.com/PipedreamHQ/pipedream/blob/ac-rally/components/spotify/spotify.js")
const _ = require("lodash")
const axios = require("axios")
const qs = require("query-string")

module.exports = {
  name: "Spotify.Events",
  version: "1.13",
  props: {
    // Why do I have to do this? Why is this not just a normal require? What does registering get me other than naming and putting on this?
    spotify,
    musixmatchApiKey: "string",
    db: "$.service.db",
    timer: {
      type: "$.interface.timer",
    },
  },
  async run() {
    const api = this.spotify.api()
    const foundIsrc = {}
    try {
      const tracks = (await api.getMySavedTracks()).body.items
      for (const track of tracks) {
        const isrc = _.get(track, "track.external_ids.isrc")
        if (isrc) foundIsrc[isrc] = track
      }
    } catch(e) { console.log(e) }
    try {
      const tracks = (await api.getMyTopTracks()).body.items
      for (const track of tracks) {
        const isrc = _.get(track, "track.external_ids.isrc")
        if (isrc) foundIsrc[isrc] = track
      }
    } catch(e) { console.log(e) }
    try {
      const playlists = (await api.getUserPlaylists()).body.items
      for (const playlist of playlists) {
        try {
          const tracks = (await api.getPlaylistTracks(playlist.id)).body.items
          for (const track of tracks) {
            const isrc = _.get(track, "track.external_ids.isrc")
            if (isrc) foundIsrc[isrc] = track
          }
        } catch (e) {
          continue
        }
      }
    } catch(e) { console.log(e) }
    
    const latestIsrc = this.db.get("me_isrc") || []
    const allIsrc = new Set()
    latestIsrc.forEach(id => { if (id) allIsrc.add(id) })

    const newIsrc = []
    for (const isrc of Object.keys(foundIsrc)) {
      if (!allIsrc.has(isrc)) {
        newIsrc.push(isrc)
        allIsrc.add(isrc)
      }
    }
    if (newIsrc.length) {
      this.db.set("me_isrc", Array.from(allIsrc))
      const client = axios.create({
        baseURL: "https://api.musixmatch.com/ws/1.1/",
      })
      for (const isrc of newIsrc) {
        const params = {
          apikey: this.musixmatchApiKey,
          track_isrc: isrc,
        }
        try {
          const response = await client.get(`track.get?${qs.stringify(params)}`)
          const trackId = _.get(response, "data.message.body.track.track_id")
          if (trackId) {
            const lyricsParams = {
              apikey: this.musixmatchApiKey,
              track_id: trackId,
            }
            const lyricsResponse = await client.get(`track.lyrics.get?${qs.stringify(lyricsParams)}`)
            console.log(lyricsResponse.data)
            const lyricsBody = _.get(lyricsResponse, "data.message.body.lyrics.lyrics_body")
            console.log(lyricsBody)
            if (lyricsBody) {
              const event = {
                album: {
                  name: _.get(foundIsrc[isrc], "track.album.name"),
                  href: _.get(foundIsrc[isrc], "track.album.href"),
                  images: _.get(foundIsrc[isrc], "track.album.images"),
                  release_date: _.get(foundIsrc[isrc], "track.album.release_date"),
                },
                artists: _.get(foundIsrc[isrc], "track.artists"),
                href: _.get(foundIsrc[isrc], "track..href"),
                name: _.get(foundIsrc[isrc], "track.name"),
                preview_url: _.get(foundIsrc[isrc], "track.preview_url"),
                lyrics: lyricsBody,
              }
              this.$emit(event)
            }
          }
        } catch (e) {
          console.log(e)
        }
      }
    }
    return newIsrc
  },
}
