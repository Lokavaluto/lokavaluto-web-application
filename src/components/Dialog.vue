<template>
  <div class="modal is-active centered" v-if="visible">
    <div class="modal-background"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <span class="is-flex is-flex-shrink-0"> </span>
        <p class="modal-card-title is-title-shrink">
          {{ opts.title }}
        </p>
        <button
          class="delete"
          aria-label="close"
          @click="cancelInput()"
        ></button>
      </header>
      <section class="modal-card-body">
        <p>
          {{ opts.content }}
        </p>
      </section>
      <footer class="modal-card-foot is-justify-content-flex-end">
        <div v-for="button in opts.buttons" :key="button.id">
          <button
            class="button custom-button custom-inverted ml-2"
            @click="submitInput(button.id)"
          >
            {{ button.label }}
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>
<script lang="ts">
  import { Options, Vue } from "vue-class-component"

  @Options({
    name: "Dialog",
    components: {},
    data() {
      return {
        visible: false,
        callbacks: {},
        opts: {},
      }
    },

    created() {
      this.$dialog.register(
        (opts: any) =>
          new Promise((resolve, reject) => {
            this.callbacks = { resolve, reject }
            this.show(opts)
          })
      )
    },
    methods: {
      submitInput(label: string) {
        this.hide()
        this.callbacks.resolve(label)
      },

      cancelInput(error?: any) {
        this.hide()
        if (this.opts?.showPopupOnClose) {
          this.$msg.warning(this.$gettext("Operation canceled"))
          this.callbacks.reject(
            error || new Error("User canceled the dialog box")
          )
        }
      },

      hide() {
        this.visible = false
      },

      show(opts: any) {
        this.opts = opts
        this.visible = true
      },
    },
  })
  export default class Dialog extends Vue {}
</script>
<style lang="scss" scoped>
  .modal-card {
    position: relative;
    top: -5vh;
  }
</style>
