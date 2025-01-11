<template>
  <section id="signup">
    <div class="signup-container">
      <div class="card">
        <img
          v-if="$config.loginLogoUrl"
          :src="$config.loginLogoUrl"
          class="pt-2 pb-5"
        />
        <div class="mb-3">
          {{
            $gettext(
              "Please fill in all the required fields below and click on Signup to create your account."
            )
          }}
        </div>

        <form @submit.prevent="submit">
          <div class="field mb-5">
            <div class="field mb-2">
              <p class="control has-icons-left is-expanded">
                <input
                  v-model.trim="email"
                  class="input"
                  v-bind:class="{
                    'is-danger': errors?.email,
                  }"
                  id="email"
                  :placeholder="$gettext('Email')"
                  @input="checkEmail"
                />
                <span class="icon is-small is-left">
                  <fa-icon icon="envelope" />
                </span>
              </p>
              <p v-if="errors?.email" class="help is-danger mt-2" align="left">
                {{ errors?.email }}
              </p>
            </div>
            <div class="field mb-2">
              <p class="control has-icons-left is-expanded">
                <input
                  v-model.trim="firstName"
                  class="input"
                  v-bind:class="{
                    'is-danger': errors?.firstName,
                  }"
                  id="first-name"
                  :placeholder="$gettext('Firstname')"
                  @input="checkFirstName"
                />
                <span class="icon is-small is-left">
                  <fa-icon icon="user" />
                </span>
              </p>
              <p
                v-if="errors?.firstName"
                class="help is-danger mt-2"
                align="left"
              >
                {{ errors?.firstName }}
              </p>
            </div>
            <div class="field mb-2">
              <p class="control has-icons-left is-expanded">
                <input
                  v-model.trim="lastName"
                  class="input"
                  v-bind:class="{
                    'is-danger': errors?.lastName,
                  }"
                  id="last-name"
                  :placeholder="$gettext('Lastname')"
                  @input="checkLastName"
                />
                <span class="icon is-small is-left">
                  <fa-icon icon="user" />
                </span>
              </p>
              <p
                v-if="errors?.lastName"
                class="help is-danger mt-2"
                align="left"
              >
                {{ errors?.lastName }}
              </p>
            </div>
            <div class="field mb-2">
              <p class="control has-icons-left">
                <PasswordField
                  :password="password"
                  @update:password="(x) => (password = x)"
                  v-bind:class="{
                    'is-danger': errors?.passwordStrength,
                    'is-success':
                      !errors?.passwordStrength && password.length > 0,
                  }"
                  id="password"
                  @input="checkPasswordStrength()"
                />
              </p>
              <p
                v-if="errors?.passwordStrength && password !== ''"
                class="help is-danger"
                align="left"
              >
                <template v-for="err in errors?.passwordStrength">
                  <div class="has-text-left">{{ err }}</div>
                </template>
              </p>
            </div>
            <div class="field mb-2">
              <p class="control has-icons-left">
                <input
                  v-model="confirmPassword"
                  class="input"
                  v-bind:class="{
                    'is-danger': confirmPassword && errors?.confirmPassword,
                  }"
                  id="confirm-password"
                  type="password"
                  :placeholder="$gettext('Confirm password')"
                  @input="checkConfirmPassword()"
                />
                <span class="icon is-small is-left">
                  <fa-icon icon="lock" />
                </span>
              </p>
              <p
                v-if="confirmPassword && errors?.confirmPassword"
                class="help is-danger mt-2"
              >
                {{ errors?.confirmPassword }}
              </p>
            </div>
          </div>
          <div class="sgnup-buttons">
            <div>
              <p class="control has-text-centered">
                <button
                  type="submit"
                  class="button is-login"
                  :disabled="!isFormValid"
                >
                  {{ $gettext("Sign up") }}
                </button>
              </p>
            </div>
          </div>
          <div>
            <p class="has-text-danger has-text-centered" v-if="errors?.default">
              {{ errors?.default }}
            </p>
          </div>
          <div class="signup-link">
            <button @click="$router.push({ name: 'Login' })" type="button">
              {{ $gettext("Already have an account ?") }}
            </button>
          </div>
        </form>
      </div>
    </div>
    <router-view></router-view>
  </section>
</template>

<script lang="ts">
  import { Options, Vue } from "vue-class-component"
  import { RestExc } from "@lokavaluto/lokapi-browser"
  import PasswordUtilsFactory from "@/utils/password"
  import PasswordField from "@/components/PasswordField.vue"
  import { UIError } from "../exception"
  import { showSpinnerMethod } from "@/utils/showSpinner"
  import applyDecorators from "@/utils/applyDecorators"
  import { debounceMethod } from "@/utils/debounce"
  @Options({
    name: "Signup",
    components: {
      PasswordField,
    },
    data() {
      return {
        email: "",
        lastName: "",
        firstName: "",
        password: "",
        confirmPassword: "",
        errors: {
          email: "",
          lastName: "",
          firstName: "",
          passwordStrength: "",
          confirmPassword: "",
        },
      }
    },
    computed: {
      isFormValid() {
        return !Object.keys(this.errors).length
      },
    },
    methods: {
      submit: applyDecorators(
        [debounceMethod, showSpinnerMethod(".signup-container")],
        async function (this: any): Promise<void> {
          try {
            await this.$lokapi.signup(
              this.email.toLowerCase(),
              this.lastName,
              this.firstName,
              this.password
            )
          } catch (e) {
            if (e instanceof RestExc.UserOrEmailAlreadyTaken) {
              this.errors.email = this.$gettext("User or email already exist.")
            } else {
              this.errors.default = this.$gettext(
                "Unexpected issue when attempting to connect to remote server."
              )
            }

            console.error("Exception received upon `.signup(..)`:", e)
            return
          }
          this.$router.push({ name: "Login" })
          this.$msg.success(
            this.$gettext("Your account has been created successfully.")
          )
        }
      ),
      checkEmail() {
        if (this.email === "") {
          this.errors.email = this.$gettext("This fiels can not be empty.")
        } else if (
          !/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,}$/.test(this.email)
        ) {
          this.errors.email = this.$gettext("Invalid email.")
        } else {
          delete this.errors.email
        }
      },
      checkLastName() {
        if (this.lastName === "") {
          this.errors.lastName = this.$gettext("This fiels can not be empty.")
        } else {
          delete this.errors.lastName
        }
      },
      checkFirstName() {
        if (this.firstName === "") {
          this.errors.firstName = this.$gettext("This fiels can not be empty.")
        } else {
          delete this.errors.firstName
        }
      },
      async checkPasswordStrength() {
        let passwordStrength = this.$passwordUtils.translatePwdFieldErrors(
          await this.$lokapi.isPasswordStrongEnoughSync(this.password)
        )
        if (passwordStrength.length) {
          this.errors.passwordStrength = passwordStrength
        } else {
          delete this.errors.passwordStrength
        }
      },
      checkConfirmPassword() {
        if (this.password !== this.confirmPassword) {
          this.errors.confirmPassword = this.$gettext(
            "The password and the password confirmation must be equal."
          )
        } else {
          delete this.errors.confirmPassword
        }
      },
    },
  })
  export default class Signup extends Vue {}
</script>
<style scoped lang="scss">
  @import "@/assets/custom-variables.scss";
  .signup-link {
    text-align: center;
    button {
      border: none;
      background: none;
      color: #777777;
      cursor: pointer;
    }
  }
  #signup {
    position: absolute;
    display: table;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100%;
    width: 100%;
    .signup-container {
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
        @media screen and (min-width: 768px) {
          padding: 30px;
        }
      }
    }
  }
  .auth-card {
    margin-top: 10px;
  }
  .is-wallet {
    color: $btn-top-up-text-color !important;
    border-color: $btn-top-up-border-color !important;
    background: $color-2;
    opacity: 0.7;
  }
</style>
