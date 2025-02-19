<template>
  <div class="modal is-active">
    <div class="modal-background"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title is-title-shrink">QR code</p>
        <span
          v-if="$platform === 'web'"
          class="button download is-default is-rounded refresh mr-2 ml-2"
        >
          <span class="icon" @click="downloadQrCodePdf">
            <fa-icon icon="download" />
          </span>
        </span>
        <button
          class="delete"
          aria-label="close"
          @click="$modal.close()"
        ></button>
      </header>
      <section class="modal-card-body">
        <div class="qrcode-container" ref="qrCode">
          <QrCodeVue
            render-as="svg"
            :size="200"
            :value="
              JSON.stringify({
                rp: userProfile.id,
                rpb: $modal.args.value[0].accountId,
              })
            "
          />
        </div>
        <p class="has-text-centered is-size-4 mt-2">
          {{ $gettext("Please scan the QR code above to proceed") }}
        </p>
      </section>
      <footer
        class="
          modal-card-foot
          custom-modal-card-foot
          is-justify-content-flex-end
        "
      >
        <button
          class="button custom-button-modal has-text-weight-medium"
          @click="$modal.close()"
        >
          <span>{{ $gettext("Close") }}</span>
        </button>
      </footer>
    </div>
  </div>
</template>
<script lang="ts">
  import { Options, Vue } from "vue-class-component"
  import { mapModuleState } from "@/utils/vuex"
  import QrCodeVue from "qrcode.vue"

  @Options({
    name: "QrCodeModal",
    components: {
      QrCodeVue,
    },
    mounted() {
      this.$refs.qrCode.focus()
    },
    computed: {
      ...mapModuleState("lokapi", ["userProfile"]),
    },
    methods: {
      async downloadQrCodePdf() {
        await this.$export.DownloadQrCode(
          this.$refs.qrCode.firstChild.outerHTML,
          this.$gettext("QR code wallet - %{name}", {
            name: this.userProfile.name,
          })
        )
      },
    },
  })
  export default class QrCodeModal extends Vue {}
</script>
<style lang="scss" scoped>
  .confirm-icon-container {
    width: fit-content;
    margin: auto;
  }
  .confirm-icon {
    font-size: 4em;
    color: green;
    opacity: 0.5;
  }
  .modal-content {
    width: fit-content;
    text-align: center;
  }
  .qrcode-container {
    width: fit-content;
    margin: auto;
  }
  .icon {
    font-size: larger;
  }
</style>
