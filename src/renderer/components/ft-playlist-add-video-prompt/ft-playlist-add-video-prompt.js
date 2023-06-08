import Vue from 'vue'
import { mapActions } from 'vuex'
import debounce from 'lodash.debounce'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtPlaylistSelector from '../ft-playlist-selector/ft-playlist-selector.vue'
import FtInput from '../../components/ft-input/ft-input.vue'
import {
  showToast,
} from '../../helpers/utils'

export default Vue.extend({
  name: 'FtPlaylistAddVideoPrompt',
  components: {
    'ft-flex-box': FtFlexBox,
    'ft-prompt': FtPrompt,
    'ft-button': FtButton,
    'ft-playlist-selector': FtPlaylistSelector,
    'ft-input': FtInput,
  },
  data: function () {
    return {
      selectedPlaylistIdList: [],
      createdSincePromptShownPlaylistIdList: [],
      query: '',
      updateQueryDebounce: function() {},
      lastShownAt: Date.now(),
    }
  },
  computed: {
    allPlaylists: function () {
      const playlists = this.$store.getters.getAllPlaylists
      return [].concat(playlists).map((playlist) => {
        playlist.title = playlist.playlistName
        playlist.type = 'playlist'
        playlist.thumbnail = ''
        playlist.channelName = ''
        playlist.channelId = ''
        playlist.playlistId = ''
        playlist.videoCount = playlist.videos.length
        return playlist
      }).sort((a, b) => {
        // Sort by `lastUpdatedAt`, then alphabetically
        if (a.lastUpdatedAt > b.lastUpdatedAt) {
          return -1
        } else if (b.lastUpdatedAt > a.lastUpdatedAt) {
          return 1
        }

        return a.title.localeCompare(b.title, this.locale)
      })
    },
    allPlaylistsLength() {
      return this.allPlaylists.length
    },
    selectedPlaylistCount: function () {
      return this.selectedPlaylistIdList.length
    },
    toBeAddedToPlaylistVideoCount: function () {
      return this.toBeAddedToPlaylistVideoList.length
    },
    showAddToPlaylistPrompt: function () {
      return this.$store.getters.getShowAddToPlaylistPrompt
    },
    toBeAddedToPlaylistVideoList: function () {
      return this.$store.getters.getToBeAddedToPlaylistVideoList
    },
    newPlaylistDefaultProperties: function () {
      return this.$store.getters.getNewPlaylistDefaultProperties
    },

    processedQuery: function() {
      return this.query.trim().toLowerCase()
    },
    activePlaylists: function() {
      // Very rare that a playlist name only has 1 char
      if (this.processedQuery.length === 0) { return this.allPlaylists }

      return this.allPlaylists.filter((playlist) => {
        if (typeof (playlist.playlistName) !== 'string') { return false }

        return playlist.playlistName.toLowerCase().includes(this.processedQuery)
      }).sort((a, b) => {
        // Latest updated first
        return b.lastUpdatedAt - a.lastUpdatedAt
      })
    },
  },
  watch: {
    allPlaylistsLength(val, oldVal) {
      // When playlist length changed, a playlist removed or added
      // Only cares about playlist added
      if (val < oldVal) { return }

      this.allPlaylists.forEach((playlist) => {
        // Old playlists don't have `createdAt`
        if (playlist.createdAt == null) { return }
        // Only playlists created after this prompt shown should be considered
        if (playlist.createdAt < this.lastShownAt) { return }
        // Only playlists not auto added to selected yet should be considered
        if (this.createdSincePromptShownPlaylistIdList.includes(playlist._id)) { return }

        // Add newly created playlists to selected ONCE
        this.createdSincePromptShownPlaylistIdList.push(playlist._id)
        this.selectedPlaylistIdList.push(playlist._id)
      })
    },
  },
  mounted: function () {
    // this.parseUserData()
    this.updateQueryDebounce = debounce(this.updateQuery, 500)
  },
  methods: {
    hide: function () {
      this.hideAddToPlaylistPrompt()
    },

    countSelected: function (playlistId) {
      const index = this.selectedPlaylistIdList.indexOf(playlistId)
      if (index !== -1) {
        this.selectedPlaylistIdList.splice(index, 1)
      } else {
        this.selectedPlaylistIdList.push(playlistId)
      }
    },

    addSelectedToPlaylists: function () {
      const addedPlaylistIds = new Set()

      if (this.selectedPlaylistIdList.length === 0) {
        showToast('You haven\'t selected any playlist yet.')
        return
      }

      this.selectedPlaylistIdList.forEach((selectedPlaylistId) => {
        const playlist = this.allPlaylists.find((list) => list._id === selectedPlaylistId)
        if (playlist == null) { return }

        this.toBeAddedToPlaylistVideoList.forEach((videoObject) => {
          const payload = {
            _id: playlist._id,
            // Avoid `do not mutate vuex store state outside mutation handlers`
            videoData: Object.assign({}, videoObject, {
              // Part of unique ID for duplicate videos
              timeAdded: new Date().getTime(),
            }),
          }
          this.addVideo(payload)
          addedPlaylistIds.add(playlist._id)
        })
      })

      showToast(`${this.toBeAddedToPlaylistVideoCount} video(s) added to ${addedPlaylistIds.size} playlist(s).`)
      this.hide()
    },

    createNewPlaylist: function () {
      this.showCreatePlaylistPrompt({
        title: this.newPlaylistDefaultProperties.title || '',
        videos: [],
      })
    },

    updateQuery: function(query) {
      this.query = query
    },

    ...mapActions([
      'addVideo',
      'hideAddToPlaylistPrompt',
      'showCreatePlaylistPrompt',
    ])
  }
})