const axios = require('axios')
const qs = require("querystring")

function idsToUrl(path, idOrArray, params) {
  if (Array.isArray(idOrArray)) {
    return this.toUrl(path, { ...params, ids: idOrArray })
  }
  return this.toUrl(`${path}/${idOrArray}`, params)
}

function toUrl(path, params = {}) {
  return `${path}${qs.stringify(params, { arrayFormat: "comma" })}`
}

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
  async search(q, type, params = {})  {
    return (await this.client.get(toUrl("search", { ...params, q, type }))).data
  },
  get shows() {
    return new Spotify(this, {
      async episodes(show_id, params = {}) {
        return (await this.client.get(toUrl(`/v1/shows/${show_id}/episodes`, params))).data
      },
      async shows(show_id, params = {}) {
        return (await this.client.get(idsToUrl("/v1/shows", show_id, params))).data
      },
    })
  }
  get tracks() {
    return new Spotify(this, {
      async audioAnalysis(track_id, params = {}) {
        return (await this.client.get(toUrl(`/v1/audio-analysis/${track_id}`, params))).data
      },
      async audioFeatures(track_id, params = {}) {
        return (await this.client.get(idsToUrl("/v1/audio-features", track_id, params))).data
      },
      async tracks(track_id, params = {}) {
        return (await this.client.get(idsToUrl("/v1/tracks", track_id, params))).data
      },
    })
  }
  get users() {
    return new Spotify(this, {
      async me(params = {}) {
        return (await this.client.get(toUrl("/v1/me", params))).data
      },
      async user (user_id, params) {
        return (await this.client.get(toUrl(`/v1/users/${user_id}`, params))).data
      },
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
