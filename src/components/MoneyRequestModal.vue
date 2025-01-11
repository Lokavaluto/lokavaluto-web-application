<template>
  <div class="modal is-active">
    <div class="modal-background"></div>
    <template v-if="$modal.step.value == 1">
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title is-title-shrink">
            {{ $gettext("Request money") }} - 1/2
          </p>
          <button class="delete" aria-label="close" @click="close()"></button>
        </header>
        <section class="modal-card-body">
          <MoneyTransaction
            directionTransfer="receive"
            :account="$modal.args.value[0].account"
            :selectedRecipient="selectedRecipient"
            :config="config"
            transactionType="createRequestPay"
            @update:amount="(x) => (amount = x)"
            @update:senderMemo="(x) => (senderMemo = x)"
            @update:recipientMemo="(x) => (recipientMemo = x)"
            @update:isValid="(x) => (isValid = x)"
          />
        </section>
        <footer
          class="
            modal-card-foot
            custom-modal-card-foot
            is-justify-content-flex-end
          "
        >
          <button
            :disabled="!isValid"
            class="button custom-button-modal has-text-weight-medium"
            id="send-money-button"
            @click="$modal.next()"
          >
            {{ $gettext("Generate QrCode") }}
          </button>
        </footer>
      </div>
    </template>
    <template v-if="$modal.step.value == 2">
      <div class="modal-card">
        <header class="modal-card-head">
          <span class="is-flex is-flex-shrink-0">
            <a class="mr-3 is-flex" @click="$modal.back()">
              <span class="icon has-text-white">
                <fa-icon icon="arrow-left" class="fa-lg" />
              </span>
            </a>
          </span>
          <p class="modal-card-title is-title-shrink">
            {{ $gettext("Request money") }} - 2/2
          </p>
          <span
            v-if="$platform === 'web'"
            @click="downloadQrCodePdf"
            class="button download is-default is-rounded refresh mr-2 ml-2"
          >
            <span class="icon">
              <fa-icon icon="download" />
            </span>
          </span>
          <button class="delete" aria-label="close" @click="close()"></button>
        </header>
        <section class="modal-card-body">
          <div class="qrcode-container" ref="qrCodeTransaction">
            <QrCodeVue
              render-as="svg"
              :size="200"
              :value="
                JSON.stringify({
                  rp: userProfile.id,
                  rpb: $modal.args.value[0].account.id,
                  amount: amount,
                  senderMemo: senderMemo,
                  recipientMemo: recipientMemo,
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
            id="send-money-button"
            @click="$modal.close()"
          >
            {{ $gettext("Close") }}
          </button>
        </footer>
      </div>
    </template>
  </div>
</template>
<script lang="ts">
  import { Options, Vue } from "vue-class-component"
  import { mapModuleState } from "@/utils/vuex"

  import QrCodeVue from "qrcode.vue"
  import MoneyTransaction from "@/components/MoneyTransaction.vue"

  @Options({
    name: "MoneyRequestModal",
    components: {
      QrCodeVue,
      MoneyTransaction,
    },
    data() {
      return {
        amount: null,
        senderMemo: null,
        recipientMemo: null,
        isValid: false,
        config: {},
      }
    },
    computed: {
      ...mapModuleState("lokapi", ["userProfile"]),
    },
    watch: {
      senderMemo: {
        handler(newVal, oldVal) {
          this.config.senderMemo = newVal
        },
      },
      recipientMemo: {
        handler(newVal, oldVal) {
          this.config.recipientMemo = newVal
        },
      },
      amount: {
        handler(newVal, oldVal) {
          this.config.amount = newVal
        },
      },
    },
    methods: {
      async downloadQrCodePdf() {
        let svgQrCode = this.$refs.qrCodeTransaction.firstChild.outerHTML
        await this.$export.DownloadQrCode(svgQrCode)
      },
      close() {
        this.amount = 0
        this.$modal.close()
      },
      setFocus(refLabel: string) {
        this.$nextTick(() => {
          const ref = this.$refs[refLabel]
          ref.focus()
          ref.select()
        })
      },
    },
  })
  export default class MoneyRequestModal extends Vue {}
</script>
<style lang="scss" scoped>
  @import "@/assets/custom-variables";

  .search-area {
    background: #f0faf9;
  }
  .button.action {
    white-space: normal;
    height: auto;
  }
  .card-recipient-wrapper {
    width: 90%;
  }
  .favorit-icon-wrapper {
    width: 10%;
  }
  .modal-card-body {
    min-height: 120px;
  }
  .amount-currency-symbol {
    margin: auto;
    font-size: 1.25em;
    font-weight: bold;
    line-height: 1em;
    padding-bottom: calc(0.5em - 1px);
    padding-left: calc(0.75em - 1px);
    padding-right: calc(0.75em - 1px);
    padding-top: calc(0.5em - 1px);
  }
  .w-100 {
    width: 100%;
  }
  .custom-search-bar {
    margin: auto;
  }
  .search-bar-container {
    width: 75%;
  }
  .qrcode-icon {
    font-size: 1.5em;
    opacity: 0.8;
    padding: 0.1em;
    border: 0.2em solid #e8e8e8;
    border-radius: 5px;
  }
  .custom-search-bar input {
    background: #ffffff;
    border: 1px solid #e8e8e8;
    border-radius: 24px;
    width: 100% !important;
  }

  .custom-pictogram-search svg {
    width: 24px !important;
    height: 24px !important;
  }

  .custom-pictogram-search path,
  rect {
    fill: $color-2 !important;
    background: $color-2 !important;
  }

  .custom-button-pictogram {
    background-color: inherit !important;
    border: none;
    cursor: pointer;
  }
  .qrcode-container {
    width: fit-content;
    margin: auto;
  }
</style>
