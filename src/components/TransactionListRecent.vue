<template>
  <div id="transaction-list-recent">
    <div
      class="section-card"
      id="the-transaction-list"
      v-if="transactions.length"
    >
      <h2 class="custom-card-title">{{ $gettext("Transactions") }}</h2>
      <div
        class="notification is-danger is-light"
        v-if="isTransactionsLoadingError"
      >
        <p class="mb-4">
          {{
            $gettext(
              "An unexpected issue occurred while loading the last " +
                "transactions. Sorry for the inconvenience."
            )
          }}
        </p>
        <p class="mb-4">
          {{
            $gettext(
              "You can try to refresh the page, if the issue persists, " +
                "you may want to contact your administrator"
            )
          }}
        </p>
      </div>
      <p v-else-if="transactions?.length === 0" class="notification is-default">
        {{ $gettext("No previous transactions in your history.") }}
      </p>
      <div v-else>
        <TransactionItem
          v-for="transaction in transactions"
          :key="transaction"
          :transaction="transaction"
          @click="
            $modal.open('ConfirmPaymentModal', {
              transaction,
              type:
                transaction.amount < 0 &&
                account.safeWalletRecipient?.name === transaction.related
                  ? 'reconversion'
                  : 'transactionDetail',
            })
          "
        />
        <div v-if="transactions.length" class="has-text-centered mt-5">
          <button
            @click="
              () => {
                $modal.open('TransactionListModal', { account })
              }
            "
            class="button custom-button custom-inverted"
          >
            {{ $gettext("See more") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { Options, Vue } from "vue-class-component"
  import TransactionItem from "./TransactionItem.vue"
  import { mapModuleState } from "@/utils/vuex"
  import { showSpinnerMethod } from "@/utils/showSpinner"
  import applyDecorators from "@/utils/applyDecorators"

  @Options({
    name: "TransactionListRecent",
    props: {
      refreshToggle: Boolean, // change of this props requests a refresh
      account: Object,
    },
    components: {
      TransactionItem,
    },
    data(this: any) {
      return {
        transactions: [],
        isTransactionsBatchLoading: false,
      }
    },
    mounted() {
      this.resetTransactionsGen()
    },
    computed: {},

    methods: {
      getNextFilteredTransactions: applyDecorators(
        [
          showSpinnerMethod(function (this: any, isLoading: boolean) {
            this.$emit("triggerTransactionRefresh", isLoading, this)
          }),
          showSpinnerMethod("#transaction-list-recent"),
        ],
        async function (this: any): Promise<void> {
          if (!this.transactionGen) return
          let transactions = []
          while (transactions.length < 5) {
            let next
            try {
              next = await this.transactionGen.next()
            } catch (e) {
              this.$msg.error(
                this.$gettext(
                  "An unexpected issue occured while downloading transaction list"
                )
              )
              console.log(
                "Exception when requesting next elements in transaction list:",
                e
              )
              break
            }
            if (next.done) {
              this.transactionGen = null
              break
            }
            transactions.push(<any>next.value)
          }
          this.transactions = transactions
        }
      ),
      resetTransactionsGen() {
        if (this.account._obj?.getTransactions) {
          this.transactionGen = this.account._obj.getTransactions()
        } else {
          this.transactionGen = this.account._obj.parent.getTransactions()
        }
        this.$nextTick(() => this.getNextFilteredTransactions())
      },
    },
    watch: {
      refreshToggle: function () {
        this.resetTransactionsGen()
      },
    },
  })
  export default class TransactionListRecent extends Vue {}
</script>
<style lang="scss" scoped>
  @import "../assets/custom-variables.scss";

  span.icon {
    color: $top-menu-link-color;
    background-color: transparent;
  }
</style>
