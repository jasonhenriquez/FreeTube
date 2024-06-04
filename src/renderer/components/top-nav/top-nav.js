import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtInput from '../ft-input/ft-input.vue'
import FtProfileSelector from '../ft-profile-selector/ft-profile-selector.vue'
import debounce from 'lodash.debounce'

import { IpcChannels, MOBILE_WIDTH_THRESHOLD } from '../../../constants'
import { openInternalPath } from '../../helpers/utils'
import { translateWindowTitle } from '../../helpers/strings'
import { clearLocalSearchSuggestionsSession, getLocalSearchSuggestions } from '../../helpers/api/local'
import { invidiousAPICall } from '../../helpers/api/invidious'

export default defineComponent({
  name: 'TopNav',
  components: {
    FtInput,
    FtProfileSelector
  },
  props: {
    currentRouteFullPath: {
      type: String,
      default: ''
    },
    pageBookmarksAvailable: {
      type: Boolean,
      default: false
    }
  },
  data: () => {
    return {
      component: this,
      showSearchContainer: true,
      historyIndex: 1,
      isForwardOrBack: false,
      isArrowBackwardDisabled: true,
      isArrowForwardDisabled: true,
      searchSuggestionsDataList: [],
      lastSuggestionQuery: ''
    }
  },
  computed: {
    hideSearchBar: function () {
      return this.$store.getters.getHideSearchBar
    },

    hideHeaderLogo: function () {
      return this.$store.getters.getHideHeaderLogo
    },

    landingPage: function () {
      return this.$store.getters.getLandingPage
    },

    headerLogoTitle: function () {
      return this.$t('Go to page',
        {
          page: translateWindowTitle(this.$router.getRoutes()
            .find((route) => route.path === '/' + this.landingPage)
            .meta.title,
          this.$i18n
          )
        })
    },

    enableSearchSuggestions: function () {
      return this.$store.getters.getEnableSearchSuggestions
    },

    searchSettings: function () {
      return this.$store.getters.getSearchSettings
    },

    barColor: function () {
      return this.$store.getters.getBarColor
    },

    currentInvidiousInstance: function () {
      return this.$store.getters.getCurrentInvidiousInstance
    },

    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },

    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },

    expandSideBar: function () {
      return this.$store.getters.getExpandSideBar
    },

    searchFilterValueChanged: function () {
      return this.$store.getters.getSearchFilterValueChanged
    },

    forwardText: function () {
      return this.$t('Forward')
    },

    backwardText: function () {
      return this.$t('Back')
    },

    newWindowText: function () {
      return this.$t('Open New Window')
    },

    isPageBookmarked: function () {
      return this.pageBookmarksAvailable && this.$store.getters.getPageBookmarkWithRoute(this.currentRouteFullPath) != null
    },

    matchingBookmarksDataList: function () {
      return this.$store.getters.getPageBookmarksMatchingQuery(this.lastSuggestionQuery, this.currentRouteFullPath)
    },

    pageBookmarkIconTitle: function () {
      return this.isPageBookmarked ? this.$t('Edit bookmark for this page') : this.$t('Bookmark this page')
    },

    pageBookmarkIconTheme: function () {
      return this.isPageBookmarked ? 'base favorite' : 'base'
    }
  },
  mounted: function () {
    let previousWidth = window.innerWidth
    if (window.innerWidth <= MOBILE_WIDTH_THRESHOLD) {
      this.showSearchContainer = false
    }
    // Store is not up-to-date when the component mounts, so we use timeout.
    setTimeout(() => {
      if (this.expandSideBar) {
        this.toggleSideNav()
      }
    }, 0)

    window.addEventListener('resize', () => {
      // Don't change the status of showSearchContainer if only the height of the window changes
      // Opening the virtual keyboard can trigger this resize event, but it won't change the width
      if (previousWidth !== window.innerWidth) {
        this.showSearchContainer = window.innerWidth > MOBILE_WIDTH_THRESHOLD
        previousWidth = window.innerWidth
      }
    })

    this.debounceSearchResults = debounce(this.getSearchSuggestions, 200)
  },
  methods: {
    goToSearch: async function (query, { event }) {
      const doCreateNewWindow = event && event.shiftKey

      if (window.innerWidth <= MOBILE_WIDTH_THRESHOLD) {
        this.$refs.searchContainer.blur()
        this.showSearchContainer = false
      } else {
        this.$refs.searchInput.blur()
      }

      clearLocalSearchSuggestionsSession()

      if (query.startsWith('ft:')) {
        this.$refs.searchInput.handleClearTextClick()
        const adjustedQuery = query.substring(3)
        openInternalPath({
          path: adjustedQuery,
          adjustedQuery,
          doCreateNewWindow
        })
        return
      }

      this.getYoutubeUrlInfo(query).then((result) => {
        switch (result.urlType) {
          case 'video': {
            const { videoId, timestamp, playlistId } = result

            const query = {}
            if (timestamp) {
              query.timestamp = timestamp
            }
            if (playlistId && playlistId.length > 0) {
              query.playlistId = playlistId
            }

            openInternalPath({
              path: `/watch/${videoId}`,
              query,
              doCreateNewWindow
            })
            break
          }

          case 'playlist': {
            const { playlistId, query } = result

            openInternalPath({
              path: `/playlist/${playlistId}`,
              query,
              doCreateNewWindow
            })
            break
          }

          case 'search': {
            const { searchQuery, query } = result

            openInternalPath({
              path: `/search/${encodeURIComponent(searchQuery)}`,
              query,
              doCreateNewWindow,
              searchQueryText: searchQuery
            })
            break
          }

          case 'hashtag': {
            const { hashtag } = result
            openInternalPath({
              path: `/hashtag/${encodeURIComponent(hashtag)}`,
              doCreateNewWindow
            })

            break
          }

          case 'channel': {
            const { channelId, subPath, url } = result

            openInternalPath({
              path: `/channel/${channelId}/${subPath}`,
              doCreateNewWindow,
              query: {
                url
              }
            })
            break
          }

          case 'invalid_url':
          default: {
            openInternalPath({
              path: `/search/${encodeURIComponent(query)}`,
              query: {
                sortBy: this.searchSettings.sortBy,
                time: this.searchSettings.time,
                type: this.searchSettings.type,
                duration: this.searchSettings.duration,
                features: this.searchSettings.features,
              },
              doCreateNewWindow,
              searchQueryText: query
            })
          }
        }
      })
    },

    focusSearch: function () {
      if (!this.hideSearchBar) {
        // In order to prevent Klipper's "Synchronize contents of the clipboard
        // and the selection" feature from being triggered when running
        // Chromium on KDE Plasma, it seems both focus() focus and
        // select() have to be called asynchronously (see issue #2019).
        setTimeout(() => {
          this.$refs.searchInput.focus()
          this.$refs.searchInput.select()
        }, 0)
      }
    },

    getSearchSuggestionsDebounce: function (query) {
      const trimmedQuery = query.trim()
      if (trimmedQuery === this.lastSuggestionQuery) {
        return
      }

      this.lastSuggestionQuery = trimmedQuery

      if (this.enableSearchSuggestions) {
        this.debounceSearchResults(trimmedQuery)
      }
    },

    getSearchSuggestions: function (query) {
      switch (this.backendPreference) {
        case 'local':
          this.getSearchSuggestionsLocal(query)
          break
        case 'invidious':
          this.getSearchSuggestionsInvidious(query)
          break
      }
    },

    getSearchSuggestionsLocal: function (query) {
      if (query === '') {
        this.searchSuggestionsDataList = []
        return
      }

      getLocalSearchSuggestions(query).then((results) => {
        this.searchSuggestionsDataList = results
      })
    },

    getSearchSuggestionsInvidious: function (query) {
      if (query === '') {
        this.searchSuggestionsDataList = []
        return
      }

      const searchPayload = {
        resource: 'search/suggestions',
        id: '',
        params: {
          q: query
        }
      }

      invidiousAPICall(searchPayload).then((results) => {
        this.searchSuggestionsDataList = results.suggestions
      }).catch((err) => {
        console.error(err)
        if (process.env.SUPPORTS_LOCAL_API && this.backendFallback) {
          console.error(
            'Error gettings search suggestions.  Falling back to Local API'
          )
          this.getSearchSuggestionsLocal(query)
        }
      })
    },

    toggleSearchContainer: function () {
      this.showSearchContainer = !this.showSearchContainer
    },

    navigateHistory: function () {
      if (!this.isForwardOrBack) {
        this.historyIndex = window.history.length
        this.isArrowBackwardDisabled = false
        this.isArrowForwardDisabled = true
      } else {
        this.isForwardOrBack = false
      }
    },

    historyBack: function () {
      this.isForwardOrBack = true
      window.history.back()

      if (this.historyIndex > 1) {
        this.historyIndex--
        this.isArrowForwardDisabled = false
        if (this.historyIndex === 1) {
          this.isArrowBackwardDisabled = true
        }
      }
    },

    historyForward: function () {
      this.isForwardOrBack = true
      window.history.forward()

      if (this.historyIndex < window.history.length) {
        this.historyIndex++
        this.isArrowBackwardDisabled = false

        if (this.historyIndex === window.history.length) {
          this.isArrowForwardDisabled = true
        }
      }
    },

    toggleSideNav: function () {
      this.$store.commit('toggleSideNav')
    },

    createNewWindow: function () {
      if (process.env.IS_ELECTRON) {
        const { ipcRenderer } = require('electron')
        ipcRenderer.send(IpcChannels.CREATE_NEW_WINDOW)
      } else {
        // Web placeholder
      }
    },
    navigate: function (route) {
      this.$router.push('/' + route)
    },
    updateSearchInputText: function (text) {
      this.$refs.searchInput.updateInputData(text)
    },
    ...mapActions([
      'getYoutubeUrlInfo',
      'showPageBookmarkPrompt',
      'showSearchFilters'
    ])
  }
})
