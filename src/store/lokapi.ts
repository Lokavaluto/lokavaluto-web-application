/* eslint-disable */

///<reference types="@types/node"/>
///<reference types="lokapi"/>

import http from "http"
import https from "https"

import router from "../router/index"

import { VueCookieNext } from 'vue-cookie-next'
import { LokAPIAbstract, e as LokAPIExc, t as LokAPIType } from "lokapi"


class cookieStore implements LokAPIType.IPersistentStore {
  constructor() {
    VueCookieNext.config({ expire: '7d' })
  }
  get(key: string, defaultValue?: string): string {
    return VueCookieNext.getCookie("lokapi_" + key)
  }
  set(key: string, value: string): void {
    VueCookieNext.setCookie("lokapi_" + key, value)
  }
  del(key: string): void {
    VueCookieNext.removeCookie("lokapi_" + key)
  }
}

const requesters: any = { http, https }

class LokAPI extends LokAPIAbstract {
  httpRequest = (opts: LokAPIType.coreHttpOpts) => {
    const httpsOpts = {
      host: opts.host,
      path: opts.path,
      method: opts.method,
      ...opts.headers && { headers: opts.headers },
      ...opts.port && { port: opts.port }
    }
    const requester = requesters[opts.protocol]
    if (!requester) {
      throw new Error(`Protocol ${opts.protocol} unsupported by this implementation`)
    }
    return new Promise((resolve, reject) => {

      let req = requester.request(httpsOpts, (res: any) => {
        const { statusCode } = res

        let rawData = ''

        res.on('data', (chunk: any) => { rawData += chunk })
        res.on('end', () => {
          if (!statusCode || statusCode.toString().slice(0, 1) !== '2') {
            res.resume();
            reject(new LokAPIExc.HttpError(statusCode, res.statusMessage, rawData, res))
            return
          } else {
            resolve(rawData)
          }
        })
      })

      if (opts.data) req.write(JSON.stringify(opts.data))

      req.end()
      req.on('error', (err: any) => {
        console.error(`Encountered an error trying to make a request: ${err.message}`);
        reject(new LokAPIExc.RequestFailed(err.message))
      })
    })
  }
  base64Encode = (s: string) => Buffer.from(s).toString('base64')
  persistentStore = new cookieStore()
  requestLogin() {
    router.push("/")
    console.log("Login requested !")
  }

}


if (!process.env.VUE_APP_LOKAPI_HOST) {
  throw new Error("Please specify VUE_APP_LOKAPI_HOST in '.env'")
}


if (!process.env.VUE_APP_LOKAPI_DB) {
  throw new Error("Please specify VUE_APP_LOKAPI_DB in '.env'")
}



export var lokAPI = new LokAPI(
  process.env.VUE_APP_LOKAPI_HOST,
  process.env.VUE_APP_LOKAPI_DB,
)


export var moduleLokAPI = {
  state: {
    status: '',
    userProfile: null,
    transactions: null,
    thisWeektransactions:null,
    bal: 0,
    curr:"",
    accounts:[],
    recipient:"",
    isLog:false,
    paymentUrl: "",
    recipientHistory:[]
  },
  actions: {
    async login({ commit }: any, credentials: { login: string, password: string }) {
      let { login, password } = credentials
      commit('auth_request')
      let partners: any
      try {
        partners = await lokAPI.searchRecipients("Al")
        console.log('searchRecipients WORKED', partners)
      } catch (err) {
        console.log('searchRecipients failed', err)
      }
      try {
        await lokAPI.login(login, password)
      } catch (err) { // {RequestFailed, APIRequestFailed, InvalidCredentials, InvalidJson}
        console.log('Login failed:', err.message)
        commit('auth_error')
        throw err
      }
      commit("setThisWeekTransactions")
      commit('auth_success')
    },
    async resetTRS({commit} :any) {
      await commit("setThisWeekTransactions")
    },
    initAutoLogin({commit}:any) {
      commit("autoLogin")
    },
    async setAccounts({commit}:any) {
      await commit("setBalCurr")
      await commit("setThisWeekTransactions")
    },
    async genPaymentLink({commit}:any,amount:number) {
      await commit("genPaymentLink", amount)
    },
    askLogOut({commit}:any) {
      commit("logout")
    }
  },
  mutations: {
    async genPaymentLink(state: any, amount:number) {
      state.paymentUrl = await state.accounts[0].getCreditUrl(amount)
      // console.log("paymentUrl url =", state.paymentUrl.order_url)
    },
    auth_request(state: any) {
      state.status = 'loading'
    },
    auth_success(state: any) {
      state.status = 'success'
      state.userProfile = lokAPI.userProfile
    },
    auth_error(state: any) {
      state.status = 'error'
    },
    logout(state: any) {
      state.status = ''
      state.apiToken = ''
      state.status= ''
      state.userProfile= null
      state.transactions=null
      state.thisWeektransactions=null
      state.bal= 0
      state.curr=""
      state.accounts=[]
      state.recipient=""
      state.isLog=false
      state.paymentUrl=""
    },

    async setBalCurr(state:any) {
      let accounts: any;
      try {
        accounts = await lokAPI.getAccounts();
        let balance = await accounts[0].getBalance();
        let symbol = await accounts[0].getSymbol();
        state.bal = balance;
        state.curr = symbol;
        state.accounts = accounts
        
      } catch (err) {
        console.log('getAccounts failed', err);
      }
    },

    async autoLogin(state: any) {
      state.userProfile = lokAPI.getMyContact()
    },
   
    async setThisWeekTransactions (state:any) {
      let transactions = await lokAPI.getTransactions()
      state.transactions = transactions 
      var maxTransactions = 5
      let trs = []
      let history = []
      for (let el of transactions) {
          if (el.relatedUser) {
              trs.push(el)
              history.push(el.jsonData.cyclos.relatedUser.display)
              if (maxTransactions === 1) {
                  break;
              }
              maxTransactions -= 1
          }
      }
      console.log(trs, history)
      state.recipientHistory = [...new Set(history)];
      state.thisWeektransactions = trs
    }
  },
  getters: {
    getBal: (state: any) => {
      return function(): number {
        return state.bal
      }
    },
    getCurr: (state: any) => {
      return function(): string {
        return state.curr
      }
    },
    getAccs: (state: any) => {
      return function(): Array<any> {
        return state.accounts
      }
    },

    getUserProfile: (state: any) => {
      return function(): any {
        return state.userProfile
      }
    },
    getApiToken: (state: any) => {
      return function(): any {
        return state.apiToken
      }
    },
    getTransactions: (state: any) => {
      return function(): any {
        return state.transactions
      }
    },
    getThisWeektransactions: (state: any) => {
      return function(): any {
        return state.thisWeektransactions
      }
    }
  }
}
