<template>
  <main class="main">
    <div class="container mt-5">
      <div class="columns is-tablet">
        <div class="column">
          <div class="accounts card custom-card custom-card-padding">
            <div>
              <div
                class="notification is-danger is-light"
                v-if="hasLoadingError"
              >
                <p class="mb-4">
                  {{
                    $gettext(
                      "An unexpected issue occurred while loading the " +
                        "pending account list. Sorry for the inconvenience."
                    )
                  }}
                </p>
                <p>
                  {{
                    $gettext(
                      "You can try to refresh the page, if the issue " +
                        "persists, you may want to contact your " +
                        "administrator"
                    )
                  }}
                </p>
              </div>
              <p
                class="notification is-default"
                v-else-if="pendingUserAccounts.length === 0"
              >
                {{ $gettext("No account pending for approval") }}
              </p>
              <div v-else>
                <h2 class="custom-card-title">
                  {{ $gettext("Accounts waiting for approval") }}
                </h2>
                <table class="table is-striped is-fullwidth">
                  <thead>
                    <tr>
                      <th class="row-user-header">
                        {{ $gettext("User") }}
                      </th>
                      <th class="has-text-right row-validate-header">
                        {{ $gettext("Action") }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="account in pendingUserAccounts"
                      :key="account.id"
                    >
                      <td class="row-user">
                        {{ account.name }}
                        {{
                          account.markBackend
                            ? `(via ${account.backendId})`
                            : ""
                        }}
                      </td>
                      <td class="has-text-right">
                        <a
                          class="
                            button
                            is-primary
                            custom-button custom-inverted
                            is-small is-pulled-right
                            ml-2
                            mb-1
                          "
                          id="discard"
                          v-on:click="discardUserAccount(account)"
                        >
                          {{ $gettext("Discard") }}
                        </a>
                        <a
                          class="
                            button
                            is-primary
                            custom-button custom-inverted
                            is-small is-pulled-right
                          "
                          v-on:click="validateUserAccount(account)"
                        >
                          {{ $gettext("Approve") }}
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script lang="ts">
  import { Options, Vue } from "vue-class-component"
  import { UIError } from "@/exception"
  import { showSpinnerMethod } from "@/utils/showSpinner"
  import { debounceMethodWithOpts } from "@/utils/debounce"
  import applyDecorators from "@/utils/applyDecorators"

  @Options({
    name: "PendingAccounts",
    data() {
      return {
        hasLoadingError: false,
      }
    },
    mounted() {
      this.updatePendingAccount()
    },
    computed: {
      pendingUserAccounts(): Array<any> {
        return this.$store.state.lokapi.pendingUserAccounts
      },
    },
    methods: {
      validateUserAccount: applyDecorators(
        [
          debounceMethodWithOpts({
            keyFn: (account: any) => account.internalId,
          }),
          showSpinnerMethod(".accounts"),
        ],
        async function (this: any, account: any): Promise<void> {
          try {
            await account.validateCreation()
          } catch (err: any) {
            if (err.message === "User canceled the dialog box") {
              // A warning message should have already been sent
              return
            }

            throw new UIError(
              this.$gettext(
                "An unexpected issue occurred while approving " +
                  "the wallet account creation of user %{ name }",
                {
                  name: account.name,
                }
              ),
              err
            )
          }
          try {
            await this.updatePendingAccount()
          } catch (err) {
            throw new UIError(
              this.$gettext(
                "An unexpected issue occurred while updating the pending accounts list"
              ),
              err
            )
          }
        }
      ),
      discardUserAccount: applyDecorators(
        [
          debounceMethodWithOpts({
            keyFn: (account: any) => account.internalId,
          }),
          showSpinnerMethod(".accounts"),
        ],
        async function (this: any, account: any): Promise<void> {
          try {
            await account.discardCreateRequest()
          } catch (err) {
            throw new UIError(
              this.$gettext(
                "An unexpected issue occurred while discarding " +
                  "the wallet account creation of user %{ name }",
                {
                  name: account.name,
                }
              ),
              err
            )
          }

          try {
            await account.discardCreateRequest()
          } catch (err) {
            throw new UIError(
              this.$gettext(
                "An unexpected issue occurred while discarding " +
                  "the wallet account creation of user %{ name }",
                {
                  name: account.name,
                }
              ),
              err
            )
          }

          try {
            await this.updatePendingAccount()
          } catch (err) {
            throw new UIError(
              this.$gettext(
                "An unexpected issue occurred while updating the pending accounts list"
              ),
              err
            )
          }

          this.$msg.success(
            this.$gettext("User %{ name }'s account creation was discarded", {
              name: account.name,
            })
          )
        }
      ),
      updatePendingAccount: applyDecorators(
        [showSpinnerMethod(".accounts")],
        async function (this: any): Promise<void> {
          try {
            await this.$store.dispatch("fetchPendingUserAccounts")
            this.hasLoadingError = false
          } catch (e: any) {
            console.error("Failed to fetch pending accounts", e)
            this.hasLoadingError = true
          }
        }
      ),
    },
  })
  export default class Admin extends Vue {}
</script>
<style scoped lang="sass">
  .row-user-header
   width: 80%
  .row-validate-header
   width: 20%
  .row-user
   overflow: hidden
   text-overflow: ellipsis
  table
   table-layout: fixed
  body #discard
    background-color: #cc0f35
    border-color: #cc0f35
</style>
