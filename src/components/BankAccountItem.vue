<template>
  <div
    class="account"
    :class="{ active: account.active }"
    @click="isSub || isAccountSelected || $emit('accountSelected', account)"
  >
    <div class="custom-inner-card card px-5 py-2 is-flex">
      <div class="is-size-5 is-flex-grow-1">
        <slot name="name">default name</slot>
        <div
          v-if="isTemporarilyUnavailable"
          class="account-backend is-size-6 error-msg"
        >
          {{ $gettext("Temporarily unavailable - please refresh") }}
        </div>
        <div v-if="isMultiCurrency && !isSub" class="account-backend is-size-6">
          {{ account?.backend }}
        </div>
        <span
          v-else-if="
            !$config.disableBusinessStatusDisplay && !isSub && isBusinessAccount
          "
          class="
            button
            custom-button
            is-pay is-rounded
            action
            account-type
            ml-1
          "
        >
          {{ $gettext("Pro") }}
        </span>
      </div>
      <div class="is-align-items-center is-flex">
        <span
          class="is-size-6-mobile is-size-4-tablet account-bal"
          v-if="account?.active"
        >
          {{ numericFormat(parseFloat(account?.bal)) }}
        </span>
        <span
          class="is-size-6-mobile is-size-4-tablet account-bal inactive"
          v-else
          >-.---,--</span
        >
        <span class="is-size-6-mobile is-size-5-tablet account-curr">{{
          account?.curr || "--"
        }}</span>
        <span
          :class="{
            hide: !isAccountSelected || isSub || !showSubAccounts,
          }"
        >
          <DropdownMenu
            :object="account"
            @refreshTransaction="refreshTransaction"
            @refreshAccounts="refreshAccounts"
          />
        </span>
      </div>
    </div>
    <div
      class="sub-accounts"
      v-if="
        account?.subAccounts &&
        account.subAccounts.length > 0 &&
        showSubAccounts
      "
    >
      <BankAccountItem
        v-for="account in account.subAccounts"
        :isSub="true"
        accountSelected="false"
        class="mt-4 subaccount"
        @accountSelected="$emit('accountSelected', account)"
        :account="account"
      >
        <template v-slot:name>{{ account.name() }}</template>
      </BankAccountItem>
    </div>
  </div>
</template>

<script lang="ts">
  import { mapGetters } from "vuex"
  import { Options, Vue } from "vue-class-component"
  import { mapModuleState } from "@/utils/vuex"
  import { UIError } from "../exception"
  import { e as LokapiExc } from "@lokavaluto/lokapi-browser"

  import DropdownMenu from "@/components/DropdownMenu.vue"
  @Options({
    name: "BankAccountItem",
    components: {
      DropdownMenu,
    },
    props: {
      isAccountSelected: Boolean,
      isSub: Boolean,
      account: Object,
      showSubAccounts: Boolean,
    },
    data() {
      return {
        isBusinessAccount: false,
      }
    },
    async mounted() {
      try {
        this.isBusinessAccount = await this.account?._obj.isBusinessAccount(
          this.$config.isAdministrativeBackendSourceOfBusinessStatus
        )
      } catch (err: any) {
        throw new UIError(
          this.$gettext(
            "An unexpected issue occurred while getting business account status"
          ),
          err
        )
      }
    },
    computed: {
      isTemporarilyUnavailable() {
        return (
          this.account instanceof Array &&
          this.account.length == 1 &&
          this.account[0] instanceof LokapiExc.BackendUnavailableTransient
        )
      },
      ...mapModuleState("lokapi", ["isMultiCurrency"]),
      ...mapGetters(["numericFormat"]),
    },
    methods: {
      accountSelected(account: any) {
        this.$emit("accountSelected", account)
      },
      refreshTransaction() {
        this.$emit("refreshTransaction")
      },
      refreshAccounts(retryUntilChange: boolean) {
        this.$emit("refreshAccounts", retryUntilChange)
      },
    },
  })
  export default class BankAccountItem extends Vue {}
</script>
<style lang="scss" scoped>
  @import "../assets/custom-variables";

  .account-name,
  .account-bal,
  .account-curr {
    color: $inner-card-text-color;
  }
  .account-bal {
    color: $inner-card-label-text-color;
    background-color: $inner-card-label-background-color;
    border-radius: 20px;
    padding: 0 0.5em;
  }
  .account-backend {
    color: $inner-card-text-color-backend;
  }
  .custom-inner-card {
    border-radius: 43px !important;
    background-color: $inner-card-background-color;
    border: 1px solid $inner-card-border-color;
  }
  .account:not(.subaccount) {
    &:not(.active) {
      opacity: 0.6;
      .custom-inner-card {
        border: 2px #eee solid;
        box-shadow: none;
      }
    }

    &.selected {
      background-color: transparent;
    }
    &:not(.selected) {
      .custom-inner-card {
        opacity: 0.8;
        border: 1px #eee solid;
      }
    }
  }
  .dropdown-item {
    font-size: inherit;
    -webkit-user-select: none; /* Chrome, Safari, Opera */
    -moz-user-select: none; /* Firefox */
    -ms-user-select: none; /* Internet Explorer/Edge */
    user-select: none; /* Standard syntax */
  }
  .dropdown-menu {
    @media screen and (max-width: 768px) {
      position: absolute;
      right: 0em;
      left: unset;
    }
  }
  .error-msg {
    font-style: italic;
  }

  .account-type {
    width: 2.2rem;
    height: 1.3rem;
    margin-top: 0.4rem;
    font-size: x-small;
  }
</style>
