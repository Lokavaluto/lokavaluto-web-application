export {}

Cypress.Commands.add("login", (username: string, password: string) => {
  cy.loginForm().within(() => {
    cy.get("input").first().type(username)
    cy.get('input[type="password"]').type(password)
    cy.get("button[type='submit']").click()
  })
})

Cypress.Commands.add("loginForm", () => {
  return cy.get("section#login form")
})

Cypress.Commands.add("accountsPane", () => {
  return cy.get(".accounts")
})

Cypress.Commands.add("account", () => {
  return cy.get(".account")
})

Cypress.Commands.add("payButton", () => {
  return cy.get(".is-payer")
})

Cypress.Commands.add("requestButton", () => {
  return cy.get(".is-recevoir")
})

Cypress.Commands.add("topUpButton", () => {
  return cy.get(".is-recharger")
})

Cypress.Commands.add("menu", () => {
  return cy.get("#app > nav.navbar")
})

Cypress.Commands.add("isLogged", () => {
  cy.get(".action-footer:visible")
})

Cypress.Commands.add("loginErrorMessage", () => {
  return cy.get(".has-text-danger")
})

Cypress.Commands.add("logout", () => {
  cy.isLogged() // Wait for element
  cy.get(".navbar-link:visible")
    .should((_) => {}) // Ignore assertion
    .then(($element) => {
      if ($element.length > 0) {
        $element.click()
        cy.menu().within(() => {
          // cypress can't hover. The dropdown can't be opened.
          // we need to use the ``{ force: true }`` to click on
          // invisible elements.
          cy.get(".navbar-dropdown .navbar-item")
            .get("#menu-signout")
            .click({ force: true })
        })
      } else {
        cy.get(".navbar-burger").click()
        cy.get(".navbar-dropdown > :last").click()
      }
    })
})

declare global {
  namespace Cypress {
    interface Chainable {
      login(username: string, password: string): Chainable<JQuery<HTMLElement>>
      dashboardLoading(): void
      menu(): Chainable<JQuery<HTMLElement>>
      loginForm(): Chainable<JQuery<HTMLElement>>
      isLogged(): void
      loginErrorMessage(): Chainable<JQuery<HTMLElement>>
      logout(): void
      setViewport(viewport: string | [number, number]): void
      accountsPane(): Chainable<JQuery<HTMLElement>>
      account(): Chainable<JQuery<HTMLElement>>
      payButton(): Chainable<JQuery<HTMLElement>>
      requestButton(): Chainable<JQuery<HTMLElement>>
      topUpButton(): Chainable<JQuery<HTMLElement>>
    }
  }
}