<template>
  <div
    class="switch-ctn"
    :class="{
      compact,
      disabled: disabled,
      containsTooltip: tooltip.length > 0
    }"
  >
    <input
      :id="id"
      v-model="currentValue"
      type="checkbox"
      name="set-name"
      class="switch-input"
      :checked="currentValue"
      :disabled="disabled"
      @change="change"
    >
    <label
      :for="id"
      class="switch-label"
    >
      <span class="switch-label-text">
        {{ label }}
      </span>
      <ft-tooltip
        v-if="tooltip !== ''"
        class="selectTooltip"
        :position="tooltipPosition"
        :tooltip="tooltip"
        :allow-newlines="tooltipAllowNewlines"
      />
    </label>
  </div>
</template>

<script src="./ft-toggle-switch.js" />
<style scoped lang="scss" src="./ft-toggle-switch.scss" />
