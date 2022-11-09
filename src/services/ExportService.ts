import { Capacitor, Plugins } from "@capacitor/core"
import { Directory, Encoding } from "@capacitor/filesystem"

const { Filesystem, Share } = Plugins

class ExportService {
  gettext: any

  constructor(gettext: any) {
    this.gettext = gettext
  }

  public async download(
    data: any,
    fileName: string,
    mimetype: string
  ): Promise<any> {
    //if (Capacitor.getPlatform() === "web") {
    const link = document.createElement("a")
    const url = `data:${mimetype};charset=utf-8,${encodeURIComponent(data)}`
    link.setAttribute("href", url)
    link.setAttribute("download", fileName)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    //// disabled while searching solution for permission issue
    //// issue: https://github.com/ionic-team/capacitor-plugins/issues/457

    // } else if (Capacitor.getPlatform() === "android") {
    //   try {
    //     await Filesystem.writeFile({
    //       path: fileName,
    //       data: data,
    //       directory: Directory.Documents,
    //       encoding: Encoding.UTF8,
    //     })
    //   } catch (err) {
    //     throw new Error("Unable to download file")
    //   }
    // }
  }
  public async share(data: any, fileName: string): Promise<any> {
    if (Capacitor.getPlatform() !== "web") {
      await Filesystem.writeFile({
        path: fileName,
        data: data,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      })

      const fileResult = await Filesystem.getUri({
        directory: Directory.Cache,
        path: fileName,
      })
      const { $gettext } = this.gettext

      await Share.share({
        title: $gettext("Transaction list"),
        text: $gettext("Transaction list"),
        url: fileResult.uri,
        dialogTitle: $gettext("Transaction list"),
      })
    }
  }
}

export default ExportService
