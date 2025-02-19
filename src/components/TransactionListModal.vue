<template>
  <div
    class="modal is-active"
    v-if="$modal.modal.value == $options.name"
    ref="transactions"
  >
    <div class="modal-background"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title is-title-shrink">
          <span class="ml-2">{{ $gettext("All transactions") }}</span>
        </p>
        <button
          class="delete"
          aria-label="close"
          @click="$modal.back()"
        ></button>
      </header>
      <div class="filter-area">
        <div class="ml-2 mt-2">
          <div
            class="
              is-flex-direction-column
              is-align-items-center
              is-justify-content-space-between
              mb-2
            "
          >
            <div class="mb-1">
              <strong>{{ $gettext("Select timespan:") }}</strong>
            </div>
            <div class="datepicker-export">
              <date-picker
                v-model:value="exportDate"
                :open="datePickerShow ? true : null"
                range
                prefix-class="xmx"
                :editable="false"
                :placeholder="$gettext('All transactions')"
                @clear="
                  () => {
                    selectedTimeSpanType = ''
                    datePickerShow = false
                  }
                "
                @change="datePickerShow = selectedTimeSpanType ? true : false"
                @pick="selectedTimeSpanType = ''"
                :disabled-date="disabledDates"
              >
                <template #header="{ emit }">
                  <div>
                    <div
                      v-for="selector in selectorsOrder"
                      :class="{
                        selected: selector == selectedTimeSpanType,
                      }"
                      class="timespan"
                    >
                      <button
                        class="xmx-btn xmx-btn-text"
                        @click="
                          () => {
                            selectedTimeSpanOffset =
                              selectedTimeSpanType != selector
                                ? -1
                                : selectedTimeSpanOffset - 1
                            selectedTimeSpanType = selector
                            emit(selectedTimeSpan)
                          }
                        "
                      >
                        <i class="xmx-icon-left"></i>
                      </button>
                      <button
                        class="xmx-btn xmx-btn-text"
                        @click="
                          () => {
                            selectedTimeSpanType = selector
                            selectedTimeSpanOffset = 0
                            emit(selectedTimeSpan)
                          }
                        "
                      >
                        {{ selectorLabels[selector] }}
                      </button>
                      <button
                        class="xmx-btn xmx-btn-text"
                        @click="
                          ;[selectedTimeSpanOffset++, emit(selectedTimeSpan)]
                        "
                        :class="{
                          hide:
                            selectedTimeSpanType != selector ||
                            isSelectionCurrent,
                        }"
                      >
                        <i class="xmx-icon-right"></i>
                      </button>
                      <button
                        class="xmx-btn xmx-btn-text confirm"
                        @click="datePickerShow = false"
                        :class="{ hide: selectedTimeSpanType != selector }"
                      >
                        {{ $gettext("confirm") }}
                      </button>
                    </div>
                  </div>
                </template>
              </date-picker>
            </div>
            <div class="mb-1 mt-3">
              <strong>{{ $gettext("Select recipient:") }}</strong>
            </div>
            <div class="recipient-filter is-flex is-flex-direction-row">
              <div class="recipient-filter-input">
                <model-list-select
                  :list="
                    recipientBatchLoader.elements.map((r, idx) => ({
                      name: r.name,
                      idx,
                    }))
                  "
                  option-value="idx"
                  option-text="name"
                  v-model="selectedRecipientIdx"
                  :placeholder="$gettext('All recipient')"
                  @searchchange="onRecipientSearch"
                  id="recipientSelector"
                >
                </model-list-select>
              </div>
              <div>
                <button
                  class="recipient-filter-reset"
                  :class="{ disable: selectedRecipientIdx === null }"
                  @click="selectedRecipientIdx = null"
                >
                  <fa-icon
                    class="refreshing"
                    v-if="recipientBatchLoader.isNewBatchLoading"
                    icon="sync"
                  ></fa-icon>
                  <fa-icon
                    v-else-if="selectedRecipientIdx !== null"
                    icon="fa-xmark"
                  >
                  </fa-icon>
                  <fa-icon v-else icon="fa-user"></fa-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div
          class="
            mt-3is-flex
            is-justify-content-space-evenly is-align-items-center
          "
        ></div>
        <div class="container is-fluid custom-heavy-line-separator"></div>
      </div>
      <section
        class="modal-card-body"
        ref="transactionsContainer"
        @scroll="transactionBatchLoader.getNextElements"
      >
        <div
          class="
            custom-card
            is-flex-direction-column
            is-align-items-center
            is-justify-content-space-between
            mb-4
          "
        >
          <TransactionItem
            v-for="transaction in transactionBatchLoader.elements.value"
            :key="transaction"
            :transaction="transaction"
            @click="
              $modal.open('ConfirmPaymentModal', {
                transaction,
                type:
                  transaction.amount < 0 &&
                  $modal.args.value[0].account.safeWalletRecipient?.name ===
                    transaction.related
                    ? 'reconversion'
                    : 'transactionDetail',
              })
            "
          />
          <div
            v-if="
              transactionBatchLoader.elements.length == 0 &&
              !transactionBatchLoader.isNewBatchLoading.value
            "
            class="is-flex is-align-items-center is-justify-content-center"
          >
            {{ $gettext("No transaction found") }}
          </div>
          <Loading
            v-if="transactionBatchLoader.isNewBatchLoading.value"
            v-model:active="transactionBatchLoader.isNewBatchLoading.value"
            class="loader-container"
            :can-cancel="false"
            :is-full-page="false"
            :width="30"
            :height="30"
          />
          <div
            v-if="
              transactionBatchLoader.hasNoMoreElements.value &&
              transactionBatchLoader.elements.value.length === 0
            "
            class="is-flex is-align-items-center is-justify-content-center"
          >
            {{ $gettext("No transactions found") }}
          </div>
        </div>
      </section>
      <footer
        class="modal-card-foot custom-modal-card-foot is-justify-content-end"
      >
        <span v-if="getPlatform === 'web'" class="mr-2"
          ><button
            class="button custom-button-modal has-text-weight-medium"
            :title="$gettext('Download transactions')"
            @click="downloadCsvFile()"
            :disabled="isTransactionsLoading"
          >
            <span v-if="isTransactionsLoading" class="icon">
              <fa-icon
                icon="fa-circle-notch"
                :class="{ refreshing: isTransactionsLoading }"
                class="fa-lg"
              />
            </span>
            <span v-else class="icon">
              <fa-icon icon="fa-download" class="fa-lg" />
            </span>
            <span>{{ $gettext("Download") }}</span>
          </button></span
        ><span v-else class="ml-2"
          ><button
            class="button custom-button-modal has-text-weight-medium"
            :title="$gettext('Share transactions')"
            @click="shareCsvFile()"
            :disabled="isTransactionsLoading"
          >
            <span v-if="isTransactionsLoading" class="icon">
              <fa-icon
                icon="fa-circle-notch"
                :class="{ refreshing: isTransactionsLoading }"
                class="fa-lg"
              />
            </span>
            <span v-else class="icon">
              <fa-icon icon="fa-share" class="fa-lg" />
            </span>
            <span>{{ $gettext("Share") }}</span>
          </button>
        </span>
      </footer>
    </div>
  </div>
</template>
<script lang="ts">
  import { mapGetters } from "vuex"

  import { Options, Vue } from "vue-class-component"
  import Loading from "vue-loading-overlay"
  import DatePicker from "vue-datepicker-next"

  import { ModelListSelect } from "vue-search-select"
  import { Capacitor } from "@capacitor/core"
  import moment from "moment"

  import TransactionItem from "./TransactionItem.vue"

  import { UIError } from "../exception"

  // Assets

  import "vue-datepicker-next/index.css"
  import "vue-search-select/dist/VueSearchSelect.css"
  import "@/assets/datepicker.scss"

  import { mapModuleState } from "@/utils/vuex"
  import UseBatchLoading from "@/services/UseBatchLoading"

  import { showSpinnerMethod } from "@/utils/showSpinner"
  import applyDecorators from "@/utils/applyDecorators"
  import { debounceMethod } from "@/utils/debounce"

  @Options({
    name: "TransactionListModal",
    components: {
      Loading,
      DatePicker,
      TransactionItem,
      ModelListSelect,
    },

    data(this: any) {
      return {
        selectExportLoader: null,
        exportDate: ["", ""],
        datePickerShow: false,
        selectorLabels: {
          day: this.$gettext("day"),
          week: this.$gettext("week"),
          month: this.$gettext("month"),
          year: this.$gettext("year"),
        },
        selectorsOrder: ["day", "week", "month", "year"],
        selectedTimeSpanType: "",
        selectedTimeSpanOffset: 0,
        isTransactionsLoading: false,
        selectedRecipientIdx: null,
        recipientBatchLoader: null,
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
      const backend = account.parent

      this.recipientBatchLoader = UseBatchLoading({
        genFactory: backend.searchRecipients.bind(backend),
        needMorePredicate: () =>
          this.$recipients.scrollHeight -
            (this.$recipients.scrollTop + this.$recipients.offsetHeight) <=
          50,
        onError: (e) => {
          this.$msg.error(
            this.$gettext(
              "An unexpected issue occured while downloading recipient list"
            )
          )
          throw e
        },
      })
      this.transactionBatchLoader = UseBatchLoading({
        genFactory: this.getTransactions.bind(this),
        needMorePredicate: () => {
          const div = this.$refs.transactionsContainer
          return div.scrollHeight - (div.scrollTop + div.offsetHeight) <= 500
        },
        onError: () => {
          this.$msg.error(
            this.$gettext(
              "An unexpected issue occured while downloading transaction list"
            )
          )
        },
      })
    },
    async mounted() {
      this.setFocus()
      const $recipients = this.$el.querySelector(".menu")

      $recipients.addEventListener(
        "scroll",
        this.recipientBatchLoader.getNextElements.bind(
          this.recipientBatchLoader
        )
      )
      this.$recipients = $recipients
      this.recipientBatchLoader.newGen("")
      this.transactionBatchLoader.newGen("")
    },
    computed: {
      getPlatform(): string {
        return Capacitor.getPlatform()
      },
      isSelectionCurrent(): boolean {
        return moment().isBetween(this.exportDate[0], this.exportDate[1])
      },
      selectedTimeSpan() {
        const now = moment().toDate()
        const timeSpanType = this.selectedTimeSpanType
        const offset = this.selectedTimeSpanOffset
        const dateSelected = moment(now)
          .subtract(-offset, timeSpanType)
          .toDate()
        const [begin, end] = [
          moment(dateSelected).startOf(timeSpanType),
          moment(dateSelected).endOf(timeSpanType),
        ].map((m) => m.toDate())

        return [begin, now < end ? now : end]
      },
      ...mapModuleState("lokapi", ["userProfile"]),
      ...mapGetters(["numericFormat", "dateFormat"]),
    },
    methods: {
      setFocus() {
        this.$refs.transactions.focus()
      },
      async createCsvFile() {
        const transactions = []
        const [dateBegin, dateEnd] = this.exportDate

        this.isTransactionsLoading = true

        try {
          for await (const t of this.getTransactions()) {
            transactions.push(t)
          }
        } catch (e) {
          this.$msg.error(
            this.$gettext(
              "An unexpected issue occured while downloading transaction list"
            )
          )
          throw e
        } finally {
          this.isTransactionsLoading = false
        }

        let exportFileName
        if (dateBegin && dateEnd) {
          const dateBeginStr = moment(dateBegin).format("YYYY-MM-DD")
          const dateEndStr = moment(dateEnd).format("YYYY-MM-DD")
          exportFileName = `transactions_${dateBeginStr}_${dateEndStr}.csv`
        } else {
          exportFileName = "transactions.csv"
        }

        const columnOrder = [
          "sender",
          "receiver",
          "amount",
          "date",
          "description",
        ]
        const csvDataLine: { [key: string]: string }[] = [
          {
            sender: this.$gettext("Source"),
            receiver: this.$gettext("Target"),
            amount: this.$gettext("Amount"),
            date: this.$gettext("Date"),
            description: this.$gettext("Description"),
          },
        ]

        for (let e of transactions) {
          const name = e.related
          const [sender, receiver] = e.amount.startsWith("-")
            ? [this.userProfile.name, name]
            : [name, this.userProfile.name]
          const data: { [key: string]: string } = {
            sender,
            receiver,
            amount: this.numericFormat(e.amount),
            date: moment(e.date).format("YYYY-MM-DD HH:mm:ss"),
            description: e.description || "",
          }

          for (const s of columnOrder) {
            data[s] = '"' + data[s].replaceAll('"', '""') + '"'
          }

          csvDataLine.push(data)
        }

        return {
          csvContent:
            csvDataLine
              .map((dataLine) =>
                columnOrder.map((header) => dataLine[header]).join(",")
              )
              .join("\r\n") + "\r\n",
          exportFileName,
        }
      },
      downloadCsvFile: applyDecorators(
        [debounceMethod, showSpinnerMethod(".modal-card-body")],
        async function (this: any): Promise<void> {
          //this.selectExportLoader = 1
          let csvComponents
          try {
            csvComponents = await this.createCsvFile()
          } catch (e) {
            throw new UIError(
              this.$gettext("An error occured while creating the CSV file"),
              e
            )
          }
          const { csvContent, exportFileName } = csvComponents

          try {
            await this.$export.download(csvContent, exportFileName, "text/csv")
          } catch (e) {
            this.$msg.error(
              this.$gettext("Transaction list could not be downloaded")
            )
            throw e
          }
          this.$modal.close()
          this.$msg.success(this.$gettext("Transaction list downloaded"))
        }
      ),
      async shareCsvFile() {
        this.selectExportLoader = 2
        const { csvContent, exportFileName } = await this.createCsvFile()
        let dateBeginStr, dateEndStr
        if (this.exportDate[0] && this.exportDate[1]) {
          dateBeginStr = moment(this.exportDate[0]).format("YYYY-MM-DD")
          dateEndStr = moment(this.exportDate[1]).format("YYYY-MM-DD")
        } else {
          dateBeginStr = ""
          dateEndStr = ""
        }

        const message =
          dateBeginStr && dateEndStr
            ? this.$gettext(
                "Transaction list from %{ dateBeginStr } to %{ dateEndStr }",
                {
                  dateBeginStr,
                  dateEndStr,
                }
              )
            : this.$gettext("Transaction list")

        try {
          await this.$export.share(csvContent, exportFileName, message)
        } catch (e) {
          this.$msg.error(
            this.$gettext("Transaction list could not be downloaded")
          )
          throw e
        }
        this.$modal.close()
        this.$msg.success(this.$gettext("Transaction list shared"))
      },
      disabledDates(date: Date) {
        return date > moment().endOf("day").toDate()
      },
      async *getTransactions() {
        const [opts] = this.$modal.args.value
        const { account } = opts

        let gen
        if (account._obj?.getTransactions) {
          gen = account._obj.getTransactions()
        } else {
          gen = account._obj.parent.getTransactions()
        }

        const [dateBegin, dateEnd] = this.exportDate
        const selectedRecipientName =
          this.recipientBatchLoader.elements[this.selectedRecipientIdx]?.name

        for await (const t of gen) {
          if (dateBegin && t.date < dateBegin) break
          if (selectedRecipientName && selectedRecipientName !== t.related)
            continue
          if (dateEnd && t.date > dateEnd) continue
          yield t
        }
      },

      async onRecipientSearch(recipientsSearchString: any) {
        if (
          this.selectedRecipientIdx !== null &&
          recipientsSearchString === ""
        ) {
          return
        }
        if (
          recipientsSearchString.length > 2 ||
          recipientsSearchString.length === 0
        ) {
          this.recipientBatchLoader.newGen(recipientsSearchString)
        }
      },
    },
    watch: {
      selectedRecipientIdx: async function (newIdx, oldIdx): Promise<void> {
        this.onRecipientSearch("")
        this.transactionBatchLoader.newGen()
      },
      exportDate: async function (newExportDate): Promise<void> {
        const [newBegin, newEnd] = newExportDate
        const [normBegin, normEnd] = [
          newBegin ? moment(newBegin).startOf("day").toDate() : null,
          newEnd ? moment(newEnd).endOf("day").toDate() : null,
        ]
        if (
          normBegin &&
          normEnd &&
          (+newBegin != +normBegin || +newEnd != +normEnd)
        ) {
          this.exportDate = [normBegin, normEnd]
          return
        }
        this.transactionBatchLoader.newGen()
      },
    },
  })
  export default class TheTransactionList extends Vue {}
</script>
<style lang="scss">
  @import "@/assets/custom-variables";

  div.selected {
    background-color: $color-1;
  }

  div.timespan {
    padding: 0;
    margin: 0;
    border-radius: 2em;
    width: 15em;
    display: grid;
    grid-template-columns: 2em 5em 2em 6em;

    button.xmx-btn {
      text-align: center;
      border-radius: 2em;

      &.confirm {
        margin-left: 1em;
        &,
        &:hover {
          background-color: $color-2;
          color: $color-1;
        }
      }
    }
  }
  .datepicker-export {
    .xmx-datepicker-range {
      width: auto !important;
    }
  }
  div.xmx-datepicker-content {
    user-select: none;
  }
  .filter-area {
    background: #f0faf9;
  }
  .recipient-filter {
    width: 16.2em;
  }
  .recipient-filter-reset {
    position: relative;
    right: 1.5em;
    top: 0.7em;
    opacity: 0.5;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    z-index: 99;
  }
  .recipient-filter-input {
    width: 100%;
  }
  .loader-container {
    position: relative;
    height: 80px;
  }
  .ui.fluid.dropdown > .dropdown.icon {
    display: none;
  }
  button.disable {
    pointer-events: none;
  }
  @media only screen and (min-height: 1024px) {
    .ui.selection.dropdown .menu {
      max-height: 20em !important;
    }
  }
  @media only screen and (max-height: 1023px) and (min-height: 768px) {
    .ui.selection.dropdown .menu {
      max-height: 12em !important;
    }
  }
  @media only screen and (max-height: 767px) {
    .ui.selection.dropdown .menu {
      max-height: 7em !important;
    }
  }
</style>
