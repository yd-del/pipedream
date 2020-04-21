const Spotify = require('spotify-web-api-node')

const spotify = {
  type: "app",
  app: "spotify",
  methods: {
    // Wish I had an easier way of specifying a getter - especially when working with entity-based
    // third-party apis. Otherwise, I have to add a layer of indirection - like so.
    api() {
      if (!this._api) {
        this._api = new Spotify({ accessToken: this.$auth.oauth_access_token })
      }
      return this._api
    },
  },
}

module.exports = spotify
