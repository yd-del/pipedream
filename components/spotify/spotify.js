const axios = require('axios')
const querystring = require("querystring")

class Spotify {
  constructor({ client = null, token = null }, methods = {}) {
    this.client = client
    this.token = token
    if (!this.client) {
      this.client = axios.create({
        baseURL: "https://api.spotify.com",
        timeout: 1000,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      })
    }
    for (const key of Object.keys(methods)) {
      this[key] = methods[key].bind(this)
    }
  }
  get users() {
    return new Spotify(this, {
      me: async () => (await this.client.get("/v1/me")).data,
      user: async user_id => (await this.client.get(`/v1/users/${user_id}`)).data,
    })
  }
}

const spotify = {
  type: "app",
  app: "spotify",
  methods: {
    // Wish I had an easier way of specifying a getter - especially when working with entity-based
    // third-party apis. Otherwise, I have to add a layer of indirection - like so.
    api() {
      if (!this._api) {
        this._api = new Spotify({ token: this.$auth.oauth_access_token })
      }
      return this._api
    },
  },
}

module.exports = spotify
