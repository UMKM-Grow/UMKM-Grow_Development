// ***********************************************
// Custom Cypress Commands untuk UMKM-Grow
// ***********************************************

/**
 * cy.login(email, password)
 * Shortcut command untuk login via UI.
 * Digunakan di test yang butuh state sudah login.
 */
Cypress.Commands.add("login", (email, password) => {
  cy.visit("/login");
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should("include", "/dashboard");
});

/**
 * cy.loginByApi(email, password)
 * Login langsung via API (lebih cepat, tanpa render UI).
 * Cocok dipakai sebagai beforeEach di test yang bukan menguji login itu sendiri.
 */
Cypress.Commands.add("loginByApi", (email, password) => {
  cy.request({
    method: "POST",
    url: "http://localhost:5000/api/auth/login",
    body: { email, password },
  }).then((response) => {
    expect(response.status).to.eq(200);
    const { token } = response.body.data;
    const user = response.body.data;
    window.localStorage.setItem("token", token);
    window.localStorage.setItem("user", JSON.stringify(user));
  });
});
