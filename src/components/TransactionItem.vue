<template>
  <div
    class="p-3 shadow-bottom cursor-pointer tx-item"
    :class="{ highlight: transaction.isReconversion || transaction.isTopUp }"
  >
    <div class="is-flex-direction-column left">
      <h3
        :class="[
          transaction.amount.toString().charAt(0) == '-'
            ? 'custom-card-related has-text-danger'
            : 'custom-card-related has-text-success',
        ]"
      >
        {{ numericFormat(parseFloat(transaction.amount)) }}
        {{ transaction.currency }}
      </h3>

      <h5
        v-if="transaction.isTopUp || transaction.isReconversion"
        class="custom-card-type"
      >
        {{
          transaction.isTopUp ? $gettext("Top-up") : $gettext("Reconversion")
        }}
      </h5>
      <h4 v-else class="custom-card-related">
        {{ transaction.related }}
      </h4>

      <h5
        v-if="!transaction.isTopUp && !transaction.isReconversion"
        class="has-text-grey-light transaction-desc"
      >
        {{ transaction.description }}
      </h5>
    </div>
    <div
      v-if="
        $config.disableReconversionStatusDisplay !== true &&
        transaction.isReconversion
      "
      class="center"
    >
      <div class="status-label">{{ reconversionStatus }}</div>
      <div class="status-indicator">
        <WorkflowIndicator
          format="small"
          :stages="reconversionStatuses"
          :current="reconversionStatus"
        />
      </div>
    </div>
    <div class="is-pulled-right right">
      <h5 class="custom-card-related has-text-right">
        {{ dateFormat(transaction.date) }}
      </h5>
      <h5 class="status card-paiement-defaut-carte has-text-right mt-1">
        {{ relativeDateFormat(transaction.date) }}
        <fa-icon
          :class="{
            hide: transaction?.pending === true,
          }"
          icon="check"
          class="fa-thin"
        />
      </h5>
    </div>
  </div>
</template>

<script lang="ts">
  import { mapGetters } from "vuex"
  import { mapModuleState } from "@/utils/vuex"
  import { Options, Vue } from "vue-class-component"

  import WorkflowIndicator from "./WorkflowIndicator.vue"
  @Options({
    name: "TransactionItem",
    components: {
      WorkflowIndicator,
    },
    methods: {},
    props: {
      transaction: Object,
    },
    created() {
      this.reconversionStatusTranslations = {
        true: this.$gettext("sent"),
        received: this.$gettext("received"),
        invoiced: this.$gettext("invoiced"),
        paid: this.$gettext("processed"),
      }
      this.reconversionStatuses = [true, "received", "invoiced", "paid"]
        .map((v) => this.reconversionStatusTranslations[v.toString()])
        .join("|")
    },
    computed: {
      ...mapGetters(["numericFormat", "relativeDateFormat", "dateFormat"]),
      ...mapModuleState("lokapi", ["userProfile"]),

      reconversionStatus() {
        return this.reconversionStatusTranslations[
          this.transaction?.isReconversion.toString()
        ]
      },
    },
  })
  export default class TransactionItem extends Vue {}
</script>
<style lang="scss" scoped>
  @import "../assets/custom-variables.scss";
  h4.custom-card-related {
    min-height: 1rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .transaction-desc {
    word-wrap: break-word;
    overflow-wrap: break-word;
    width: 100%;
  }
  .card-paiement-defaut-carte {
    font-style: normal;
    font-weight: normal;
    line-height: 16px;
    color: rgba(53, 53, 53, 0.64);
  }
  .custom-card-related {
    font-size: 1.2rem;
    line-height: 1.5rem;
    width: auto !important;
  }
  .custom-card-type {
    font-size: 1.2rem;
    line-height: 1.5rem;
    font-style: italic;
    opacity: 0.8;
    width: auto !important;
  }
  .custom-line-separator {
    display: flex;
    height: 2px;
  }
  .status .fa-check {
    color: $color-2;
  }
  .shadow-bottom {
    box-shadow: 0 3px 6px -6px black;
  }
  .cursor-pointer {
    cursor: pointer;
  }
  .highlight {
    background-color: $inner-card-background-color;
    margin-top: 3px;
    border-radius: 1em;
  }

  .tx-item {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    .left {
      margin-right: auto;
      flex: 1 1 0;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-grow: 1;
    }

    .center {
      flex-grow: 1;
      margin: 0 auto; /* centers it if present */
      position: absolute;
      left: 50%;
      transform: translateX(-50%);

      .status-label {
        line-height: 1.2em;
        text-weight: bold;
        text-align: center;
        color: $color-2;
      }
      .status-indicator {
        line-height: 1.5em;
        text-align: center;
      }
    }

    .right {
      margin-left: auto;
      flex-grow: 0;
    }
  }
</style>
