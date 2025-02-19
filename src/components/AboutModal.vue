<template>
  <div class="modal is-active" ref="about">
    <div class="modal-background"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title is-title-shrink" v-html="modalTitleText"></p>
        <button
          class="delete"
          aria-label="close"
          @click="$modal.close()"
        ></button>
      </header>

      <section class="modal-card-body">
        <div>
          <div v-if="$config.logoUrl" class="app-logo mb-4">
            <img class="app-img" :src="$config.logoUrl" />
          </div>
          <div class="app-version mb-3" v-html="versionHtml"></div>
          <p class="app-description" align="justify" v-html="modalHtml"></p>
        </div>
      </section>
      <footer
        class="
          modal-card-foot
          custom-modal-card-foot
          is-justify-content-flex-end
        "
      ></footer>
    </div>
  </div>
</template>
<script lang="ts">
  import { Options, Vue } from "vue-class-component"

  function replaceWithHtml(str: string, replacements: any) {
    return str.replaceAll(
      /%%([a-zA-Z0-9_-]+)%%/g,
      (match: any, p1: string) =>
        (replacements as { [index: string]: string })[p1]
    )
  }

  @Options({
    name: "AboutModal",
    mounted() {
      this.$refs.about.focus()
    },
    computed: {
      replacements() {
        return {
          appName: `<strong>${this.$appInfo.appName}</strong>`,
          appVersion: `<strong>${this.$appInfo.appVersion}</strong>`,
          organizationName: `<a href='https://lokavaluto.fr/' target='_blank'
                                    ><strong>Lokavaluto</strong
                                ></a>`,
        }
      },
      versionHtml() {
        return replaceWithHtml(
          this.$gettext("%{ appName } version %{ appVersion }", {
            appName: "%%appName%%",
            appVersion: "%%appVersion%%",
          }),
          this.replacements
        )
      },
      modalHtml() {
        return replaceWithHtml(
          this.$gettext(
            "%{ appName } is designed by %{ organizationName } " +
              "an association whose goal is to develop, implement," +
              " and support the deployment of evolving and open-source" +
              " information systems for organizations promoting local " +
              "economic development.",
            {
              appName: "%%appName%%",
              organizationName: "%%organizationName%%",
            }
          ),
          this.replacements
        )
      },
      modalTitleText() {
        return this.$gettext("About %{ appName }", {
          appName: this.$appInfo.appName,
        })
      },
    },
    methods: {},
  })
  export default class AboutModal extends Vue {}
</script>
<style lang="sass" scoped>
  .app-logo
    display: flex
    justify-content: center
    > img
      width: 80%
</style>
