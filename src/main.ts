import { LocalStore, t as LokAPITypes } from "@lokavaluto/lokapi-browser"
import { createApp } from "vue"
import { Capacitor } from "@capacitor/core"
import "vue-loading-overlay/dist/css/index.css"

import { UIError } from "./exception"
import App from "./App.vue"
import { mkRouter } from "./router"
import "./polyfill"

// Store

import mkStore from "./store"
import { lokapiStoreFactory } from "./store/lokapi"
import { prefsStoreFactory } from "./store/prefs"
import PasswordUtilsFactory from "./utils/password"

// Services

import {
  AuthService,
  PinAuthHandler,
  RetentionAuthHandler,
  DirectAuthHandler,
  PersistentConfigStore,
} from "@/services/AuthService"
import PrefsService from "@/services/PrefsService"
import ExportService from "@/services/ExportService"
import AuthPrefs from "@/components/AuthPrefs.vue"
import LangPrefs from "@/components/LangPrefs.vue"
import BiometryPrefs from "@/components/BiometryPrefs.vue"

import Dialog from "@/services/Dialog"
import Biometry from "@/services/Biometry"
import ToastService from "@/services/toastService"
import { LokAPI } from "./services/lokapiService"
import mkGettext from "./services/Gettext"
import QrCodeService from "@/services/QrCodeService"
import UseModal from "./services/UseModal"
import useDropdownMenu from "./services/UseDropdownMenu"

// Components

import AuthPrefDirect from "@/components/AuthPrefDirect.vue"
import AuthPrefRetention from "@/components/AuthPrefRetention.vue"
import AuthPrefPin from "@/components/AuthPrefPin.vue"
import AuthChallengeRetention from "@/components/AuthChallengeRetention.vue"
import AuthChallengeDirect from "@/components/AuthChallengeDirect.vue"
import AuthChallengePin from "@/components/AuthChallengePin.vue"

// Plugins

import Loading from "./plugins/loading"

// Assets

import FontAwesomeIcon from "@/utils/fonts"
require("@/assets/main.scss")
require("@/assets/native.scss")

// Code

async function fetchConfig(path: string) {
  let response: Response

  // This allows us to store the config given at build time
  // for the mobile apps compilation
  try {
    response = await fetch(path)
  } catch (error) {
    console.log(`Failed to load config file '${path}'.`)
    throw error
  }

  try {
    return JSON.parse(await response.text())
  } catch (error) {
    console.error(`File '${path}' was loaded, but doesn't contain valid json.`)
    throw error
  }
}

fetchConfig("config.json").then(async (config: any) => {
  if (!config.lokapiHost) {
    throw new Error("Please specify lokapiHost in 'config.json'")
  }

  const appName = config.appName || require("../package.json").name
  const appVersion = require("../package.json").version
  const dialog = new Dialog()
  const lokApiService = new LokAPI(config.lokapiHost, config.lokapiDb)
  const localSettings = new PersistentConfigStore(
    lokApiService.persistentStore,
    "localSettings"
  )
  const gettext = await mkGettext(config?.locales || {}, localSettings || {})
  const store = await mkStore(config?.locales || {}, gettext)
  const router = mkRouter(appName, store, gettext)

  // modal service
  const modal = UseModal()
  const { $gettext } = gettext
  const biometry = new Biometry(
    new PersistentConfigStore(lokApiService.persistentStore, "biometry"),
    {
      login: {
        ui: {
          reason: $gettext("Login into Monujo"),
          title: $gettext("Log in"),
          // subtitle: "Maybe add subtitle here?",
          // description: "Maybe a description too?",
        },
        creds: { server: config.lokapiHost },
      },
    }
  )

  lokApiService.requestLogin = async () => {
    const lastUrlSegment = window.location.href.split("/").pop() || ""
    if (!["carto", "", "reset-password", "signup"].includes(lastUrlSegment)) {
      console.log("Login requested !")
      await store.dispatch("askLogOut")
      router.push("/")
    }
  }

  lokApiService.getBankAccountName = async (bankAccount: any) => {
    if (bankAccount.getDisplayName) {
      return await bankAccount.getDisplayName()
    }
    const backend = bankAccount.internalId.split(":")[0]
    if (backend === "comchain" && bankAccount.type) {
      return bankAccount.type === "Nant"
        ? () => $gettext("Pledged account")
        : () => $gettext("Mutual credit")
    }
    return () => $gettext("Main account")
  }

  const root = document.querySelector(":root") as HTMLElement

  if (root !== null && typeof config.theme === "object") {
    Object.entries(config.theme).forEach(([key, value]: [string, any]) => {
      if (typeof value !== "string") {
        if (typeof value.toString !== "undefined") {
          value = value.toString()
        } else {
          console.warn(
            `Ignored invalid value for key '${key}' in config.json:`,
            value
          )
          return
        }
      }
      // Provide a simple way to refer to other variables in
      // ``config.json``, by using "$var" syntax.
      if (value.startsWith("$")) {
        value = `var(--${value.substring(1)})`
      }
      root.style.setProperty(`--${key}`, value)
    })
  }
  if (root !== null && typeof config.css === "string") {
    const sheet = document.createElement("style")
    sheet.innerHTML = config.css
    document.body.appendChild(sheet)
  }

  const authService = new AuthService(
    config?.localAuthPolicy,
    new PersistentConfigStore(lokApiService.persistentStore, "config"),
    {
      Pin: {
        Handler: PinAuthHandler,
        Ui: {
          Pref: AuthPrefPin,
          Challenge: AuthChallengePin,
        },
      },
      Direct: {
        Handler: DirectAuthHandler,
        Ui: {
          Pref: AuthPrefDirect,
          Challenge: AuthChallengeDirect,
        },
      },
      Retention: {
        Handler: RetentionAuthHandler,
        Ui: {
          Pref: AuthPrefRetention,
          Challenge: AuthChallengeRetention,
        },
      },
    }
  )

  const prefsService = new PrefsService()
  prefsService.setGroup("security", () => $gettext("Security settings"))
  prefsService.register(async () => {
    const userAccounts = await lokApiService.getUserAccountsRequiringUnlock()
    if (userAccounts.length == 0) {
      return []
    }
    return [
      {
        group: "security",
        component: AuthPrefs,
        data: {
          userAccountsRequiringAuth: userAccounts,
        },
      },
    ]
  })

  prefsService.register(async () => {
    if (await biometry.isAvailable())
      return [
        {
          group: "security",
          component: BiometryPrefs,
          data: {},
        },
      ]
    return []
  })

  prefsService.setGroup("language", () => $gettext("Language settings"))
  prefsService.register(async () => {
    if (Object.keys(gettext.available).length <= 1) {
      return []
    }
    return [
      {
        group: "language",
        component: LangPrefs,
      },
    ]
  })

  lokApiService.requestLocalPassword = async function (
    state: string,
    userAccount: any
  ) {
    if (store.state.requestLoadingAfterCreds && state === "failedUnlock") {
      ;(<any>app.config.globalProperties.$loading).hide()
    }
    const accountAuthService = await authService.getAccountAuth(
      userAccount.internalId
    )
    const creds = await accountAuthService.requestCredentials(state)
    if (store.state.requestLoadingAfterCreds) {
      app.config.globalProperties.$loading.show()
    }
    return creds
  }
  const passwordUtils = PasswordUtilsFactory(gettext)
  store.registerModule(
    "lokapi",
    lokapiStoreFactory(lokApiService, passwordUtils)
  )
  store.registerModule("prefs", prefsStoreFactory(prefsService))

  const app = createApp(App)
  app.config.errorHandler = function (err: any, vm, info) {
    if (err instanceof UIError) {
      ToastService.error(err.message)
      if (err.origException) console.error("Handled error:", err.origException)
      return
    }
    throw err
  }
  window.addEventListener("unhandledrejection", function (event) {
    if (app.config.errorHandler) {
      event.preventDefault()
      app.config.errorHandler(event.reason, null, event.type)
    }
    return false
  })

  const exportService = new ExportService(gettext)
  // Dropdowns
  const dropdown = useDropdownMenu()

  dropdown.register((obj: any) => {
    if (store.state.lokapi.virtualAccountTree.includes(obj)) {
      return [
        {
          label: $gettext("Qrcode"),
          icon: "qrcode",
          action: () => modal.open("QrCodeModal", { accountId: obj.id }),
        },
      ]
    }
    return []
  })

  dropdown.register((obj: any) => {
    if (
      store.state.lokapi.virtualAccountTree.includes(obj) &&
      obj?.safeWalletRecipient &&
      config?.reconversion
    ) {
      return [
        {
          label: "Reconversion",
          icon: "euro-sign",
          action: (refreshTransaction: any) =>
            modal.open("MoneyTransferModal", {
              account: obj,
              transactionType: "reconversion",
              refreshTransaction,
            }),
        },
      ]
    }
    return []
  })

  dropdown.register((obj: any) => {
    if (obj.walletData && store.state.lokapi.virtualAccountTree.includes(obj)) {
      return [
        {
          label: "Export wallet",
          icon: "wallet",
          action: async () => {
            const wallet = obj.walletData
            try {
              await exportService.download(
                JSON.stringify(wallet, null, 4),
                "wallet",
                "text/dat"
              )
            } catch (err) {
              throw new UIError("the Wallet could not be downloaded", err)
            }
          },
        },
      ]
    }
    return []
  })

  app.use(store)
  app.use(Loading)
  app.use(gettext)
  app.use(dialog)
  app.use(biometry)
  app.provide("$store", store)
  app.component("fa-icon", FontAwesomeIcon)
  app.config.globalProperties.$auth = authService
  app.config.globalProperties.$lokapi = lokApiService
  app.config.globalProperties.$config = config
  app.config.globalProperties.$localSettings = localSettings
  app.config.globalProperties.$msg = ToastService
  app.config.globalProperties.$persistentStore = new LocalStore("monujo")
  app.config.globalProperties.$auth = authService
  app.config.globalProperties.$prefs = prefsService
  app.config.globalProperties.$export = exportService
  app.config.globalProperties.$qrCode = new QrCodeService(gettext)
  app.config.globalProperties.$errorHandler = app.config.errorHandler
  app.config.globalProperties.$appInfo = { appName, appVersion }
  app.config.globalProperties.$modal = modal
  app.config.globalProperties.$dropdownMenu = dropdown
  app.config.globalProperties.$passwordUtils = passwordUtils
  app.config.globalProperties.$platform = Capacitor.getPlatform()
  const unwatch = store.watch(
    (state, getters) => getters.isAuthenticated,
    () => {
      app.use(router)
      app.mount("#app")
      unwatch()
    }
  )

  // Don't await for the next one as it could fail and must
  // be allowed to fail.
  store.dispatch("switchLocale")
  store.dispatch("setupAfterLogin")
})
