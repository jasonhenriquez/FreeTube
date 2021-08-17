import Vue from 'vue'
import { mapActions } from 'vuex'
import $ from 'jquery'

import FtCard from '../../components/ft-card/ft-card.vue'
import FtIconButton from '../../components/ft-icon-button/ft-icon-button.vue'

export default Vue.extend({
  name: 'FtProfileSelector',
  components: {
    'ft-card': FtCard,
    'ft-icon-button': FtIconButton
  },
  data: function () {
    return {
      showProfileList: false
    }
  },
  computed: {
    profileList: function () {
      return this.$store.getters.getProfileList
    },
    activeProfile: function () {
      return this.$store.getters.getActiveProfile
    },
    defaultProfile: function () {
      return this.$store.getters.getDefaultProfile
    },
    activeProfileInitial: function () {
      return this?.activeProfile?.name?.length > 0 ? Array.from(this.activeProfile.name)[0].toUpperCase() : ''
    },
    profileInitials: function () {
      return this.profileList.map((profile) => {
        return profile?.name?.length > 0 ? Array.from(profile.name)[0].toUpperCase() : ''
      })
    }
  },
  mounted: function () {
    $('#profileList').focusout((e) => {
      // do not focus out if the element is a descendant of the profile list
      if ($('#profileList').has(e.relatedTarget).length) {
        return
      }

      $('#profileList')[0].style.display = 'none'
    })
  },
  methods: {
    toggleProfileList: function () {
      const profileList = $('#profileList')
      profileList.get(0).style.display = 'inline'

      const openProfile = $(`#profile-${this.activeProfile}`)
      openProfile.attr('tabindex', '0')
      openProfile.attr('aria-selected', 'true')
      openProfile[0].focus()
    },

    openProfileSettings: function () {
      this.$router.push({
        path: '/settings/profile/'
      })
      $('#profileList').focusout()
    },

    setActiveProfile: function (profile, event) {
      if (!this.$handleDropdownKeyboardEvent(event, $('.profileSettings').first())) {
        return
      }

      $(`#profile-${this.activeProfile}`).attr('aria-selected', 'false')

      if (this.profileList[this.activeProfile]._id === profile._id) {
        return
      }
      const index = this.profileList.findIndex((x) => {
        return x._id === profile._id
      })

      if (index === -1) {
        return
      }

      this.updateActiveProfile(index)
      const message = this.$t('Profile.$ is now the active profile').replace('$', profile.name)
      this.showToast({
        message: message
      })
      $('#profileList').focusout()
    },

    ...mapActions([
      'showToast',
      'updateActiveProfile'
    ])
  }
})
