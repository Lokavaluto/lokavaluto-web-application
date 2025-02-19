<template>
  <div class="is-flex is-justify-content-flex-start" v-if="recipient">
    <div
      class="is-clickable is-align-items-center is-flex recipient-icon"
      :class="[recipient.is_favorite ? 'is-active' : '']"
      @click="toggleFavorite()"
      id="toggle-fav"
    >
      <span class="icon">
        <fa-icon
          :class="!recipient.is_favorite ? 'has-text-grey-light' : ''"
          :icon="recipient.is_favorite ? 'fa fa-star' : 'far fa-star'"
        />
      </span>
    </div>
    <div
      pl-3
      class="recipient-name is-size-5"
      @click="$emit('select', recipient)"
    >
      {{ recipient.name }}
      <div v-if="recipient.markBackend" class="is-size-6 has-text-grey-light">
        {{ `${recipient.backendId}` }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { Options, Vue } from "vue-class-component"

  import { showSpinnerMethod, replaceWithLoader } from "@/utils/showSpinner"
  import { debounceMethod } from "@/utils/debounce"
  import applyDecorators from "@/utils/applyDecorators"
  import { UIError } from "@/exception"

  import moment from "moment"

  @Options({
    name: "RecipientItem",
    props: {
      recipient: Object,
    },
    methods: {
      toggleFavorite: applyDecorators(
        [
          debounceMethod,
          showSpinnerMethod(function (this: any) {
            return replaceWithLoader.apply(this, ["#toggle-fav", "1.5em"])
          }),
        ],
        async function (this: any): Promise<void> {
          try {
            await this.recipient.toggleFavorite()
          } catch (err: any) {
            throw new UIError(
              this.$gettext(
                "An unexpected issue occurred while adding this recipient to your favorit list"
              ),
              err
            )
          }
        }
      ),
    },
  })
  export default class RecipientItem extends Vue {}
</script>
<style lang="scss" scoped>
  .recipient-name {
    width: 100%;
  }
  .recipient-icon {
    position: relative;
  }
</style>
