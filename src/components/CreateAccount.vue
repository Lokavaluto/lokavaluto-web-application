<template>
  <main class="main pb-4">
    <div v-if="getUnconfiguredBackends().length > 1" class="container">
      <div class="columns mt-5">
        <div class="column">
          <div class="card custom-card-wallet">
            <div class="">
              <ul>
                <template v-for="(backend, index) in getUnconfiguredBackends()">
                  <div
                    v-bind:class="{
                      'is-wallet-active': form.accountBackend === backend,
                    }"
                    @click="form.accountBackend = backend"
                    class="
                      button
                      is-wallet
                      has-text-weight-medium
                      is-rounded
                      ml-3
                    "
                  >
                    <li>
                      <a class="wallet-tab">
                        <div>{{ backend }}</div>
                      </a>
                    </li>
                  </div>
                </template>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="container mt-5">
      <div class="columns">
        <div class="column">
          <div class="card custom-card">
            <div class="card-content">
              <p class="mb-3">
                {{
                  $gettext(
                    "Choose the password for your wallet. It is different " +
                      "from your user account password and is only related to " +
                      "your wallet."
                  )
                }}
              </p>
              <p class="notification is-danger">
                {{
                  $gettext(
                    "Please note that this password can not be retrieved, " +
                      "so be sure to keep it in a safe and reachable place."
                  )
                }}
              </p>
            </div>
          </div>
        </div>
        <div class="column">
          <div class="card custom-card">
            <div class="card-content">
              <h2 class="custom-card-title">
                {{ $gettext("Create my wallet") }}
              </h2>
              <div class="field">
                <label class="label">{{ $gettext("Password") }}</label>
                <div class="control has-icons-left has-icons-right">
                  <PasswordField
                    :password="form.accountPassword"
                    @update:password="(x) => (form.accountPassword = x)"
                    autocomplete="new-password"
                    v-bind:class="{
                      'is-danger': hasError('accountPassword'),
                      'is-success':
                        !hasError('accountPassword') &&
                        form.accountPassword.length > 1,
                    }"
                    :disabled="useSimplifiedAuth"
                    :icon-right="
                      hasError('accountPassword')
                        ? 'triangle-exclamation'
                        : null
                    "
                  />
                </div>
                <p v-if="hasError('accountPassword')" class="help is-danger">
                  <template v-for="err in form.errors.accountPassword">
                    <div>{{ err }}</div>
                  </template>
                </p>
              </div>

              <div class="field">
                <label class="label">{{
                  $gettext("Password confirmation")
                }}</label>
                <div class="control has-icons-left has-icons-right">
                  <input
                    @keyup.enter="createUserAccount"
                    class="input"
                    autocomplete="new-password"
                    v-bind:class="{
                      'is-danger': hasError('accountPasswordConfirm'),
                      'is-success':
                        !hasError('accountPasswordConfirm') &&
                        form.accountPasswordConfirm.length > 1,
                    }"
                    type="password"
                    :placeholder="$gettext('Password confirmation')"
                    v-model="form.accountPasswordConfirm"
                    :disabled="useSimplifiedAuth"
                  />
                  <span class="icon is-small is-left">
                    <fa-icon icon="key" />
                  </span>
                  <span
                    v-if="hasError('accountPasswordConfirm')"
                    class="icon is-small is-right"
                  >
                    <fa-icon icon="triangle-exclamation" />
                  </span>
                </div>
                <p
                  v-if="hasError('accountPasswordConfirm')"
                  class="help is-danger"
                >
                  {{ form.errors.accountPasswordConfirm[0] }}
                </p>
              </div>

              <div class="card-content" v-if="!hasFieldErrors">
                <AuthPref
                  :handler="handler"
                  :requestCredentials="requestCredentials"
                  :disabled="hasFieldErrors"
                  @saveConfig="saveSimplifiedAuthPref"
                />
              </div>

              <div class="field">
                <div class="control">
                  <button
                    class="button is-primary"
                    @click="createUserAccount()"
                    :disabled="hasFieldErrors"
                  >
                    {{ $gettext("Create my wallet") }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script lang="ts">
  import { markRaw } from "vue"
  import { Options, Vue } from "vue-class-component"
  import { LokAPIExc } from "@/services/lokapiService"
  import AuthPref from "@/components/AuthPref.vue"
  import PasswordField from "@/components/PasswordField.vue"
  import { mapGetters } from "vuex"
  import { debounceMethod } from "@/utils/debounce"
  import applyDecorators from "@/utils/applyDecorators"
  import { showSpinnerMethod } from "@/utils/showSpinner"

  @Options({
    name: "CreateAccount",
    components: { AuthPref, PasswordField },
    data() {
      return {
        handler: false,
        useSimplifiedAuth: false,
        form: {
          accountBackend: "",
          accountPassword: "",
          accountPasswordConfirm: "",
          errors: {
            accountPassword: [],
            accountPasswordConfirm: [],
          },
        },
      }
    },
    async created() {
      const accountAuth = await this.$auth.getAccountAuth("new")
      this.handler = markRaw(accountAuth.authPrefHandler)
    },
    mounted() {
      const unconfiguredBackends = this.getUnconfiguredBackends()
      if (unconfiguredBackends.length === 0) {
        this.$router.push("/")
        return
      }
      this.form.accountBackend = unconfiguredBackends[0]
    },
    watch: {
      getUnconfiguredBackends(newval, oldval): void {
        if (newval.length === 1) {
          this.form.accountBackend = newval[0]
        }
      },
      "form.accountPassword": function (): void {
        this.checkPasswordField("accountPassword")
        this.checkIsSame("accountPasswordConfirm", "accountPassword")
      },
      "form.accountPasswordConfirm": function (): void {
        this.checkIsSame("accountPasswordConfirm", "accountPassword")
      },
    },
    computed: {
      hasFieldErrors(): boolean {
        if (
          this.form.accountPassword.length === 0 ||
          this.form.accountPasswordConfirm.length === 0
        )
          return true
        return (
          Object.keys(this.form.errors).filter((field) => {
            return this.form.errors[field].length > 0
          }).length > 0
        )
      },
      requestCredentials() {
        return () => {
          if (this.hasFieldErrors)
            throw Error(
              "This action should not be triggerable when there are still form errors."
            )
          this.useSimplifiedAuth = true
          return this.form.accountPassword
        }
      },

      ...mapGetters(["getUnconfiguredBackends"]),
    },
    methods: {
      async checkPasswordField(fieldname: string, accountBackend: string) {
        this.form.errors[fieldname] = await this.$store.dispatch(
          "checkPasswordStrength",
          [this.form[fieldname], this.form["accountBackend"]]
        )
      },
      checkIsSame(fieldOne: string, fieldTwo: string): void {
        if (this.form[fieldOne] !== this.form[fieldTwo]) {
          this.form.errors[fieldOne] = [this.$gettext("Passwords do not match")]
        } else {
          this.form.errors[fieldOne] = []
        }
      },
      hasError(field: string): boolean {
        return this.form.errors[field].length > 0
      },
      saveSimplifiedAuthPref(accountAuthService: any, userConfigInput: any) {
        this.userAuthPref = [accountAuthService, userConfigInput]
      },
      createUserAccount: applyDecorators(
        [showSpinnerMethod(".main"), debounceMethod],
        async function (this: any): Promise<void> {
          let userAccount
          try {
            userAccount = await this.$store.dispatch("createUserAccount", [
              this.form["accountPassword"],
              this.form["accountBackend"],
            ])
          } catch (err) {
            console.error(
              "Something went wrong on createUserAccount request",
              err
            )
            if (!(err instanceof LokAPIExc.UserAccountAlreadyExists)) {
              this.$msg.error(
                this.$gettext("Wallet creation unexpectedly failed.") +
                  " " +
                  this.$gettext(
                    "Please try again or contact your administrator"
                  )
              )

              return // stay on page
            }
            this.$msg.warning(this.$gettext("Wallet already created"))
          }

          if (this.userAuthPref) {
            try {
              const [accountAuthService, userConfigInput] = this.userAuthPref
              accountAuthService.configId = userAccount.internalId
              await accountAuthService.setUserConfig(userConfigInput)
            } catch (err) {
              console.error(
                "Something went wrong on createUserAccount request",
                err
              )
              this.$msg.error(
                this.$gettext(
                  "Settings for simplified authentication were not saved correctly... " +
                    'Please try again in the "Settings" page or contact your administrator'
                )
              )
            }
          }
          this.$store.dispatch("fetchComponentDefs")
          this.$router.push({ name: "dashboard" })
        }
      ),
    },
  })
  export default class CreateAccount extends Vue {}
</script>
<style lang="scss" scoped>
  @import "@/assets/custom-variables";
  .auth-card {
    margin-top: 10px;
  }
  .is-wallet {
    color: $btn-top-up-text-color !important;
    border-color: $btn-top-up-border-color !important;
    background: $color-2;
    opacity: 0.7;
  }
  .is-wallet-active {
    color: $btn-top-up-text-color !important;
    border-color: $btn-top-up-border-color !important;
    background: $color-2;
    opacity: 1;
  }
  .wallet-tab {
    background-color: $color-1;
    color: #ffffff;
  }
  .wallet-tab:hover {
    color: #ffffff;
  }
  .custom-card-wallet {
    border-radius: 16px !important;
    padding: 0.8em;
  }
</style>
