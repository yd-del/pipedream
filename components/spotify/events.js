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
  version: "1.9",
  props: {
    // Why do I have to do this? Why is this not just a normal require? What does registering get me other than naming and putting on this?
    spotify,
    db: "$.service.db",
    timer: {
      type: "$.interface.timer",
    },
  },
  async run() {
    console.log(this)
    const api = this.spotify.api()
    const topArtists = await api.my.top.artists()
    console.log(topArtists)
    this.$emit(topArtists)
    // const me = await api.users.me()
    // let changed = false
    // const updates = {
    //   me,
    // }
    //
    // const latestFollowers = this.db.get("me_followers") || 0
    // if (me.followers && me.followers.total && me.followers.total != latestFollowers) {
    //   changed = true
    //   updates.me.followers.change = me.followers.total - latestFollowers,
    //   this.db.set("me_followers", me.followers.total)
    // }
    //
    // if (changed) {
    //   this.$emit(updates)
    //   return updates
    // } else {
    //   return
    // }
  },
}
