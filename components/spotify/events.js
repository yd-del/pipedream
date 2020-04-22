const spotify = require("https://github.com/PipedreamHQ/pipedream/blob/ac-rally/components/spotify/spotify.js")
const _ = require("lodash")
const axios = require("axios")
const qs = require("query-string")

module.exports = {
  name: "Spotify.Events",
  version: "1.13",
  props: {
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
                isrc_id: isrc,
                musixmatch_id: trackId,
                spotify_id: _.get(foundIsrc[isrc], "track.uri"),
                album: {
                  name: _.get(foundIsrc[isrc], "track.album.name"),
                  href: _.get(foundIsrc[isrc], "track.album.href"),
                  images: _.get(foundIsrc[isrc], "track.album.images"),
                  release_date: _.get(foundIsrc[isrc], "track.album.release_date"),
                },
                artists: _.get(foundIsrc[isrc], "track.artists"),
                href: _.get(foundIsrc[isrc], "track.href"),
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
