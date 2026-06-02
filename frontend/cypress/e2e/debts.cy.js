/**
 * ============================================================
 * SKENARIO PENGUJIAN: Debt Management (Hutang & Piutang) - UMKM-Grow
 * ============================================================
 * Menguji seluruh fitur Manajemen Hutang & Piutang end-to-end:
 *  - Tampilan halaman debts
 *  - Tab switching (Hutang / Piutang)
 *  - CREATE Hutang (dengan supplier)
 *  - CREATE Piutang (dengan customer name)
 *  - Form validation (field wajib)
 *  - Mark as paid (Tandai Lunas)
 *  - DELETE debts dengan confirmation
 *  - Status badges (Belum Lunas / Lunas)
 *  - Format currency (IDR)
 *  - Format date (dd/mm/yyyy)
 *  - Modal (open/close)
 *  - Empty state handling
 *  - Loading & error states
 * ============================================================
 */

describe("Skenario Pengujian Debt Management UMKM-Grow", () => {
  let users;

  before(() => {
    cy.fixture("user").then((data) => {
      users = data;
    });
  });

  beforeEach(() => {
    // Login dan navigasi ke Debts
    cy.clearLocalStorage();
    cy.login(users.validUser.email, users.validUser.password);
    cy.visit("/debts");
  });

  // ----------------------------------------------------------
  // TEST 1: Tampilan halaman Debts
  // ----------------------------------------------------------
  it("Harus menampilkan halaman Hutang & Piutang dengan elemen yang benar", () => {
    // Verifikasi judul halaman
    cy.contains("h1", "Hutang & Piutang").should("be.visible");
    cy.contains("Kelola kewajiban toko ke supplier").should("be.visible");

    // Verifikasi tab buttons
    cy.contains("button", "Hutang (Toko)").should("be.visible");
    cy.contains("button", "Piutang (Pelanggan)").should("be.visible");

    // Verifikasi tombol Tambah (default tab = Hutang)
    cy.contains("button", "Tambah Hutang").should("be.visible");

    // Verifikasi tabel headers
    cy.contains("th", "Nama Pihak").should("be.visible");
    cy.contains("th", "Nominal").should("be.visible");
    cy.contains("th", "Jatuh Tempo").should("be.visible");
    cy.contains("th", "Status").should("be.visible");
    cy.contains("th", "Aksi").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 2: Tab switching - Default tab Hutang
  // ----------------------------------------------------------
  it("Harus menampilkan tab Hutang sebagai default", () => {
    // Verifikasi tab Hutang aktif
    cy.contains("button", "Hutang (Toko)")
      .should("have.class", "bg-blue-600")
      .should("have.class", "text-white");

    // Verifikasi tab Piutang tidak aktif
    cy.contains("button", "Piutang (Pelanggan)")
      .should("have.class", "bg-white")
      .should("have.class", "text-gray-700");

    // Verifikasi tombol tambah sesuai tab
    cy.contains("button", "Tambah Hutang").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 3: Tab switching - Switch ke Piutang
  // ----------------------------------------------------------
  it("Harus bisa switch ke tab Piutang", () => {
    // Mock data piutang
    cy.intercept("GET", "**/api/debts?type=Piutang", {
      body: {
        data: [],
      },
    }).as("getPiutang");

    // Klik tab Piutang
    cy.contains("button", "Piutang (Pelanggan)").click();
    cy.wait("@getPiutang");

    // Verifikasi tab Piutang aktif
    cy.contains("button", "Piutang (Pelanggan)")
      .should("have.class", "bg-blue-600")
      .should("have.class", "text-white");

    // Verifikasi tombol tambah berubah
    cy.contains("button", "Tambah Piutang").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 4: Empty state - Belum ada hutang
  // ----------------------------------------------------------
  it("Harus menampilkan pesan jika belum ada hutang", () => {
    // Mock API dengan data kosong
    cy.intercept("GET", "**/api/debts?type=Hutang", {
      statusCode: 200,
      body: {
        data: [],
      },
    }).as("getDebts");

    cy.reload();
    cy.wait("@getDebts");

    // Verifikasi pesan empty state
    cy.contains("Belum ada data hutang.").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 5: Tampilkan list hutang
  // ----------------------------------------------------------
  it("Harus menampilkan daftar hutang dengan informasi lengkap", () => {
    // Mock API dengan data hutang
    cy.intercept("GET", "**/api/debts?type=Hutang", {
      body: {
        data: [
          {
            id: 1,
            type: "Hutang",
            amount: 5000000,
            due_date: "2024-12-31",
            status: "Belum Lunas",
            supplier: { name: "PT. Sumber Tirta" },
          },
          {
            id: 2,
            type: "Hutang",
            amount: 2500000,
            due_date: "2024-11-15",
            status: "Lunas",
            supplier: { name: "CV. Global Mart" },
          },
        ],
      },
    });

    cy.reload();

    // Verifikasi hutang 1
    cy.contains("td", "PT. Sumber Tirta").should("be.visible");
    cy.contains("td", "Rp5.000.000").should("be.visible");
    cy.contains("td", "31/12/2024").should("be.visible");
    cy.contains("span", "Belum Lunas").should("be.visible");

    // Verifikasi hutang 2
    cy.contains("td", "CV. Global Mart").should("be.visible");
    cy.contains("td", "Rp2.500.000").should("be.visible");
    cy.contains("span", "Lunas").should("be.visible");

    // Verifikasi total ada 2 hutang
    cy.get("tbody tr").should("have.length", 2);
  });

  // ----------------------------------------------------------
  // TEST 6: Tampilkan list piutang
  // ----------------------------------------------------------
  it("Harus menampilkan daftar piutang dengan informasi lengkap", () => {
    // Mock API dengan data piutang
    cy.intercept("GET", "**/api/debts?type=Piutang", {
      body: {
        data: [
          {
            id: 1,
            type: "Piutang",
            amount: 1500000,
            due_date: "2024-12-20",
            status: "Belum Lunas",
            customer_name: "Toko Alfa",
          },
          {
            id: 2,
            type: "Piutang",
            amount: 800000,
            due_date: "2024-11-25",
            status: "Lunas",
            customer_name: "Warung Beta",
          },
        ],
      },
    }).as("getPiutang");

    // Switch ke tab Piutang
    cy.contains("button", "Piutang (Pelanggan)").click();
    cy.wait("@getPiutang");

    // Verifikasi piutang 1
    cy.contains("td", "Toko Alfa").should("be.visible");
    cy.contains("td", "Rp1.500.000").should("be.visible");
    cy.contains("span", "Belum Lunas").should("be.visible");

    // Verifikasi piutang 2
    cy.contains("td", "Warung Beta").should("be.visible");
    cy.contains("td", "Rp800.000").should("be.visible");

    // Verifikasi total ada 2 piutang
    cy.get("tbody tr").should("have.length", 2);
  });

  // ----------------------------------------------------------
  // TEST 7: Status badges dengan warna yang benar
  // ----------------------------------------------------------
  it("Harus menampilkan badge status dengan styling yang benar", () => {
    // Mock data dengan berbagai status
    cy.intercept("GET", "**/api/debts?type=Hutang", {
      body: {
        data: [
          {
            id: 1,
            type: "Hutang",
            amount: 1000000,
            due_date: "2024-12-31",
            status: "Belum Lunas",
            supplier: { name: "Supplier A" },
          },
          {
            id: 2,
            type: "Hutang",
            amount: 2000000,
            due_date: "2024-11-15",
            status: "Lunas",
            supplier: { name: "Supplier B" },
          },
        ],
      },
    });

    cy.reload();

    // Verifikasi badge Belum Lunas (kuning)
    cy.contains("tr", "Supplier A").within(() => {
      cy.contains("span", "Belum Lunas")
        .should("have.class", "bg-yellow-100")
        .should("have.class", "text-yellow-700");
    });

    // Verifikasi badge Lunas (hijau)
    cy.contains("tr", "Supplier B").within(() => {
      cy.contains("span", "Lunas")
        .should("have.class", "bg-emerald-100")
        .should("have.class", "text-emerald-600");
    });
  });

  // ----------------------------------------------------------
  // TEST 8: CREATE - Buka modal tambah hutang
  // ----------------------------------------------------------
  it("Harus membuka modal form saat klik Tambah Hutang", () => {
    // Mock suppliers
    cy.intercept("GET", "**/api/suppliers*", {
      body: {
        data: [
          { id: 1, name: "Supplier A" },
          { id: 2, name: "Supplier B" },
        ],
      },
    });

    cy.reload();

    // Klik tombol Tambah Hutang
    cy.contains("button", "Tambah Hutang").click();

    // Verifikasi modal muncul
    cy.contains("h2", "Tambah Hutang").should("be.visible");

    // Verifikasi form fields
    cy.contains("label", "Nominal").should("be.visible");
    cy.contains("label", "Jatuh Tempo").should("be.visible");
    cy.contains("label", "Supplier").should("be.visible");

    // Verifikasi tombol
    cy.contains("button", "Batal").should("be.visible");
    cy.contains("button", "Simpan").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 9: CREATE - Buka modal tambah piutang
  // ----------------------------------------------------------
  it("Harus membuka modal form saat klik Tambah Piutang", () => {
    // Switch ke tab Piutang
    cy.intercept("GET", "**/api/debts?type=Piutang", {
      body: { data: [] },
    });

    cy.contains("button", "Piutang (Pelanggan)").click();

    // Klik tombol Tambah Piutang
    cy.contains("button", "Tambah Piutang").click();

    // Verifikasi modal muncul
    cy.contains("h2", "Tambah Piutang").should("be.visible");

    // Verifikasi form fields - untuk Piutang ada Nama Pelanggan
    cy.contains("label", "Nominal").should("be.visible");
    cy.contains("label", "Jatuh Tempo").should("be.visible");
    cy.contains("label", "Nama Pelanggan").should("be.visible");

    // Tidak ada dropdown Supplier
    cy.contains("label", "Supplier").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 10: CREATE - Tutup modal dengan tombol Batal
  // ----------------------------------------------------------
  it("Harus bisa menutup modal dengan tombol Batal", () => {
    cy.intercept("GET", "**/api/suppliers*", { body: { data: [] } });

    // Buka modal
    cy.contains("button", "Tambah Hutang").click();

    // Verifikasi modal terbuka
    cy.contains("h2", "Tambah Hutang").should("be.visible");

    // Klik tombol Batal
    cy.contains("button", "Batal").click();

    // Verifikasi modal tertutup
    cy.contains("h2", "Tambah Hutang").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 11: CREATE - Form validation field wajib
  // ----------------------------------------------------------
  it("Harus mencegah submit jika field wajib kosong", () => {
    cy.intercept("GET", "**/api/suppliers*", {
      body: { data: [{ id: 1, name: "Supplier Test" }] },
    });

    cy.intercept("POST", "**/api/debts", {
      statusCode: 201,
      body: { message: "Success" },
    }).as("createDebt");

    cy.intercept("GET", "**/api/debts?type=Hutang", {
      body: { data: [] },
    });

    // Buka modal
    cy.contains("button", "Tambah Hutang").click();

    // Coba submit tanpa mengisi form
    cy.contains("button", "Simpan").click();

    // Modal tidak tutup (form validation mencegah)
    cy.contains("h2", "Tambah Hutang").should("be.visible");

    // API tidak dipanggil
    cy.get("@createDebt.all").should("have.length", 0);
  });

  // ----------------------------------------------------------
  // TEST 12: CREATE - Tambah hutang berhasil
  // ----------------------------------------------------------
  it("Harus bisa menambah hutang baru", () => {
    // Mock suppliers
    cy.intercept("GET", "**/api/suppliers*", {
      body: {
        data: [
          { id: 1, name: "PT. Supplier Test" },
          { id: 2, name: "CV. Supplier Lain" },
        ],
      },
    });

    // Mock create API
    cy.intercept("POST", "**/api/debts", {
      statusCode: 201,
      body: {
        message: "Debt created successfully",
        data: {
          id: 1,
          type: "Hutang",
          amount: 5000000,
          due_date: "2024-12-31",
          supplier_id: 1,
        },
      },
    }).as("createDebt");

    // Mock refresh debts
    cy.intercept("GET", "**/api/debts?type=Hutang", {
      body: {
        data: [
          {
            id: 1,
            type: "Hutang",
            amount: 5000000,
            due_date: "2024-12-31",
            status: "Belum Lunas",
            supplier: { name: "PT. Supplier Test" },
          },
        ],
      },
    });

    cy.reload();

    // Buka modal
    cy.contains("button", "Tambah Hutang").click();

    // Isi form
    cy.get('input[type="number"]').type("5000000");
    cy.get('input[type="date"]').type("2024-12-31");
    cy.get("select").select("1");

    // Submit
    cy.contains("button", "Simpan").click();
    cy.wait("@createDebt");

    // Verifikasi payload
    cy.get("@createDebt")
      .its("request.body")
      .should("deep.include", {
        type: "Hutang",
        amount: 5000000,
        due_date: "2024-12-31",
        supplier_id: 1,
        customer_name: null,
      });

    // Verifikasi modal tertutup
    cy.contains("h2", "Tambah Hutang").should("not.exist");

    // Verifikasi hutang muncul di tabel
    cy.contains("PT. Supplier Test").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 13: CREATE - Tambah piutang berhasil
  // ----------------------------------------------------------
  it("Harus bisa menambah piutang baru", () => {
    // Switch ke tab Piutang
    cy.intercept("GET", "**/api/debts?type=Piutang", {
      body: { data: [] },
    }).as("getPiutangEmpty");

    cy.contains("button", "Piutang (Pelanggan)").click();
    cy.wait("@getPiutangEmpty");

    // Mock create API
    cy.intercept("POST", "**/api/debts", {
      statusCode: 201,
      body: {
        message: "Debt created successfully",
      },
    }).as("createPiutang");

    // Mock refresh piutang
    cy.intercept("GET", "**/api/debts?type=Piutang", {
      body: {
        data: [
          {
            id: 1,
            type: "Piutang",
            amount: 1500000,
            due_date: "2024-12-20",
            status: "Belum Lunas",
            customer_name: "Toko Maju Jaya",
          },
        ],
      },
    });

    // Buka modal
    cy.contains("button", "Tambah Piutang").click();

    // Isi form
    cy.get('input[type="number"]').type("1500000");
    cy.get('input[type="date"]').type("2024-12-20");
    cy.get('input[type="text"]').type("Toko Maju Jaya");

    // Submit
    cy.contains("button", "Simpan").click();
    cy.wait("@createPiutang");

    // Verifikasi payload
    cy.get("@createPiutang")
      .its("request.body")
      .should("deep.include", {
        type: "Piutang",
        amount: 1500000,
        due_date: "2024-12-20",
        supplier_id: null,
        customer_name: "Toko Maju Jaya",
      });

    // Verifikasi modal tertutup
    cy.contains("h2", "Tambah Piutang").should("not.exist");

    // Verifikasi piutang muncul di tabel
    cy.contains("Toko Maju Jaya").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 14: CREATE - Error handling
  // ----------------------------------------------------------
  it("Harus menampilkan alert error jika gagal create", () => {
    cy.intercept("GET", "**/api/suppliers*", {
      body: { data: [{ id: 1, name: "Supplier Test" }] },
    });

    // Mock create API error
    cy.intercept("POST", "**/api/debts", {
      statusCode: 400,
      body: {
        message: "Invalid data provided",
      },
    }).as("createDebtError");

    // Stub window.alert
    cy.window().then((win) => {
      cy.stub(win, "alert").as("alert");
    });

    cy.reload();

    // Buka modal
    cy.contains("button", "Tambah Hutang").click();

    // Isi form
    cy.get('input[type="number"]').type("1000000");
    cy.get('input[type="date"]').type("2024-12-31");
    cy.get("select").select("1");

    // Submit
    cy.contains("button", "Simpan").click();
    cy.wait("@createDebtError");

    // Verifikasi alert error
    cy.get("@alert").should("have.been.calledWith", "Invalid data provided");
  });

  // ----------------------------------------------------------
  // TEST 15: MARK PAID - Tandai hutang sebagai lunas
  // ----------------------------------------------------------
  it("Harus bisa menandai hutang sebagai lunas", () => {
    // Mock initial data - Belum Lunas
    cy.intercept("GET", "**/api/debts?type=Hutang", {
      body: {
        data: [
          {
            id: 1,
            type: "Hutang",
            amount: 2000000,
            due_date: "2024-12-31",
            status: "Belum Lunas",
            supplier: { name: "Supplier A" },
          },
        ],
      },
    });

    // Mock mark paid API
    cy.intercept("PATCH", "**/api/debts/1/status", {
      statusCode: 200,
      body: { message: "Status updated" },
    }).as("markPaid");

    // Mock after mark paid - status menjadi Lunas
    cy.intercept("GET", "**/api/debts?type=Hutang", {
      body: {
        data: [
          {
            id: 1,
            type: "Hutang",
            amount: 2000000,
            due_date: "2024-12-31",
            status: "Lunas",
            supplier: { name: "Supplier A" },
          },
        ],
      },
    }).as("getDebtsAfterPaid");

    cy.reload();

    // Verifikasi status awal Belum Lunas
    cy.contains("span", "Belum Lunas").should("be.visible");

    // Klik tombol Tandai Lunas
    cy.contains("button", "Tandai Lunas").click();
    cy.wait("@markPaid");
    cy.wait("@getDebtsAfterPaid");

    // Verifikasi status berubah menjadi Lunas
    cy.contains("span", "Lunas").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 16: MARK PAID - Tandai piutang sebagai lunas
  // ----------------------------------------------------------
  it("Harus bisa menandai piutang sebagai lunas", () => {
    // Switch ke tab Piutang
    cy.intercept("GET", "**/api/debts?type=Piutang", {
      body: {
        data: [
          {
            id: 1,
            type: "Piutang",
            amount: 1500000,
            due_date: "2024-12-20",
            status: "Belum Lunas",
            customer_name: "Toko Beta",
          },
        ],
      },
    }).as("getPiutang");

    cy.contains("button", "Piutang (Pelanggan)").click();
    cy.wait("@getPiutang");

    // Mock mark paid API
    cy.intercept("PATCH", "**/api/debts/1/status", {
      statusCode: 200,
      body: { message: "Status updated" },
    }).as("markPaid");

    cy.intercept("GET", "**/api/debts?type=Piutang", {
      body: {
        data: [
          {
            id: 1,
            type: "Piutang",
            amount: 1500000,
            due_date: "2024-12-20",
            status: "Lunas",
            customer_name: "Toko Beta",
          },
        ],
      },
    });

    // Klik tombol Tandai Lunas
    cy.contains("button", "Tandai Lunas").click();
    cy.wait("@markPaid");

    // Verifikasi status berubah
    cy.contains("span", "Lunas").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 17: MARK PAID - Error handling
  // ----------------------------------------------------------
  it("Harus menampilkan alert error jika gagal mark paid", () => {
    cy.intercept("GET", "**/api/debts?type=Hutang", {
      body: {
        data: [
          {
            id: 1,
            type: "Hutang",
            amount: 1000000,
            due_date: "2024-12-31",
            status: "Belum Lunas",
            supplier: { name: "Supplier Test" },
          },
        ],
      },
    });

    // Mock mark paid API error
    cy.intercept("PATCH", "**/api/debts/1/status", {
      statusCode: 400,
      body: {
        message: "Failed to update status",
      },
    }).as("markPaidError");

    // Stub window.alert
    cy.window().then((win) => {
      cy.stub(win, "alert").as("alert");
    });

    cy.reload();

    // Klik tombol Tandai Lunas
    cy.contains("button", "Tandai Lunas").click();
    cy.wait("@markPaidError");

    // Verifikasi alert error
    cy.get("@alert").should("have.been.calledWith", "Failed to update status");
  });

  // ----------------------------------------------------------
  // TEST 18: DELETE - Hapus hutang dengan confirmation
  // ----------------------------------------------------------
  it("Harus bisa menghapus hutang setelah konfirmasi", () => {
    // Mock debts
    cy.intercept("GET", "**/api/debts?type=Hutang", {
      body: {
        data: [
          {
            id: 1,
            type: "Hutang",
            amount: 1000000,
            due_date: "2024-12-31",
            status: "Belum Lunas",
            supplier: { name: "Supplier Will Be Deleted" },
          },
        ],
      },
    });

    // Mock delete API
    cy.intercept("DELETE", "**/api/debts/1", {
      statusCode: 200,
      body: { message: "Debt deleted successfully" },
    }).as("deleteDebt");

    // Mock after delete - empty
    cy.intercept("GET", "**/api/debts?type=Hutang", {
      body: { data: [] },
    }).as("getDebtsAfterDelete");

    cy.reload();

    // Stub confirm
    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);
    });

    // Klik tombol Hapus
    cy.contains("button", "Hapus").click();
    cy.wait("@deleteDebt");

    // Verifikasi empty state muncul
    cy.wait("@getDebtsAfterDelete");
    cy.contains("Belum ada data hutang.").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 19: DELETE - Cancel deletion
  // ----------------------------------------------------------
  it("Harus membatalkan hapus jika user klik Cancel", () => {
    cy.intercept("GET", "**/api/debts?type=Hutang", {
      body: {
        data: [
          {
            id: 1,
            type: "Hutang",
            amount: 1000000,
            due_date: "2024-12-31",
            status: "Belum Lunas",
            supplier: { name: "Supplier Test" },
          },
        ],
      },
    });

    // Mock delete API (seharusnya tidak dipanggil)
    cy.intercept("DELETE", "**/api/debts/1", {
      statusCode: 200,
    }).as("deleteDebt");

    cy.reload();

    // Stub confirm to return false (cancel)
    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(false);
    });

    // Klik tombol Hapus
    cy.contains("button", "Hapus").click();

    // Verifikasi API delete TIDAK dipanggil
    cy.get("@deleteDebt.all").should("have.length", 0);

    // Data masih ada
    cy.contains("Supplier Test").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 20: DELETE - Error handling
  // ----------------------------------------------------------
  it("Harus menampilkan alert error jika gagal delete", () => {
    cy.intercept("GET", "**/api/debts?type=Hutang", {
      body: {
        data: [
          {
            id: 1,
            type: "Hutang",
            amount: 1000000,
            due_date: "2024-12-31",
            status: "Belum Lunas",
            supplier: { name: "Supplier Test" },
          },
        ],
      },
    });

    // Mock delete API error
    cy.intercept("DELETE", "**/api/debts/1", {
      statusCode: 400,
      body: {
        message: "Cannot delete debt with active transactions",
      },
    }).as("deleteDebtError");

    // Stub confirm & alert
    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);
      cy.stub(win, "alert").as("alert");
    });

    cy.reload();

    // Klik tombol Hapus
    cy.contains("button", "Hapus").click();
    cy.wait("@deleteDebtError");

    // Verifikasi alert error
    cy.get("@alert").should(
      "have.been.calledWith",
      "Cannot delete debt with active transactions"
    );
  });

  // ----------------------------------------------------------
  // TEST 21: Loading state
  // ----------------------------------------------------------
  it("Harus menampilkan loading state saat fetch data", () => {
    // Mock API dengan delay
    cy.intercept("GET", "**/api/debts?type=Hutang", (req) => {
      req.reply((res) => {
        res.setDelay(1000);
        res.send({ body: { data: [] } });
      });
    }).as("getDebts");

    cy.reload();

    // Verifikasi loading text
    cy.contains("Memuat data...").should("be.visible");

    cy.wait("@getDebts");

    // Verifikasi loading hilang
    cy.contains("Memuat data...").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 22: Error state - API error
  // ----------------------------------------------------------
  it("Harus menampilkan error message jika API gagal", () => {
    // Mock API error
    cy.intercept("GET", "**/api/debts?type=Hutang", {
      statusCode: 500,
      body: {
        message: "Internal server error",
      },
    }).as("getDebtsError");

    cy.reload();
    cy.wait("@getDebtsError");

    // Verifikasi error message muncul
    cy.contains("Internal server error").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 23: Required attributes
  // ----------------------------------------------------------
  it("Harus memiliki attribute required pada field wajib", () => {
    cy.intercept("GET", "**/api/suppliers*", {
      body: { data: [{ id: 1, name: "Supplier Test" }] },
    });

    cy.reload();

    cy.contains("button", "Tambah Hutang").click();

    // Field wajib
    cy.get('input[type="number"]').should("have.attr", "required");
    cy.get('input[type="date"]').should("have.attr", "required");
    cy.get("select").should("have.attr", "required");
  });

  // ----------------------------------------------------------
  // TEST 24: Format currency IDR
  // ----------------------------------------------------------
  it("Harus menampilkan nominal dalam format IDR yang benar", () => {
    cy.intercept("GET", "**/api/debts?type=Hutang", {
      body: {
        data: [
          {
            id: 1,
            type: "Hutang",
            amount: 5500000,
            due_date: "2024-12-31",
            status: "Belum Lunas",
            supplier: { name: "Supplier Test" },
          },
        ],
      },
    });

    cy.reload();

    // Verifikasi format IDR
    cy.contains("td", "Rp5.500.000").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 25: Format date Indonesia
  // ----------------------------------------------------------
  it("Harus menampilkan tanggal dalam format Indonesia (dd/mm/yyyy)", () => {
    cy.intercept("GET", "**/api/debts?type=Hutang", {
      body: {
        data: [
          {
            id: 1,
            type: "Hutang",
            amount: 1000000,
            due_date: "2024-12-25",
            status: "Belum Lunas",
            supplier: { name: "Supplier Test" },
          },
        ],
      },
    });

    cy.reload();

    // Verifikasi format date
    cy.contains("td", "25/12/2024").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 26: Default date value - Today
  // ----------------------------------------------------------
  it("Harus mengisi default date dengan tanggal hari ini", () => {
    cy.intercept("GET", "**/api/suppliers*", {
      body: { data: [{ id: 1, name: "Supplier Test" }] },
    });

    cy.reload();

    cy.contains("button", "Tambah Hutang").click();

    // Verifikasi input date memiliki value (today)
    cy.get('input[type="date"]').should("have.value");
    cy.get('input[type="date"]').invoke("val").should("match", /^\d{4}-\d{2}-\d{2}$/);
  });

  // ----------------------------------------------------------
  // TEST 27: Loading state saat saving
  // ----------------------------------------------------------
  it("Harus menampilkan loading state saat submit form", () => {
    cy.intercept("GET", "**/api/suppliers*", {
      body: { data: [{ id: 1, name: "Supplier Test" }] },
    });

    // Mock API dengan delay
    cy.intercept("POST", "**/api/debts", (req) => {
      req.reply((res) => {
        res.setDelay(2000);
        res.send({
          statusCode: 201,
          body: { message: "Success" },
        });
      });
    }).as("createDebt");

    cy.reload();

    // Buka modal
    cy.contains("button", "Tambah Hutang").click();

    // Isi form
    cy.get('input[type="number"]').type("1000000");
    cy.get('input[type="date"]').type("2024-12-31");
    cy.get("select").select("1");

    // Submit
    cy.contains("button", "Simpan").click();

    // Verifikasi loading text
    cy.contains("button", "Menyimpan...").should("be.visible");
    cy.contains("button", "Menyimpan...").should("be.disabled");

    cy.wait("@createDebt");

    // Verifikasi loading hilang
    cy.contains("button", "Menyimpan...").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 28: Multiple debts display
  // ----------------------------------------------------------
  it("Harus menampilkan multiple hutang/piutang dengan styling yang benar", () => {
    cy.intercept("GET", "**/api/debts?type=Hutang", {
      body: {
        data: [
          {
            id: 1,
            type: "Hutang",
            amount: 5000000,
            due_date: "2024-12-31",
            status: "Belum Lunas",
            supplier: { name: "Supplier A" },
          },
          {
            id: 2,
            type: "Hutang",
            amount: 3000000,
            due_date: "2024-11-20",
            status: "Lunas",
            supplier: { name: "Supplier B" },
          },
          {
            id: 3,
            type: "Hutang",
            amount: 2000000,
            due_date: "2024-12-15",
            status: "Belum Lunas",
            supplier: { name: "Supplier C" },
          },
          {
            id: 4,
            type: "Hutang",
            amount: 1500000,
            due_date: "2024-11-30",
            status: "Lunas",
            supplier: { name: "Supplier D" },
          },
        ],
      },
    });

    cy.reload();

    // Verifikasi ada 4 hutang
    cy.get("tbody tr").should("have.length", 4);

    // Verifikasi semua hutang terlihat
    cy.contains("Supplier A").should("be.visible");
    cy.contains("Supplier B").should("be.visible");
    cy.contains("Supplier C").should("be.visible");
    cy.contains("Supplier D").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 29: FULL FLOW - Complete Hutang cycle
  // ----------------------------------------------------------
  it("FULL FLOW: Create Hutang → Mark Paid → Delete", () => {
    // 1. Initial state - empty
    cy.intercept("GET", "**/api/debts?type=Hutang", {
      body: { data: [] },
    }).as("getDebtsEmpty");

    cy.intercept("GET", "**/api/suppliers*", {
      body: { data: [{ id: 1, name: "PT. Flow Test" }] },
    });

    cy.reload();
    cy.wait("@getDebtsEmpty");

    // Verifikasi empty state
    cy.contains("Belum ada data hutang.").should("be.visible");

    // 2. CREATE
    cy.intercept("POST", "**/api/debts", {
      statusCode: 201,
      body: { message: "Debt created" },
    }).as("createDebt");

    cy.intercept("GET", "**/api/debts?type=Hutang", {
      body: {
        data: [
          {
            id: 1,
            type: "Hutang",
            amount: 3000000,
            due_date: "2024-12-31",
            status: "Belum Lunas",
            supplier: { name: "PT. Flow Test" },
          },
        ],
      },
    }).as("getDebtsAfterCreate");

    cy.contains("button", "Tambah Hutang").click();
    cy.get('input[type="number"]').type("3000000");
    cy.get('input[type="date"]').type("2024-12-31");
    cy.get("select").select("1");
    cy.contains("button", "Simpan").click();
    cy.wait("@createDebt");

    // 3. VERIFY READ
    cy.wait("@getDebtsAfterCreate");
    cy.contains("PT. Flow Test").should("be.visible");
    cy.contains("Rp3.000.000").should("be.visible");
    cy.contains("span", "Belum Lunas").should("be.visible");

    // 4. MARK PAID
    cy.intercept("PATCH", "**/api/debts/1/status", {
      statusCode: 200,
      body: { message: "Status updated" },
    }).as("markPaid");

    cy.intercept("GET", "**/api/debts?type=Hutang", {
      body: {
        data: [
          {
            id: 1,
            type: "Hutang",
            amount: 3000000,
            due_date: "2024-12-31",
            status: "Lunas",
            supplier: { name: "PT. Flow Test" },
          },
        ],
      },
    });

    cy.contains("button", "Tandai Lunas").click();
    cy.wait("@markPaid");

    // Verifikasi status berubah
    cy.contains("span", "Lunas").should("be.visible");

    // 5. DELETE
    cy.intercept("DELETE", "**/api/debts/1", {
      statusCode: 200,
      body: { message: "Debt deleted" },
    }).as("deleteDebt");

    cy.intercept("GET", "**/api/debts?type=Hutang", {
      body: { data: [] },
    }).as("getDebtsAfterDelete");

    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);
    });

    cy.contains("button", "Hapus").click();
    cy.wait("@deleteDebt");

    // Verifikasi empty state returns
    cy.wait("@getDebtsAfterDelete");
    cy.contains("Belum ada data hutang.").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 30: FULL FLOW - Complete Piutang cycle
  // ----------------------------------------------------------
  it("FULL FLOW: Create Piutang → Mark Paid → Delete", () => {
    // Switch ke tab Piutang
    cy.intercept("GET", "**/api/debts?type=Piutang", {
      body: { data: [] },
    }).as("getPiutangEmpty");

    cy.contains("button", "Piutang (Pelanggan)").click();
    cy.wait("@getPiutangEmpty");

    // CREATE
    cy.intercept("POST", "**/api/debts", {
      statusCode: 201,
      body: { message: "Success" },
    }).as("createPiutang");

    cy.intercept("GET", "**/api/debts?type=Piutang", {
      body: {
        data: [
          {
            id: 1,
            type: "Piutang",
            amount: 2000000,
            due_date: "2024-12-25",
            status: "Belum Lunas",
            customer_name: "Toko Full Flow",
          },
        ],
      },
    });

    cy.contains("button", "Tambah Piutang").click();
    cy.get('input[type="number"]').type("2000000");
    cy.get('input[type="date"]').type("2024-12-25");
    cy.get('input[type="text"]').type("Toko Full Flow");
    cy.contains("button", "Simpan").click();
    cy.wait("@createPiutang");

    // VERIFY
    cy.contains("Toko Full Flow").should("be.visible");
    cy.contains("Rp2.000.000").should("be.visible");

    // MARK PAID
    cy.intercept("PATCH", "**/api/debts/1/status", {
      statusCode: 200,
    }).as("markPaid");

    cy.contains("button", "Tandai Lunas").click();
    cy.wait("@markPaid");

    // DELETE
    cy.intercept("DELETE", "**/api/debts/1", {
      statusCode: 200,
    }).as("deleteDebt");

    cy.intercept("GET", "**/api/debts?type=Piutang", {
      body: { data: [] },
    });

    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);
    });

    cy.contains("button", "Hapus").click();
    cy.wait("@deleteDebt");

    // Verifikasi empty state
    cy.contains("Belum ada data piutang.").should("be.visible");
  });
});
