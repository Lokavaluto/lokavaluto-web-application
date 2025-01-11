<template>
  <main class="main">
    <div class="container mt-5">
      <div class="columns is-tablet">
        <div class="column">
          <div class="transactions card custom-card custom-card-padding">
            <div class="notification is-danger is-light" v-if="hasLoadingError">
              <p class="mb-4">
                {{
                  $gettext(
                    "An unexpected issue occurred while loading the " +
                      "top up request list. Sorry for the inconvenience"
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
              v-else-if="pendingCreditRequests.length === 0"
            >
              {{ $gettext("No top up request awaiting approval") }}
            </p>
            <div v-else>
              <h2 class="custom-card-title">
                {{ $gettext("Top up requests await approval") }}
              </h2>
              <table class="table is-striped is-fullwidth">
                <thead>
                  <tr>
                    <th class="row-user-header">
                      {{ $gettext("User") }}
                    </th>
                    <th class="row-amount-header">
                      {{ $gettext("Amount") }}
                    </th>
                    <th class="row-amount-header">
                      {{ $gettext("Date") }}
                    </th>
                    <th class="row-validate-header has-text-right">
                      {{ $gettext("Approve") }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="request in pendingCreditRequests"
                    v-bind:key="request"
                  >
                    <td class="row-user">
                      {{ request.related }}
                      {{
                        request.markBackend ? `(on ${request.backendId})` : ""
                      }}
                    </td>
                    <td>
                      {{ numericFormat(parseFloat(request.amount)) }}
                      {{ request.currency }}
                    </td>
                    <td>
                      <h5 class="date">
                        {{ dateFormat(request.date) }}
                      </h5>
                      <h5 class="status relative-date mt-1">
                        {{ relativeDateFormat(request.date) }}
                      </h5>
                    </td>
                    <td class="has-text-right">
                      <a
                        class="
                          button
                          is-primary
                          custom-button custom-inverted
                          is-small is-pulled-right
                        "
                        v-on:click="validateCreditRequest(request)"
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
  </main>
</template>

<script lang="ts">
  import { mapGetters } from "vuex"
  import { Options, Vue } from "vue-class-component"
  import { showSpinnerMethod } from "@/utils/showSpinner"
  import applyDecorators from "@/utils/applyDecorators"
  import { debounceMethod, debounceMethodWithOpts } from "@/utils/debounce"
  @Options({
    name: "PendingCredits",
    data() {
      return {
        hasLoadingError: false,
        validationRequestOngoing: [],
      }
    },
    mounted() {
      this.updatePendingCreditRequests()
    },
    computed: {
      pendingCreditRequests(): Array<any> {
        return this.$store.state.lokapi.pendingCreditRequests
      },
      ...mapGetters(["numericFormat", "relativeDateFormat", "dateFormat"]),
    },
    methods: {
      validateCreditRequest: applyDecorators(
        [
          debounceMethodWithOpts({
            keyFn: (request: any) => request.jsonData.odoo.credit_id,
          }),
          showSpinnerMethod(".transactions"),
        ],
        async function (this: any, request: any): Promise<void> {
          if (this.validationRequestOngoing.includes(request)) {
            console.log("Debounced `.validateCreditRequest()` call")
            return
          }
          this.validationRequestOngoing.push(request)
          try {
            await request.validate()
          } catch (err: any) {
            if (err.message === "User canceled the dialog box") {
              // A warning message should have already been sent
              return
            }
            this.$msg.error(
              this.$gettext(
                "An issue occured upon the approval of the credit " +
                  "request of %{ name }",
                {
                  name: request.related,
                }
              )
            )
            throw err
          } finally {
            this.validationRequestOngoing.splice(
              this.validationRequestOngoing.indexOf(request),
              1
            )
          }
          this.$store.dispatch("fetchPendingCreditRequests")
          this.$msg.success(
            this.$gettext(
              "Top up request from %{ name } of %{ amount } %{ currency } was validated.",
              {
                name: request.related,
                amount: request.amount,
                currency: request.currency,
              }
            )
          )
        }
      ),
      updatePendingCreditRequests: applyDecorators(
        [debounceMethod, showSpinnerMethod(".transactions")],
        async function (this: any): Promise<void> {
          try {
            await this.$store.dispatch("fetchPendingCreditRequests")
            this.hasLoadingError = false
          } catch (e: any) {
            console.error("Failed to fetch pending credit requests", e)
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
   width: 60%
  .row-amount-header
   width: 20%
  .row-validate-header
   width: 20%
  .row-user
   overflow: hidden
   text-overflow: ellipsis
  table
   table-layout: fixed
  .relative-date
    color: rgba(53, 53, 53, 0.64)
  .date
    font-size: 1.2rem
    line-height: 1.5rem
</style>
