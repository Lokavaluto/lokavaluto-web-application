import { createApp } from "vue"
import Loading from "vue-loading-overlay"
import "vue-loading-overlay/dist/css/index.css"

export function showSpinnerMethod(
  selector: string | ((this: any, state: boolean) => void)
) {
  return function <T extends (this: any, ...args: any[]) => Promise<any>>(
    fn: T
  ): T {
    return async function (
      this: any,
      ...args: Parameters<T>
    ): Promise<ReturnType<T>> {
      let loadingElement: any
      if (typeof selector === "string") {
        let element: HTMLElement | null = null
        if (this && this.$el && this.$el instanceof HTMLElement) {
          element = this.$el?.querySelector(selector)
          if (!element) element = document.querySelector(selector)
        } else {
          element = document.querySelector(selector)
        }
        if (!element) {
          console.error(`Element ${selector} not found.`)
          return await fn.apply(this, args)
        }
        loadingElement = document.createElement("div")

        element.prepend(loadingElement)

        const loadingApp = createApp(Loading, {
          active: true,
          isFullPage: false,
          width: "75px",
          height: "75px",
        })
        loadingApp.mount(loadingElement)
      } else {
        selector.apply(this, [true])
      }
      try {
        const result = await fn.apply(this, args)
        return result
      } catch (error: any) {
        console.log(error)
        throw error
      } finally {
        if (typeof selector === "string") {
          loadingElement.remove()
        } else {
          selector.apply(this, [false])
        }
      }
    } as unknown as T
  }
}

// XXXvlab: use any[]
export function showSpinner(selector: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    return showSpinnerMethod(selector)(descriptor.value)
  }
}
