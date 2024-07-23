<template>
  <div class="modal is-active">
    <div class="modal-background"></div>
    <template v-if="$modal.step.value == 1">
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title is-title-shrink">
            {{ $gettext("Send money") }} - 1/2
          </p>
          <button class="delete" aria-label="close" @click="close()"></button>
        </header>
        <div class="search-area">
          <div
            class="
              mt-4
              is-flex is-justify-content-space-evenly is-align-items-center
              custom-search-bar
            "
          >
            <span class="search-bar-container">
              <p class="control has-icons-left custom-search-bar">
                <input
                  v-model="recipientsSearchString"
                  @input="
                    (e) => {
                      ;(recipientsSearchString = e.target.value),
                        recipientsSearchString.length === 0 ||
                        recipientsSearchString.length >= 3
                          ? recipientBatchLoader.newGen(recipientsSearchString)
                          : null
                    }
                  "
                  class="input"
                  type="text"
                  :placeholder="$gettext('Name, email address or phone number')"
                  ref="searchRecipient"
                />
                <span class="icon is-small is-left">
                  <fa-icon icon="search" />
                </span>
              </p>
            </span>
            <span class="icon is-small" @click="startScan"
              ><fa-icon class="qrcode-icon" icon="qrcode" />
            </span>
          </div>
          <div
            class="
              is-flex is-justify-content-space-evenly is-align-items-center
              mt-3
            "
          ></div>
          <div class="container is-fluid custom-heavy-line-separator"></div>
        </div>
        <section
          class="modal-card-body"
          ref="recipientsContainer"
          @scroll="recipientBatchLoader.getNextElements"
        >
          <div
            v-if="recipientsSearchError"
            class="notification is-light is-danger"
          >
            {{
              $gettext(
                "An unexpected issue occurred while performing recipient lookup. " +
                  "We apologise for the inconvenience."
              )
            }}
          </div>
          <div
            v-else
            class="
              custom-card
              is-flex-direction-column
              is-align-items-center
              is-justify-content-space-between
            "
          >
            <template v-if="ownCurrenciesRecipients">
              <div
                class="is-clickable py-2"
                v-for="(recipient, index) in ownCurrenciesRecipients"
              >
                <RecipientItem
                  :recipient="recipient"
                  :key="index"
                  @select="handleClickRecipient(recipient)"
                />
              </div>
            </template>
            <loading
              v-if="recipientBatchLoader.isNewBatchLoading.value"
              v-model:active="recipientBatchLoader.isNewBatchLoading.value"
              :can-cancel="false"
              :is-full-page="false"
              :width="30"
              :height="30"
              class="loader-container"
            />
            <div
              v-if="
                recipientBatchLoader.hasNoMoreElements.value &&
                ownCurrenciesRecipients.length === 0
              "
              class="is-flex is-align-items-center is-justify-content-center"
            >
              {{ $gettext("No recipients found") }}
            </div>
          </div>
        </section>
        <footer class="modal-card-foot is-justify-content-flex-end">
          <!--  <button class="button is-success">Save changes</button>
        <button class="button">Cancel</button> -->
        </footer>
      </div>
    </template>
    <template v-if="$modal.step.value == 2 && selectedRecipient">
      <div class="modal-card">
        <header class="modal-card-head">
          <span v-if="!transactionType" class="is-flex is-flex-shrink-0">
            <a
              class="mr-3 is-flex"
              @click="$modal.back(), setFocus('searchRecipient')"
            >
              <span class="icon has-text-white">
                <fa-icon icon="arrow-left" class="fa-lg" />
              </span>
            </a>
          </span>
          <p class="modal-card-title is-title-shrink">
            {{
              transactionType === "reconversion"
                ? $gettext("Money reconversion")
                : $gettext("Send money") + " - 2/2"
            }}
          </p>
          <button class="delete" aria-label="close" @click="close()"></button>
        </header>
        <section class="modal-card-body">
          <MoneyTransaction
            directionTransfer="send"
            :account="ownSelectedAccount"
            :selectedRecipient="selectedRecipient"
            :config="config"
            :parentErrors="errors"
            :transactionType="transactionType"
            @update:amount="(x) => (amount = x)"
            @update:senderMemo="(x) => (senderMemo = x)"
            @update:recipientMemo="(x) => (recipientMemo = x)"
            @update:isValid="(x) => (isValid = x)"
            @change="errors = false"
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
            class="button custom-button-modal has-text-weight-medium"
            id="send-money-button"
            @click="sendTransaction()"
            :disabled="!isValid"
          >
            {{
              transactionType === "reconversion"
                ? $gettext("Reconversion")
                : $gettext("Send")
            }}
          </button>
        </footer>
      </div>
    </template>
  </div>
</template>
<script lang="ts">
  import { Options, Vue } from "vue-class-component"
  import { mapModuleState } from "@/utils/vuex"
  import { e as LokapiExc } from "@lokavaluto/lokapi-browser"

  import "vue-loading-overlay/dist/css/index.css"
  import RecipientItem from "@/components/RecipientItem.vue"
  import { UIError } from "../exception"
  import { makeUIProxyBackend } from "@/services/lokapiService"
  import MoneyTransaction from "./MoneyTransaction.vue"
  import UseBatchLoading from "@/services/UseBatchLoading"
  import { debounceMethod } from "@/utils/debounce"

  @Options({
    name: "MoneyTransferModal",
    components: {
      RecipientItem,
      MoneyTransaction,
    },
    data() {
      return {
        recipientsSearchString: "",
        recipientsSearchError: false,
        selectedRecipient: null,
        ownSelectedAccount: null,
        amount: null,
        config: {},
        senderMemo: null,
        recipientMemo: null,
        errors: false,
        account: null,
        isValid: false,
        transactionType: null,
      }
    },
    created() {
      const [opts] = this.$modal.args.value
      let { account } = opts
      if (account._obj?.getTransactions) {
        account = account._obj
      } else {
        account = account._obj.parent
      }
      this.account = account
      // No need to declare in data, no live mechanism required here
      this.selectedBackend = makeUIProxyBackend(account.parent, this.$gettext)

      this.recipientBatchLoader = UseBatchLoading({
        genFactory: this.selectedBackend.searchRecipients.bind(
          this.selectedBackend
        ),
        needMorePredicate: () =>
          this.$refs.recipientsContainer.scrollHeight -
            (this.$refs.recipientsContainer.scrollTop +
              this.$refs.recipientsContainer.offsetHeight) <=
          50,
        onError: (e) => {
          this.$msg.error(
            this.$gettext(
              "An unexpected issue occured while downloading recipient list"
            )
          )
          console.error(e)
        },
      })
    },
    mounted() {
      if (this.$modal.args.value[0]?.transactionType === "reconversion") {
        this.transactionType = "reconversion"
        this.toPaymentStage({
          recipient: this.$modal.args.value[0].account.safeWalletRecipient,
        })
      } else {
        this.setFocus("searchRecipient")
        this.recipientBatchLoader.newGen("")
      }
    },
    computed: {
      ...mapModuleState("lokapi", ["userProfile"]),
      ownCurrenciesRecipients(): Array<any> {
        let currencyIds = this.$store.getters.activeVirtualAccounts.map(
          (a: any) => a.currencyId
        )
        return this.recipientBatchLoader.elements.value.filter((p: any) => {
          return currencyIds.indexOf(p.backendId) > -1
        })
      },
    },
    methods: {
      async startScan() {
        const scanPermission = await this.$qrCode.isPermissionGranted()
        if (!scanPermission) {
          this.$qrCode.stopScan()
          return
        }
        this.$loading.show()
        await this.$qrCode.prepare()
        this.$loading.hide()

        const result = await this.$qrCode.read()
        let resultData
        try {
          resultData = JSON.parse(result.content)
        } catch (err) {
          throw new UIError(
            this.$gettext("Invalid QR code content format"),
            err
          )
        }
        const { rp, rpb } = resultData
        if (rp === this.userProfile.id) {
          this.$msg.error(
            this.$gettext("You can not transfer money to your own account")
          )
          return
        }
        if (!result.hasContent) {
          this.$msg.error(this.$gettext("Unable to read QR code"))
          return
        }
        let recipient

        this.transactionType = "requestPay"
        try {
          recipient = await this.selectedBackend.searchRecipientByUri({
            rp,
            rpb,
          })
        } catch (err) {
          this.$msg.error(
            this.$gettext("An error occured while searching recipient")
          )
          throw err
        }
        await this.toPaymentStage({
          recipient,
          amount: resultData.amount,
          senderMemo: resultData.senderMemo,
          recipientMemo: resultData.recipientMemo,
        })
      },
      handleClickRecipient(recipient: any): void {
        return this.toPaymentStage({ recipient })
      },
      async toPaymentStage(config: any): Promise<void> {
        this.selectedRecipient = config.recipient
        this.selectedRecipient.currencySymbol =
          await config.recipient.getSymbol()
        this.ownSelectedAccount =
          this.$store.getters.activeVirtualAccounts.find(
            (va: any) => va.currencyId === config.recipient.backendId
          )
        this.$modal.next()
        this.errors = false
        this.amount = config?.amount || null
        this.sendermemo = config?.senderMemo
        this.recipientMemo = config?.recipientMemo
        this.config = config
      },
      sendTransaction: debounceMethod(async function (): Promise<void> {
        this.errors = false
        if (this.ownSelectedAccount._obj.getBalance) {
          let realBal
          try {
            realBal = await this.ownSelectedAccount._obj.getBalance("latest")
          } catch (err) {
            this.$msg.error(
              this.$gettext(
                "An unexpected issue occurred while checking available funds. " +
                  "The transaction was not sent. We are sorry for the inconvenience."
              ) +
                "<br/>" +
                this.$gettext(
                  "You can try again. If the issue persists, " +
                    "please contact your administrator."
                )
            )
            console.error("getBalance failed:", err)
            return
          }
          // ensure realBal is the correct format
          if (!(realBal.includes(".") && realBal.split(".")[1].length === 2)) {
            throw new Error("Invalid amount returned by getBalance", realBal)
          }
          const amount_cents = parseInt(this.amount.replace(".", ""))
          const realBal_cents = parseInt(realBal.replace(".", ""))
          const bal_cents = parseInt(
            this.ownSelectedAccount.bal.replace(".", "")
          )
          // ensure we are in safe limits (we could use BigInt if needed)
          Object.entries({ amount_cents, realBal_cents, bal_cents }).forEach(
            ([label, value]) => {
              if (value > Number.MAX_SAFE_INTEGER)
                throw new Error(
                  `Amount '${label.split("_")[0]}' exceeds safe max values ` +
                    `for current internal representation (value: ${value})`
                )
            }
          )
          if (amount_cents > bal_cents) {
            this.errors = this.$gettext("Insufficient balance")
            return
          }
          if (amount_cents > realBal_cents) {
            this.errors = this.$gettext(
              "The last transactions were not yet all processed. " +
                "To ensure that this payment can be sent, you need " +
                "to wait for these pending transactions to be processed. " +
                "This can take a few minutes. You can also lower your " +
                "transaction amount underneath %{ realBal } %{ currency }. " +
                "If the problem persists, please contact an administrator.",
              {
                realBal,
                currency: this.ownSelectedAccount.curr,
              }
            )
            return
          }
        }

        let dateBegin = Date.now()
        let payment
        this.$store.commit("setRequestLoadingAfterCreds", true)
        try {
          payment = await this.selectedRecipient.transfer(
            this.amount.toString(),
            this.senderMemo,
            this.recipientMemo
          )
        } catch (err: any) {
          if (err instanceof LokapiExc.PaymentConfirmationMissing) {
            this.$modal.args.value[0].refreshTransaction()
            this.close()
            this.$msg.warning(
              this.$gettext(
                "The transaction was sent but no confirmation was received. "
              ) +
                "<br/>" +
                this.$gettext(
                  "Please make sure to double check in the transaction list " +
                    "if this transaction appears in the near future. "
                ) +
                "<br/>" +
                this.$gettext(
                  "Contact your administrator if it fails to show up."
                ),
              false
            )
            return
          }
          if (err instanceof LokapiExc.InsufficientBalance) {
            this.errors = this.$gettext(
              "Transaction was refused due to insufficient balance"
            )
            return
          }
          if (err instanceof LokapiExc.InactiveAccount) {
            this.$msg.error(
              this.$gettext("Target account is inactive.") +
                "<br/>" +
                this.$gettext("You can't send money to this account.")
            )
            return
          }
          if (err.message === "User canceled the dialog box") {
            // A warning message should have already been sent
            return
          }
          this.$msg.error(
            this.$gettext(
              "An unexpected issue occurred during the money transfer. " +
                "We are sorry for the inconvenience."
            ) +
              "<br/>" +
              this.$gettext(
                "You can try again. If the issue persists, " +
                  "please contact your administrator."
              )
          )

          console.error("Payment failed:", err)
          return
        } finally {
          this.$store.commit("setRequestLoadingAfterCreds", false)
          this.$loading.hide()
        }

        this.errors = false
        this.$modal.args.value[0].refreshTransaction()
        this.$modal.args.value[0].refreshAccounts(true)
        this.close()

        await this.$modal.open("ConfirmPaymentModal", {
          transaction: payment,
          type:
            this.transactionType === "reconversion"
              ? "reconversion"
              : "paymentConfirmation",
        })
        if (
          !this.selectedRecipient.is_favorite &&
          this.transactionType !== "reconversion"
        ) {
          this.$dialog
            .show({
              title: this.$gettext("Add as favorite"),
              content: this.$gettext(
                "Do you want to add %{ name } to your favorite list ?",
                { name: this.selectedRecipient.name }
              ),
              buttons: [
                { label: this.$gettext("Add"), id: "add" },
                { label: this.$gettext("Later"), id: "later" },
              ],
            })
            .then(async (result: any) => {
              if (result === "later") return
              try {
                await this.selectedRecipient.toggleFavorite()
              } catch (err) {
                // XXXvlab: using ``.then`` makes it trigger outside of
                // view js grasp.
                this.$errorHandler(err)
                return
              }
              this.$msg.success(
                this.$gettext("%{ name } was added to your favorite list", {
                  name: this.selectedRecipient.name,
                })
              )
            })
        }
      }),
      wait(ms: number): Promise<void> {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve()
          }, ms)
        })
      },
      close() {
        this.searchName = ""
        this.amount = 0
        this.activeClass = 0
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
  export default class MoneyTransferModal extends Vue {}
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
  .loader-container {
    position: relative;
    height: 80px;
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
</style>
