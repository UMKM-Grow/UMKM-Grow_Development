/**
 * ============================================================
 * SKENARIO PENGUJIAN: Autentikasi Login - UMKM-Grow
 * ============================================================
 * Menguji seluruh alur login: berhasil, gagal, dan proteksi rute.
 *
 * Selector yang dipakai mengacu langsung pada Login.jsx:
 *  - input[type="email"]   → field email
 *  - input[type="password"] → field password
 *  - button[type="submit"]  → tombol "Masuk"
 * ============================================================
 */

describe("Skenario Pengujian Login UMKM-Grow", () => {
  // Load data user dari fixtures/user.json
  let users;
  before(() => {
    cy.fixture("user").then((data) => {
      users = data;
    });
  });

  beforeEach(() => {
    // Bersihkan localStorage sebelum setiap test agar state bersih
    cy.clearLocalStorage();
    cy.visit("/login");
  });

  // ----------------------------------------------------------
  // TEST 1: Tampilan halaman login
  // ----------------------------------------------------------
  it("Harus menampilkan halaman login dengan elemen yang benar", () => {
    // Verifikasi judul aplikasi
    cy.contains("UMKM-Grow").should("be.visible");

    // Verifikasi subtitle (teks asli dari Login.jsx)
    cy.contains("Masuk ke akun Anda").should("be.visible");

    // Verifikasi form elements ada
    cy.get('input[type="email"]').should("be.visible");
    cy.get('input[type="password"]').should("be.visible");
    cy.get('button[type="submit"]').should("be.visible").and("contain", "Masuk");

    // Verifikasi footer info
    cy.contains("Lupa password? Hubungi Admin HRD.").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 2: Login berhasil → redirect ke Dashboard
  // ----------------------------------------------------------
  it("Harus berhasil login dan masuk ke Dashboard", () => {
    // 1. Kunjungi halaman login
    cy.visit("/login");

    // 2. Pastikan subtitle halaman login terlihat
    cy.contains("Masuk ke akun Anda").should("be.visible");

    // 3. Isi input email
    cy.get('input[type="email"]').type(users.validUser.email);

    // 4. Isi input password
    cy.get('input[type="password"]').type(users.validUser.password);

    // 5. Klik tombol Masuk
    cy.get('button[type="submit"]').click();

    // 6. Validasi URL berubah ke /dashboard
    cy.url().should("include", "/dashboard");

    // 7. Validasi halaman Dashboard termuat (teks dari Dashboard.jsx)
    cy.contains("Dashboard").should("be.visible");

    // 8. Validasi menu fitur muncul
    cy.contains("Menu Fitur").should("be.visible");

    // 9. Validasi beberapa menu card ada
    cy.contains("Kasir (POS)").should("be.visible");
    cy.contains("Inventory").should("be.visible");
    cy.contains("Keuangan").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 3: Login gagal dengan kredensial salah
  // ----------------------------------------------------------
  it("Harus menampilkan pesan error saat login dengan kredensial salah", () => {
    cy.get('input[type="email"]').type(users.invalidUser.email);
    cy.get('input[type="password"]').type(users.invalidUser.password);
    cy.get('button[type="submit"]').click();

    // Tetap di halaman login
    cy.url().should("include", "/login");

    // Pesan error harus muncul (fallback message dari Login.jsx)
    cy.contains("Login gagal. Periksa kembali email dan password Anda.").should(
      "be.visible"
    );
  });

  // ----------------------------------------------------------
  // TEST 4: Validasi form — field kosong tidak bisa submit
  // ----------------------------------------------------------
  it("Harus mencegah submit jika email atau password kosong", () => {
    // Klik submit tanpa isi apapun
    cy.get('button[type="submit"]').click();

    // Browser native validation mencegah submit → tetap di /login
    cy.url().should("include", "/login");
  });

  // ----------------------------------------------------------
  // TEST 5: Proteksi rute — akses /dashboard tanpa login
  // ----------------------------------------------------------
  it("Harus redirect ke /login jika mengakses /dashboard tanpa autentikasi", () => {
    // Pastikan localStorage kosong (tidak ada token)
    cy.clearLocalStorage();

    // Coba akses dashboard langsung
    cy.visit("/dashboard");

    // RequireAuth di App.jsx harus redirect ke /login
    cy.url().should("include", "/login");
  });

  // ----------------------------------------------------------
  // TEST 6: Tombol loading saat proses login
  // ----------------------------------------------------------
  it("Harus menampilkan teks 'Memproses...' saat request sedang berjalan", () => {
    // Intercept API call dan tahan responnya
    cy.intercept("POST", "**/api/auth/login", (req) => {
      req.reply((res) => {
        res.setDelay(2000); // Tahan 2 detik
      });
    }).as("loginRequest");

    cy.get('input[type="email"]').type(users.validUser.email);
    cy.get('input[type="password"]').type(users.validUser.password);
    cy.get('button[type="submit"]').click();

    // Saat loading, tombol berubah teks dan disabled
    cy.get('button[type="submit"]')
      .should("contain", "Memproses...")
      .and("be.disabled");

    // Tunggu request selesai
    cy.wait("@loginRequest");
  });

  // ----------------------------------------------------------
  // TEST 7: Setelah login, token tersimpan di localStorage
  // ----------------------------------------------------------
  it("Harus menyimpan token ke localStorage setelah login berhasil", () => {
    cy.intercept("POST", "**/api/auth/login").as("loginRequest");

    cy.get('input[type="email"]').type(users.validUser.email);
    cy.get('input[type="password"]').type(users.validUser.password);
    cy.get('button[type="submit"]').click();

    cy.wait("@loginRequest").then(() => {
      // Verifikasi token tersimpan di localStorage
      cy.window().then((win) => {
        expect(win.localStorage.getItem("token")).to.not.be.null;
        expect(win.localStorage.getItem("user")).to.not.be.null;
      });
    });
  });
});
