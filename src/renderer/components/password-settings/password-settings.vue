<template>
  <ft-settings-section
    :title="$t('Settings.Password Settings.Password Settings')"
  >
    <ft-flex-box
      v-if="hasStoredPassword"
      class="settingsFlexStart460px"
    >
      <ft-button
        :label="$t('Settings.Password Settings.Remove Password')"
        @click="handleRemovePassword"
      />
    </ft-flex-box>
    <ft-flex-box
      v-else
      class="settingsFlexStart460px"
    >
      <ft-input
        :placeholder="$t('Settings.Password Settings.Set Password To Prevent Access')"
        :show-action-button="false"
        :show-label="true"
        input-type="password"
        :value="password"
        @input="e => password = e"
        @keydown.enter.native="handleSetPassword"
      />
      <ft-button
        class="centerButton"
        :label="$t('Settings.Password Settings.Set Password')"
        @click="handleSetPassword"
      />
    </ft-flex-box>
  </ft-settings-section>
</template>

<script src="./password-settings.js" />
<style scoped src="./password-settings.css" />
