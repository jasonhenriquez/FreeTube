<template>
  <ft-settings-section
    :title="$t('Settings.External Player Settings.External Player Settings')"
  >
    <ft-flex-box>
      <ft-select
        :placeholder="$t('Settings.External Player Settings.External Player')"
        :value="externalPlayer"
        :select-names="externalPlayerNames"
        :select-values="externalPlayerValues"
        :tooltip="$t('Tooltips.External Player Settings.External Player')"
        :icon="['fas', 'external-link-alt']"
        @change="updateExternalPlayer"
      />
    </ft-flex-box>
    <ft-flex-box>
      <ft-toggle-switch
        :label="$t('Settings.External Player Settings.Ignore Unsupported Action Warnings')"
        :default-value="externalPlayerIgnoreWarnings"
        :disabled="externalPlayer===''"
        :compact="true"
        :tooltip="$t('Tooltips.External Player Settings.Ignore Warnings')"
        @change="updateExternalPlayerIgnoreWarnings"
      />
      <ft-toggle-switch
        :label="$t('Settings.External Player Settings.Ignore Default Arguments')"
        :default-value="externalPlayerIgnoreDefaultArgs"
        :disabled="externalPlayer===''"
        :compact="true"
        :tooltip="$t('Tooltips.External Player Settings.Ignore Default Arguments')"
        @change="updateExternalPlayerIgnoreDefaultArgs"
      />
    </ft-flex-box>
    <ft-flex-box
      v-if="externalPlayer !== ''"
      class="settingsFlexStart460px"
    >
      <ft-input
        :placeholder="$t('Settings.External Player Settings.Custom External Player Executable')"
        :show-action-button="false"
        :show-label="true"
        :value="externalPlayerExecutable"
        :tooltip="$t('Tooltips.External Player Settings.Custom External Player Executable')"
        @input="updateExternalPlayerExecutable"
      />
      <ft-input
        :placeholder="$t('Settings.External Player Settings.Custom External Player Arguments')"
        :show-action-button="false"
        :show-label="true"
        :value="externalPlayerCustomArgs"
        :tooltip="externalPlayerCustomArgsTooltip"
        @input="updateExternalPlayerCustomArgs"
      />
    </ft-flex-box>
  </ft-settings-section>
</template>

<script src="./external-player-settings.js" />
