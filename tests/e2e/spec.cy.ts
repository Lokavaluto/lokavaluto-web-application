describe("Login and logout process", () => {
  beforeEach(() => {
    cy.visit("/")
  })

  it("start page show base interface and login form", () => {
    cy.loginForm().should("be.visible")
    cy.menu().should("be.visible")
    cy.loginButton().should("be.visible")
    cy.createAccountLink().should("be.visible")
    cy.resetPasswordLink().should("be.visible")
    if (Cypress.env("screenshot")) cy.takeScreenshot("login")
  })

  it("login with wrong email triggers error messages", () => {
    cy.login("foo", "wrongpassword")
    cy.loginErrorMessage().should("be.visible")
  })

  it("login with correct credentials succeeds, logout", () => {
    cy.login(Cypress.env("email"), Cypress.env("password"))
    cy.isLogged()
    cy.loginForm().should("not.exist")
    cy.logout()
    cy.loginForm().should("exist")
  })
})

describe("General processes when logged in", () => {
  beforeEach(() => {
    cy.visit("/")
    cy.login(Cypress.env("email"), Cypress.env("password"))
  })

  it("show base interface", () => {
    cy.menu().should("be.visible")

    cy.accountsPane().within(() => {
      cy.account().should("be.visible")
    })
    cy.transactionsPane().within(() => {
      cy.transactions().should("be.visible")
    })

    cy.payButton().should("be.visible")
    cy.requestButton().should("be.visible")
    cy.refreshButton().should("be.visible")
    if (Cypress.env("screenshot")) cy.takeScreenshot("dashboard")
  })

  it("Send money process", () => {
    cy.accountsPane().within(() => {
      cy.contains(".account-backend", "cyclos").parents(".account").click()
    })
    cy.payButton().should("be.visible")
    cy.payButton().click()
    cy.modal().should("be.visible")
    cy.searchBar().within(() => {
      cy.searchInput().should("be.visible")
    })
    cy.searchRecipient("Jesse")
    if (Cypress.env("screenshot")) cy.takeScreenshot("recipients")
    cy.firstSearchedRecipient().click()
    if (Cypress.env("screenshot")) cy.takeScreenshot("pay")

    // send empty or wrong amount
    cy.sendMoneyButton().should("be.disabled")
    cy.amountSendInput().should("be.visible")
    cy.amountSendInput().type("0")

    cy.sendMoneyButton().should("be.disabled")
    cy.errorMessage().should("be.visible")
    cy.amountSendInput().should("be.visible")
    cy.amountSendInput().type("wrong amount")
    cy.errorMessage().should("be.visible")

    // close modal
    cy.closeModal()
    cy.modal().should("not.exist")
  })

  it("Top-up process", () => {
    cy.accountsPane().within(() => {
      cy.contains(".account-backend", "comchain").parents(".account").click()
    })

    // Ensure at least the pay button is there to assume that
    // the footer is available and allow quick ``querySelectorAll()``
    // method to speed things up regarding if we need to do this
    // test or not... as some configuration can remove the topup
    // process entirely.
    cy.payButton().should("be.visible")

    cy.document().then((doc: any) => {
      const elements = doc.querySelectorAll("button.is-top-up")
      if (elements.length) {
        cy.get("#topup-loading-spinner").should("not.exist")

        // remove pending top-up if exist
        // We need to get the body to use the ``find`` method
        cy.get("body").then((body) => {
          // We use ``find`` here to check for existence without triggering
          // an error in cypress and conditionally delete it if present.
          if (body.find("#pending-top-up-list").length > 0) {
            cy.get("#pending-top-up-list") // is guaranteed to succeed
              .should("be.visible")
              .then(() => {
                cy.get(".pending-top-up-item").first().click()
                cy.get("footer > div > #delete").click()
                cy.get("#pending-top-up-list").should("not.exist")
              })
          }
        })

        cy.topUpButton().should("be.visible")

        // click top-up button
        cy.topUpButton().click()
        cy.amountInput().should("be.visible")

        // enter invalid amount
        cy.amountInput().type("test invalid amount")
        cy.topUpNextButton().should("be.disabled")

        // enter valid amount
        cy.amountInput().type("30")
        if (Cypress.env("screenshot")) cy.takeScreenshot("top-up")
        cy.topUpNextButton().click()

        // check confirmation modal
        // by clicking on the top-up element
        cy.get("header.topup").should("be.visible")
        cy.closeModal()

        // by clicking on the top-up button in the footer
        cy.topUpButton().click()
        cy.topUpModalWarningText().should("be.visible")
        cy.topUpModalButtons().should("have.length", 3)
        cy.closeModal()

        // back to dashboard and check pending top-up
        cy.getPendingTopUpList().should("be.visible")
        cy.getPendingTopUpElement().click()

        // withdraw top-up
        cy.get("footer > div > #delete").click()

        // check pending top-up empty
        cy.get("#pending-top-up-list").should("not.exist")
      } else {
        cy.log("Top-up feature not tested as button is not displayed")
      }
    })
  })
})

describe("Preferences page", () => {
  beforeEach(() => {
    cy.visit("/")
    cy.login(Cypress.env("email"), Cypress.env("password"))
  })
  it("show base interface", () => {
    cy.openPreferencesPage()
    cy.menu().should("be.visible")
    cy.preferencesCard().should("be.visible")
    cy.preferencesCard().within(() => {
      cy.preferencesGroups().should("be.visible")
      cy.simplifiedAuthPref().should("be.visible")
      cy.simplifiedAuthPref().within(() => {
        cy.getSwitch().click()
      })
    })
  })
})
describe("Visit public interface", () => {
  beforeEach(() => {
    cy.visit("/")
  })
  it("visit map", () => {
    cy.menu().within(() => {
      // Need to force because in burger menu, it is not seems
      cy.get("#menu-map").click({ force: true })
    })
    cy.frameLoaded()
    if (Cypress.env("screenshot")) cy.takeScreenshot("map")
  })
})

describe("Signup process", () => {
  beforeEach(() => {
    cy.visit("/")
    cy.clickSignupButton()
  })
  it("Signup page show form", () => {
    cy.url().should("include", "signup")
    cy.getSignupForm().should("be.visible")
    cy.getButtonSubmit().should("be.visible")
  })
  it("Signup with already existing email", () => {
    cy.getSignupForm().within(() => {
      cy.getEmailInput().type("vl_part1@0k.io")
      cy.getFirstNameInput().type("FirstName")
      cy.getLastNameInput().type("LastName")
      cy.getPasswordInput().type("Test1234")
      cy.getConfirmPasswordInput().type("Test1234")
      cy.getButtonSubmit().click()
      cy.getSignupError().should("be.visible")
    })
  })
})
