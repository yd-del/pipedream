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
const spotify = require("https://github.com/PipedreamHQ/pipedream/blob/ac-rally/components/spotify/spotify.js")

module.exports = {
  name: "Spotify.Events",
  version: "1.12",
  props: {
    // Why do I have to do this? Why is this not just a normal require? What does registering get me other than naming and putting on this?
    spotify,
    db: "$.service.db",
    timer: {
      type: "$.interface.timer",
    },
  },
  async run() {
    const api = this.spotify.api()
    // const topArtists = await api.my.top.artists({ limit: 20 })
    let tracks = []
    try {
      const topTracks = await api.my.top.tracks({ limit: 20 })
      tracks.push(...topTracks)
    } catch(e) { console.log(e) }
    try {
      const playlists = await api.my.playlists({ limit: 20 })
      for (const playlist of playlists) {
        try {
          const playlistTracks = await api.playlists(playlist.id).tracks()
          tracks.push(...playlistTracks)
        } catch (e) {
          continue
        }
      }
    } catch(e) { console.log(e) }
    
    // const latestArtists = this.db.get("me_artists") || 0
    this.$emit(tracks)
    return tracks
    // if (true) {
      // this.db.set("me_artists", topArtists)
    // }

    // if (changed) {
    //   this.$emit(updates)
    //   return updates
    // } else {
    //   return
    // }
  },
}
