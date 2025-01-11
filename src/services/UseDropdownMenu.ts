interface DropdownItem {
  label: string
  icon: string
  action: (...args: any[]) => void
}

type DropdownSpec = DropdownItem[] | ((obj: any) => DropdownItem[])

function useDropdownMenu() {
  const registry: DropdownSpec[] = []

  function register(newItemsSpec: DropdownSpec): void {
    registry.push(newItemsSpec)
  }

  function listItems(obj: any): DropdownItem[] {
    const items: DropdownItem[] = []
    for (const dropdownSpec of registry) {
      let fixedSpec: DropdownSpec = dropdownSpec
      if (typeof dropdownSpec === "function") {
        fixedSpec = dropdownSpec(obj)
      }
      if (Array.isArray(fixedSpec))
        // typeguard for typescript
        items.push(...fixedSpec)
    }
    return items
  }

  return {
    register,
    listItems,
  }
}

export default useDropdownMenu
