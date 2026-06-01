/**
 * ============================================================
 * SKENARIO PENGUJIAN: Dashboard Features - UMKM-Grow
 * ============================================================
 * Menguji semua fitur di halaman Dashboard:
 *  - Tampilan halaman dan greeting user
 *  - Menu fitur (14 menu cards)
 *  - Widget Low Stock Alert
 *  - Widget Best Seller
 *  - Navigasi ke halaman fitur
 * ============================================================
 */

describe("Skenario Pengujian Dashboard UMKM-Grow", () => {
  let users;

  before(() => {
    cy.fixture("user").then((data) => {
      users = data;
    });
  });

  beforeEach(() => {
    // Login dulu sebelum setiap test
    cy.clearLocalStorage();
    cy.login(users.validUser.email, users.validUser.password);
    cy.url().should("include", "/dashboard");
  });

  // ----------------------------------------------------------
  // TEST 1: Tampilan halaman Dashboard
  // ----------------------------------------------------------
  it("Harus menampilkan halaman Dashboard dengan elemen yang benar", () => {
    // Verifikasi judul halaman
    cy.contains("h1", "Dashboard").should("be.visible");

    // Verifikasi greeting (bisa dengan atau tanpa nama user)
    cy.contains("Pilih modul untuk mulai bekerja").should("be.visible");

    // Verifikasi section heading
    cy.contains("Menu Fitur").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 2: Verifikasi semua 14 menu cards ada
  // ----------------------------------------------------------
  it("Harus menampilkan semua 14 menu fitur", () => {
    const expectedMenus = [
      "Kasir (POS)",
      "Inventory",
      "Mutasi Stok",
      "Cabang",
      "Members",
      "Suppliers",
      "Hutang & Piutang",
      "Gaji Karyawan",
      "Absensi",
      "CRM",
      "Keuangan",
      "Broadcast Promo",
      "HRM",
      "Settings",
    ];

    expectedMenus.forEach((menuTitle) => {
      cy.contains(menuTitle).should("be.visible");
    });
  });

  // ----------------------------------------------------------
  // TEST 3: Navigasi ke halaman POS
  // ----------------------------------------------------------
  it("Harus bisa navigasi ke halaman Kasir (POS)", () => {
    cy.contains("Kasir (POS)").click();
    cy.url().should("include", "/pos");
  });

  // ----------------------------------------------------------
  // TEST 4: Navigasi ke halaman Inventory
  // ----------------------------------------------------------
  it("Harus bisa navigasi ke halaman Inventory", () => {
    cy.contains("Inventory").click();
    cy.url().should("include", "/inventory");
  });

  // ----------------------------------------------------------
  // TEST 5: Navigasi ke halaman Settings
  // ----------------------------------------------------------
  it("Harus bisa navigasi ke halaman Settings", () => {
    cy.contains("Settings").click();
    cy.url().should("include", "/settings");
  });

  // ----------------------------------------------------------
  // TEST 6: Widget Low Stock Alert - tampilan awal
  // ----------------------------------------------------------
  it("Harus menampilkan widget Peringatan Stok Menipis", () => {
    // Verifikasi judul widget
    cy.contains("⚠️ Peringatan Stok Menipis").should("be.visible");

    // Verifikasi deskripsi
    cy.contains("Daftar produk yang stoknya di bawah batas minimum").should(
      "be.visible"
    );

    // Verifikasi icon AlertTriangle ada (cek parent div dengan class bg-red-100)
    cy.get(".bg-red-100.text-red-700").should("exist");
  });

  // ----------------------------------------------------------
  // TEST 7: Widget Low Stock Alert - state "Pilih cabang"
  // ----------------------------------------------------------
  it("Widget Low Stock harus menampilkan pesan 'Pilih cabang' jika belum ada cabang dipilih", () => {
    // Intercept API call untuk memastikan tidak ada cabang
    cy.intercept("GET", "**/api/branches", { body: [] }).as("getBranches");

    cy.reload();
    cy.wait("@getBranches");

    // Verifikasi pesan placeholder
    cy.contains("Pilih cabang terlebih dahulu untuk melihat peringatan stok").should(
      "be.visible"
    );
  });

  // ----------------------------------------------------------
  // TEST 8: Widget Low Stock Alert - state "Semua stok aman"
  // ----------------------------------------------------------
  it("Widget Low Stock harus menampilkan '✅ Semua stok produk aman!' jika tidak ada stok rendah", () => {
    // Mock API branches
    cy.intercept("GET", "**/api/branches", {
      body: [{ id_cabang: 1, nama_cabang: "Cabang Pusat" }],
    }).as("getBranches");

    // Mock API low-stock dengan data kosong
    cy.intercept("GET", "**/api/products/low-stock*", {
      statusCode: 200,
      body: { data: [] },
    }).as("getLowStock");

    cy.reload();
    cy.wait("@getBranches");
    cy.wait("@getLowStock");

    // Verifikasi pesan sukses
    cy.contains("✅ Semua stok produk aman!").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 9: Widget Low Stock Alert - menampilkan data produk
  // ----------------------------------------------------------
  it("Widget Low Stock harus menampilkan tabel produk dengan stok rendah", () => {
    // Mock API branches
    cy.intercept("GET", "**/api/branches", {
      body: [{ id_cabang: 1, nama_cabang: "Cabang Pusat" }],
    }).as("getBranches");

    // Mock API low-stock dengan data produk
    cy.intercept("GET", "**/api/products/low-stock*", {
      statusCode: 200,
      body: {
        data: [
          { id: 1, name: "Produk A", stok: 5, stok_minimum: 10 },
          { id: 2, name: "Produk B", stok: 2, stok_minimum: 15 },
        ],
      },
    }).as("getLowStock");

    cy.reload();
    cy.wait("@getBranches");
    cy.wait("@getLowStock");

    // Verifikasi tabel muncul
    cy.contains("th", "Nama Produk").should("be.visible");
    cy.contains("th", "Sisa Stok").should("be.visible");
    cy.contains("th", "Batas Minimum").should("be.visible");

    // Verifikasi data produk
    cy.contains("td", "Produk A").should("be.visible");
    cy.contains("td", "Produk B").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 10: Widget Best Seller - tampilan awal
  // ----------------------------------------------------------
  it("Harus menampilkan widget Top 5 Produk Terlaris", () => {
    // Verifikasi judul widget
    cy.contains("🏆 Top 5 Produk Terlaris").should("be.visible");

    // Verifikasi deskripsi
    cy.contains("Menampilkan produk terlaris di cabang yang dipilih").should(
      "be.visible"
    );

    // Verifikasi icon Trophy ada
    cy.get(".bg-amber-100.text-amber-700").should("exist");
  });

  // ----------------------------------------------------------
  // TEST 11: Widget Best Seller - state "Pilih cabang"
  // ----------------------------------------------------------
  it("Widget Best Seller harus menampilkan pesan 'Pilih cabang' jika belum ada cabang dipilih", () => {
    // Intercept API call untuk memastikan tidak ada cabang
    cy.intercept("GET", "**/api/branches", { body: [] }).as("getBranches");

    cy.reload();
    cy.wait("@getBranches");

    // Verifikasi pesan placeholder
    cy.contains("Pilih cabang terlebih dahulu untuk melihat produk terlaris").should(
      "be.visible"
    );
  });

  // ----------------------------------------------------------
  // TEST 12: Widget Best Seller - state "Belum ada data"
  // ----------------------------------------------------------
  it("Widget Best Seller harus menampilkan 'Belum ada data penjualan' jika data kosong", () => {
    // Mock API branches
    cy.intercept("GET", "**/api/branches", {
      body: [{ id_cabang: 1, nama_cabang: "Cabang Pusat" }],
    }).as("getBranches");

    // Mock API best-seller dengan data kosong
    cy.intercept("GET", "**/api/analytics/best-seller*", {
      statusCode: 200,
      body: { data: [] },
    }).as("getBestSeller");

    cy.reload();
    cy.wait("@getBranches");
    cy.wait("@getBestSeller");

    // Verifikasi pesan
    cy.contains("Belum ada data penjualan di cabang ini").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 13: Widget Best Seller - menampilkan data produk
  // ----------------------------------------------------------
  it("Widget Best Seller harus menampilkan tabel top 5 produk terlaris", () => {
    // Mock API branches
    cy.intercept("GET", "**/api/branches", {
      body: [{ id_cabang: 1, nama_cabang: "Cabang Pusat" }],
    }).as("getBranches");

    // Mock API best-seller dengan data produk
    cy.intercept("GET", "**/api/analytics/best-seller*", {
      statusCode: 200,
      body: {
        data: [
          { product_id: 1, rank: 1, name: "Produk Terlaris 1", total_terjual: 150 },
          { product_id: 2, rank: 2, name: "Produk Terlaris 2", total_terjual: 120 },
          { product_id: 3, rank: 3, name: "Produk Terlaris 3", total_terjual: 100 },
          { product_id: 4, rank: 4, name: "Produk Terlaris 4", total_terjual: 80 },
          { product_id: 5, rank: 5, name: "Produk Terlaris 5", total_terjual: 60 },
        ],
      },
    }).as("getBestSeller");

    cy.reload();
    cy.wait("@getBranches");
    cy.wait("@getBestSeller");

    // Verifikasi tabel muncul
    cy.contains("th", "Peringkat").should("be.visible");
    cy.contains("th", "Nama Produk").should("be.visible");
    cy.contains("th", "Jumlah Terjual").should("be.visible");

    // Verifikasi data produk
    cy.contains("td", "Produk Terlaris 1").should("be.visible");
    cy.contains("td", "150").should("be.visible");
    cy.contains("td", "Produk Terlaris 5").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 14: Responsive - menu cards hover effect
  // ----------------------------------------------------------
  it("Menu cards harus memiliki hover effect", () => {
    // Ambil salah satu menu card
    cy.contains("Kasir (POS)")
      .parent()
      .should("have.class", "hover:bg-blue-50");
  });

  // ----------------------------------------------------------
  // TEST 15: Navigasi kembali ke Dashboard dari halaman lain
  // ----------------------------------------------------------
  it("Harus bisa kembali ke Dashboard dari halaman lain", () => {
    // Pergi ke halaman Inventory
    cy.contains("Inventory").click();
    cy.url().should("include", "/inventory");

    // Klik logo atau link Dashboard di sidebar/navbar
    cy.visit("/dashboard");
    cy.url().should("include", "/dashboard");
    cy.contains("h1", "Dashboard").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 16: Error handling - API gagal
  // ----------------------------------------------------------
  it("Widget harus menampilkan pesan error jika API gagal", () => {
    // Mock API branches
    cy.intercept("GET", "**/api/branches", {
      body: [{ id_cabang: 1, nama_cabang: "Cabang Pusat" }],
    }).as("getBranches");

    // Mock API low-stock dengan error
    cy.intercept("GET", "**/api/products/low-stock*", {
      statusCode: 500,
      body: { message: "Internal Server Error" },
    }).as("getLowStockError");

    cy.reload();
    cy.wait("@getBranches");
    cy.wait("@getLowStockError");

    // Verifikasi pesan error muncul
    cy.contains("Gagal memuat data stok rendah").should("be.visible");
  });
});
