<template>
  <div class="card custom-card custom-card-padding">
    <span
      :class="{
        hide: !refreshAwaitingList.size,
      }"
      class="icon is-small is-default is-pulled-right is-rounded refresh"
    >
      <fa-icon
        :class="{ refreshing: !!refreshAwaitingList.size }"
        icon="sync"
      />
    </span>
    <PendingTopUp
      :account="account"
      :refreshToggle="subRefreshToggle"
      @triggerTransactionRefresh="trigger"
      @refreshTransaction="$emit('refreshTransaction')"
    />
    <TransactionListRecent
      :account="account"
      :refreshToggle="subRefreshToggle"
      @triggerTransactionRefresh="trigger"
    />
  </div>
</template>

<script lang="ts">
  import { Options, Vue } from "vue-class-component"

  import TransactionListRecent from "./TransactionListRecent.vue"
  import PendingTopUp from "./PendingTopUp.vue"

  import { mapModuleState } from "@/utils/vuex"

  let timeout: any

  function clearRefresh() {
    if (timeout) {
      clearInterval(timeout)
      timeout = null
    }
  }

  function setupRefresh(fn: () => void, ms: number) {
    clearRefresh()
    timeout = setInterval(fn, ms)
  }

  @Options({
    name: "TheTransactionList",
    components: {
      TransactionListRecent,
      PendingTopUp,
    },
    props: {
      refreshToggle: Boolean,
      account: Object,
    },
    data() {
      return {
        refreshAwaitingList: new Set<any>(),
        subRefreshToggle: false,
      }
    },
    computed: {
      ...mapModuleState("lokapi", ["transactionsLoading", "lastTransactions"]),
    },
    mounted() {
      this.setRefreshIfNeeded()
    },
    unmounted() {
      clearRefresh()
    },

    methods: {
      trigger(value: boolean, issuer: any) {
        if (value) {
          this.refreshAwaitingList.add(issuer)
        } else {
          this.refreshAwaitingList.delete(issuer)
        }
      },
      setRefreshIfNeeded() {
        const transactionsRefreshInterval =
          this.$config.transactionsRefreshInterval || 90
        if (transactionsRefreshInterval != -1) {
          setupRefresh(() => {
            this.subRefreshToggle = !this.subRefreshToggle
          }, transactionsRefreshInterval * 1000)
        }
      },
    },
    watch: {
      refreshToggle() {
        this.subRefreshToggle = !this.subRefreshToggle
      },
    },
  })
  export default class TheTransactionList extends Vue {}
</script>

<style lang="scss">
  .custom-line-separator {
    display: flex;
    height: 5px;
  }
</style>
