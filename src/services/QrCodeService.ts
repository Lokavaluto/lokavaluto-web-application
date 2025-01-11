import { Camera } from "@capacitor/camera"
import { App as CapacitorApp } from "@capacitor/app"
import { Capacitor, PluginListenerHandle } from "@capacitor/core"
import { StatusBar } from "@capacitor/status-bar"
import { createApp } from "vue"

import { BarcodeScanner as BarCodeScanner } from "@lokavaluto/barcode-scanner"

import { UIError } from "../exception"
import ScanQrCode from "@/components/ScanQrCode.vue"

class QrCodeService {
  gettext: any
  listener: PluginListenerHandle | null = null
  startPromiseReject: any | null = null

  constructor(gettext: any) {
    this.gettext = gettext
  }

  private async _startScan(): Promise<any> {
    const app = document.getElementById("app")
    if (!app) {
      throw new Error("No element id 'app' found to insert qrcode ui")
    }
    this.listener = await CapacitorApp.addListener(
      "backButton",
      ({ canGoBack }) => {
        if (!canGoBack) {
          console.warn("Ignoring unexpected canGoBack false value")
        }
        this.stopScan()
      }
    )

    if (Capacitor.getPlatform() == "ios") await StatusBar.hide()
    const classicContent = document.createElement("div")
    classicContent.id = "classic-content"
    classicContent.style.display = "none"
    classicContent.style.backgroundColor = "black"
    while (app.firstChild) {
      classicContent.appendChild(app.firstChild)
    }
    app.style.backgroundColor = "transparent"
    app.appendChild(classicContent)

    const qrCodeContent = document.createElement("div")
    qrCodeContent.id = "qrcode-content"

    app.appendChild(qrCodeContent)

    const component = createApp(ScanQrCode)
    component.config.globalProperties.$qrCode = this
    component.mount(qrCodeContent)
    qrCodeContent.style.display = "block"
    qrCodeContent.style.height = "fit-content"
    classicContent.style.backgroundColor = "transparent"
    classicContent.style.opacity = "0"
    let r = await BarCodeScanner.startScan()
    return r
  }

  private startScan(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.startPromiseReject = reject
      this._startScan().then((r) => {
        resolve(r)
      })
    })
  }

  public async read() {
    // service `$qrCode` might display `UIError(...)` when running
    // the following
    const result = await this.startScan()
    await this.stopScan()
    return result
  }

  public async prepare() {
    await BarCodeScanner.prepare()
  }

  public isActive() {
    return this.listener !== null
  }

  public async stopScan() {
    const { $gettext } = this.gettext

    if (Capacitor.getPlatform() == "ios") await StatusBar.show()
    if (!this.listener) return

    if (this.startPromiseReject) {
      this.startPromiseReject(new Error("User canceled the scan screen"))
    }

    this.listener.remove()
    this.listener = null

    await BarCodeScanner.stopScan()

    const app = document.getElementById("app")
    const classicContent = document.getElementById("classic-content")
    const qrCodeContent = document.getElementById("qrcode-content")
    if (!app || !classicContent || !qrCodeContent) {
      throw new UIError($gettext("Unexpected error occurred"), null)
    }
    while (classicContent.firstChild) {
      app.appendChild(classicContent.firstChild)
    }
    app.style.backgroundColor = ""
    app.removeChild(classicContent)
    app.removeChild(qrCodeContent)
  }

  public async isPermissionGranted(): Promise<any> {
    const platform = Capacitor.getPlatform()
    const { $gettext } = this.gettext

    let permission
    let isPermissionGranted
    if (platform === "android") {
      permission = await Camera.requestPermissions({
        permissions: ["camera"],
      })
      isPermissionGranted = permission.camera === "granted"
    } else if (platform === "ios") {
      permission = await BarCodeScanner.checkPermission({ force: true })
      isPermissionGranted = permission.granted
    } else if (platform === "web") {
      try {
        permission = await navigator.mediaDevices.getUserMedia({
          video: true,
        })
        isPermissionGranted = permission.active
      } catch (e: any) {
        isPermissionGranted = false
      }
    }
    if (!isPermissionGranted) {
      if (platform === "web") {
        throw new UIError($gettext("Permission denied to the camera"), null)
      } else {
        const enablePermission = confirm(
          $gettext(
            "To scan QR code, allow access to camera in the app settings."
          )
        )
        if (enablePermission) {
          BarCodeScanner.openAppSettings()
        }
        return false
      }
    }
    return isPermissionGranted
  }
}

export default QrCodeService
