<template>
  <div v-if="$dropdownMenu.listItems(object).length > 1" class="dropdown">
    <div class="dropdown-trigger">
      <span
        class="
          button
          is-default
          button-contextual-menu
          is-pulled-right is-rounded
          refresh
          ml-2
        "
        aria-haspopup="true"
        :aria-controls="`dropdown-${object.backend}-menu`"
      >
        <span class="icon">
          <fa-icon class="qrcode-icon" icon="ellipsis-v" />
        </span>
      </span>
    </div>
    <div
      class="dropdown-menu"
      :id="`dropdown-${object.backend}-menu`"
      role="menu"
    >
      <div class="dropdown-content">
        <a
          v-for="item in $dropdownMenu.listItems(object)"
          :key="item.label"
          href="#"
          class="dropdown-item is-flex"
          @click="item.action(this)"
        >
          <div class="mr-1 icon-container">
            <fa-icon :icon="item.icon" />
          </div>
          <div class="is-small ml-1">{{ item.label }}</div>
        </a>
      </div>
    </div>
  </div>
  <span
    v-else-if="$dropdownMenu.listItems(object).length === 1"
    class="
      button
      is-default
      button-contextual-menu
      is-pulled-right is-rounded
      refresh
      ml-2
    "
    @click="$dropdownMenu.listItems(object)[0].action(this)"
  >
    <span class="icon">
      <fa-icon
        class="qrcode-icon"
        :icon="$dropdownMenu.listItems(object)[0].icon"
      />
    </span>
  </span>
  <span
    class="
      button
      is-default
      button-contextual-menu
      is-pulled-right is-rounded
      ml-2
      hide
    "
    v-else
  >
    <!-- placeholder -->
    <span class="icon">
      <fa-icon class="qrcode-icon" icon="ellipsis-v" />
    </span>
  </span>
</template>
<script lang="ts">
  import { Options, Vue } from "vue-class-component"
  @Options({
    name: "DropdownMenu",
    props: {
      object: Object,
    },
    unmounted() {
      if (this.handleCloseContextualMenu) {
        document.removeEventListener("click", this.handleCloseContextualMenu)
        this.handleCloseContextualMenu = null
      }
    },
    mounted() {
      this.$el
        ?.querySelector(".button-contextual-menu")
        ?.addEventListener("click", (event: any) => {
          event.stopPropagation()
          this.$el.classList.toggle("is-active")
        })
      this.handleCloseContextualMenu = () => {
        this.$el.classList.remove("is-active")
      }
      document.addEventListener("click", this.handleCloseContextualMenu)
    },
  })
  export default class DropdownMenu extends Vue {}
</script>
<style lang="scss" scoped>
  @import "../assets/custom-variables";
  .dropdown-item {
    font-size: inherit;
    -webkit-user-select: none; /* Chrome, Safari, Opera */
    -moz-user-select: none; /* Firefox */
    -ms-user-select: none; /* Internet Explorer/Edge */
    user-select: none; /* Standard syntax */
  }
  .dropdown-menu {
    @media screen and (max-width: 768px) {
      position: absolute;
      right: 0em;
      left: unset;
    }
  }
  .icon-container {
    width: 1em;
  }
</style>
