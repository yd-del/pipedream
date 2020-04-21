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

class API {
  constructor({ client = null, token = null }, properties = {}) {
    console.log("newAPI", token)
    this.client = client
    this.token = token
    if (!this.client) {
      this.client = axios.create({
        baseURL: "https://api.spotify.com",
        timeout: 1000,
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        withCredentials: true,
      })
      this.client.interceptors.request.use(
        r => {
          console.log("request", r)
          return r
        },
        err => {
        console.log(err)
        return Promise.reject(err)
      })
      this.client.interceptors.response.use(
        r => {
          console.log("response", r)
          return r
        },
        err => {
        console.log("responseError", err)
        return Promise.reject(err)
      })
    }
    for (const key of Object.keys(properties)) {
      if (typeof properties[key] == "function") {
        this[key] = properties[key].bind(this)
      } else {
        this[key] = properties[key]
      }
    }
  }
}
class Spotify extends API {
  get my() {
    return new API(this, {
      async playlists(params = {}) {
        return (await this.client.get(toUrl("/v1/me/playlists", params))).data
      },
      async profile(params = {}) {
        return (await this.client.get(toUrl("/v1/me", params))).data
      },
      get top() {
        return new API(this, {
          async artists(params = {}) {
            return (await this.client.get(toUrl("/v1/me/top/artists", params))).data
          },
          async tracks(params = {}) {
            return (await this.client.get(toUrl("/v1/me/top/tracks", params))).data
          },
        })
      },
    })
  }
  playlist(playlist_id) {
    return new API(this, {
      async details(params = {}) {
        return (await this.client.get(idsToUrl("/v1/playlists", playlist_id, params))).data
      },
      async images(params = {}) {
        return (await this.client.get(toUrl(`/v1/playlists/${playlist_id}/images`, params))).data
      },
      async tracks(params = {}) {
        return (await this.client.get(toUrl(`/v1/playlists/${playlist_id}/tracks`, params))).data
      },
      async add(track_ids = [], position = undefined, params = {}) {
        const uris = track_ids.map(id => `spotify:track:${id}`)
        const body = { uris, position }
        return (await this.client.post(`/v1/playlists/${playlist_id}`, body)).data
      },
      async delete(track_ids = [], position = undefined, params = {}) {
        const uris = track_ids.map(id => ({ uri: `spotify:track:${id}` }))
        const body = { uris, position }
        return (await this.client.delete(`/v1/playlists/${playlist_id}`, body)).data
      },
      async update(details) {
        return (await this.client.put(`/v1/playlists/${playlist_id}`, details)).data
      },
    })
  }
  async search(q, type, params = {})  {
    return (await this.client.get(toUrl("search", { ...params, q, type }))).data
  }
  get show() {
    return new API(this, {
      async details(show_id, params = {}) {
        return (await this.client.get(idsToUrl("/v1/shows", show_id, params))).data
      },
      async episodes(show_id, params = {}) {
        return (await this.client.get(toUrl(`/v1/shows/${show_id}/episodes`, params))).data
      },
    })
  }
  get track() {
    return new API(this, {
      async details(track_id, params = {}) {
        return (await this.client.get(idsToUrl("/v1/tracks", track_id, params))).data
      },
      async audioAnalysis(track_id, params = {}) {
        return (await this.client.get(toUrl(`/v1/audio-analysis/${track_id}`, params))).data
      },
      async audioFeatures(track_id, params = {}) {
        return (await this.client.get(idsToUrl("/v1/audio-features", track_id, params))).data
      },
    })
  }
  user(user_id) {
    return new API(this, {
      async createPlaylist(name, description = undefined, _public = true, collaborative = false) {
        const details = {
          name,
          description,
          public: _public,
          collaborative,
        }
        return (await this.client.post(`/v1/users/${user_id}/playlists`, details)).data
      },
      async playlists(params = {}) {
        return (await this.client.get(toUrl(`/v1/users/${user_id}/playlists`, params))).data
      },
      async profile(params = {}) {
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
