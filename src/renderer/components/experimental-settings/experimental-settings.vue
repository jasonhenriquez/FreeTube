<template>
  <ft-settings-section
    :title="$t('Settings.Experimental Settings.Experimental Settings')"
  >
    <p class="experimental-warning">
      {{ $t('Settings.Experimental Settings.Warning') }}
    </p>
    <ft-flex-box>
      <ft-toggle-switch
        tooltip-position="top"
        :label="$t('Settings.Experimental Settings.Replace HTTP Cache')"
        :compact="true"
        :default-value="replaceHttpCache"
        :disabled="replaceHttpCacheLoading"
        :tooltip="$t('Tooltips.Experimental Settings.Replace HTTP Cache')"
        @change="handleRestartPrompt"
      />
    </ft-flex-box>
    <ft-prompt
      v-if="showRestartPrompt"
      :label="$t('Settings[\'The app needs to restart for changes to take effect. Restart and apply change?\']')"
      :option-names="[$t('Yes, Restart'), $t('Cancel')]"
      :option-values="['restart', 'cancel']"
      @click="handleReplaceHttpCache"
    />
  </ft-settings-section>
</template>

<script src="./experimental-settings.js" />
<style scoped src="./experimental-settings.css" />
