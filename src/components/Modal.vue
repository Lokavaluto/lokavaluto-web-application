<template>
  <component
    v-for="modal in $modal.modals.value"
    :is="modal"
    tabindex="0"
    @keyup.esc="$modal.close()"
  />
</template>
<script lang="ts">
  import { Options, Vue } from "vue-class-component"

  import MoneyTransferModal from "./MoneyTransferModal.vue"
  import MoneyCreditModal from "./MoneyCreditModal.vue"
  import AboutModal from "./AboutModal.vue"
  import TransactionListModal from "./TransactionListModal.vue"
  import ConfirmPaymentModal from "./ConfirmPaymentModal.vue"
  import QrCodeModal from "./QrCodeModal.vue"
  import MoneyRequestModal from "./MoneyRequestModal.vue"

  @Options({
    name: "Modal",
    components: {
      MoneyTransferModal,
      MoneyCreditModal,
      AboutModal,
      TransactionListModal,
      ConfirmPaymentModal,
      QrCodeModal,
      MoneyRequestModal,
    },
    data() {
      return {
        callbacks: {},
      }
    },
    created() {
      this.$modal.register({
        show: (label: string) =>
          new Promise((resolve, reject) => {
            if (this.callbacks[label])
              throw new Error(`Modal '${label}' already opened.`)
            this.callbacks[label] = { resolve, reject }
          }),
        hide: (label: string, data: any) => {
          if (data instanceof Error) {
            this.callbacks[label].reject(data)
          } else {
            this.callbacks[label].resolve(data)
          }
          delete this.callbacks[label]
        },
      })
    },
  })
  export default class Modal extends Vue {}
</script>
<style lang="scss" scoped>
  .modal-card {
    position: relative;
    top: -5vh;
  }
</style>
