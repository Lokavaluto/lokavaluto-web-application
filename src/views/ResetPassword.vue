<template>
  <section id="reset-password">
    <div class="form-container">
      <div class="card">
        <img
          v-if="$config.loginLogoUrl"
          :src="$config.loginLogoUrl"
          class="pt-2 pb-5"
        />
        <div class="mb-3">
          {{
            $gettext(
              "Please enter the email address associated with your account below. We'll send you an email with instructions on how to reset your password"
            )
          }}
        </div>
        <form @submit.prevent="submit">
          <div class="field mb-5 has-addons">
            <p class="control has-icons-left is-expanded">
              <input
                v-model.trim="email"
                autocapitalize="none"
                class="input"
                :placeholder="$gettext('Email')"
              />
              <span class="icon is-small is-left">
                <fa-icon icon="envelope" />
              </span>
            </p>
          </div>
          <div class="reset-buttons">
            <div>
              <p class="control has-text-centered">
                <button type="submit" class="button is-login">
                  {{ $gettext("Reset password") }}
                </button>
              </p>
            </div>
          </div>
          <p class="has-text-danger has-text-centered mt-3" v-if="fail">
            {{ fail }}
          </p>
        </form>
      </div>
    </div>
    <router-view></router-view>
  </section>
</template>

<script lang="ts">
  import { Options, Vue } from "vue-class-component"
  import { RestExc } from "@lokavaluto/lokapi-browser"
  import { e as RequestExc } from "@0k/types-request"
  import { debounceMethod } from "@/utils/debounce"
  import applyDecorators from "@/utils/applyDecorators"
  import { showSpinnerMethod } from "@/utils/showSpinner"

  @Options({
    name: "ResetPassword",
    data() {
      return {
        email: "",
        fail: "",
        success: "",
      }
    },
    methods: {
      submit: applyDecorators(
        [debounceMethod, showSpinnerMethod("#reset-password")],
        async function (this: any): Promise<void> {
          try {
            await this.$lokapi.resetPassword(this.email.toLowerCase())
          } catch (e) {
            if (e instanceof RestExc.InvalidUserOrEmail) {
              this.fail = this.$gettext(
                "Unknown user or email. Please make sure to provide a valid username or email."
              )
              return
            }
            this.fail = this.$gettext(
              "Unexpected issue when attempting to connect to remote server."
            )
            console.log(e)
            return
          }
          this.success = this.$gettext("Email sent")
          this.$router.push({ name: "Login" })
        }
      ),
    },
  })
  export default class ResetPassword extends Vue {}
</script>
<style scoped lang="scss">
  @import "@/assets/custom-variables";
  #reset-password {
    position: absolute;
    display: table;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100%;
    width: 100%;
    .form-container {
      display: table-cell;
      vertical-align: middle;
      padding: 0 10px;
      .card {
        margin: 0 auto;
        max-width: 380px;
        padding: 20px;
        text-align: center;
        img {
          max-width: 200px;
        }
        .field {
          font-size: 2rem;
        }
        .reset-buttons {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @media screen and (min-width: 768px) {
          padding: 30px;
        }
      }
    }
  }
</style>
