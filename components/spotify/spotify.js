const axios = require('axios')
const querystring = require("querystring")

const spotify = {
  type: "app",
  app: "spotify",
  methods: {
    client() {
      if (!this._client) {
        this._client = axios.create({
          baseURL: "https://api.spotify.com",
          timeout: 1000,
          headers: {
            Authorization: `Bearer ${this.$auth.oauth_access_token}`,
          },
          withCredentials: true,
        })
        this._client.interceptors.request.use(
          this.onRequest.bind(this),
          this.onRequestError.bind(this)
        )
        this._client.interceptors.response.use(
          this.onResponse.bind(this),
          this.onResponseError.bind(this)
        )
      }
      return this._client
    },
    async me() {
      return await this.client().get("/v1/me")
    },
    onRequest(config) {
      // Note: This is unwise as it exposes the access_token.
      // console.log("onRequest", config)
      return config
    },
    onResponse(response) {
      // Note: This is unwise as it exposes the access_token.
      // console.log("onResponse", response)
      return response.data
    },
    onRequestError(error) {
      console.log("onRequestError", error)
      return Promise.reject(error)
    },
    onResponseError(error) {
      console.log("onResponseError", error)
      return Promise.reject(error)
    },
  },
}

module.exports = spotify
