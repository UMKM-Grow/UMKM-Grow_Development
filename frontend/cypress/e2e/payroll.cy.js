/**
 * ============================================================
 * SKENARIO PENGUJIAN: Payroll (Gaji Karyawan) - UMKM-Grow
 * ============================================================
 * Menguji seluruh fitur Penggajian Karyawan end-to-end:
 *  - Tampilan halaman payroll
 *  - Summary cards (Total Penggajian, Total Gaji, Jumlah Karyawan)
 *  - CREATE payroll (input gaji baru)
 *  - Form validation (field wajib)
 *  - Auto calculate Total Gaji Bersih
 *  - Filter by periode
 *  - DELETE payroll dengan confirmation
 *  - Role badges
 *  - Format currency (IDR)
 *  - Format periode (Bulan Tahun)
 *  - Modal (open/close)
 *  - Empty state handling
 *  - Loading & error states
 * ============================================================
 */

describe("Skenario Pengujian Payroll Management UMKM-Grow", () => {
  let users;

  before(() => {
    cy.fixture("user").then((data) => {
      users = data;
    });
  });

  beforeEach(() => {
    // Login dan navigasi ke Payroll
    cy.clearLocalStorage();
    cy.login(users.validUser.email, users.validUser.password);
    cy.visit("/payroll");
  });

  // ----------------------------------------------------------
  // TEST 1: Tampilan halaman Payroll
  // ----------------------------------------------------------
  it("Harus menampilkan halaman Penggajian Karyawan dengan elemen yang benar", () => {
    // Verifikasi judul halaman
    cy.contains("h1", "Penggajian Karyawan").should("be.visible");
    cy.contains("Kelola data gaji, bonus, dan potongan").should("be.visible");

    // Verifikasi tombol Input Gaji Baru
    cy.contains("button", "Input Gaji Baru").should("be.visible");

    // Verifikasi summary cards
    cy.contains("Total Penggajian").should("be.visible");
    cy.contains("Total Gaji Dibayar").should("be.visible");
    cy.contains("Jumlah Karyawan").should("be.visible");

    // Verifikasi section Riwayat Penggajian
    cy.contains("Riwayat Penggajian").should("be.visible");

    // Verifikasi filter periode
    cy.contains("label", "Filter periode:").should("be.visible");
    cy.get("select").contains("option", "Semua Periode").should("exist");

    // Verifikasi tabel headers
    cy.contains("th", "Karyawan").should("be.visible");
    cy.contains("th", "Role").should("be.visible");
    cy.contains("th", "Periode").should("be.visible");
    cy.contains("th", "Gaji Pokok").should("be.visible");
    cy.contains("th", "Bonus").should("be.visible");
    cy.contains("th", "Potongan").should("be.visible");
    cy.contains("th", "Total Bersih").should("be.visible");
    cy.contains("th", "Catatan").should("be.visible");
    cy.contains("th", "Aksi").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 2: Empty state - Belum ada data
  // ----------------------------------------------------------
  it("Harus menampilkan pesan jika belum ada data penggajian", () => {
    // Mock API dengan data kosong
    cy.intercept("GET", "**/api/payroll*", {
      statusCode: 200,
      body: [],
    }).as("getPayroll");

    cy.intercept("GET", "**/api/payroll/employees*", {
      body: [],
    });

    cy.reload();
    cy.wait("@getPayroll");

    // Verifikasi pesan empty state
    cy.contains("Belum ada data penggajian.").should("be.visible");

    // Verifikasi summary cards menampilkan 0
    cy.contains("Total Penggajian").parent().contains("0").should("be.visible");
    cy.contains("Jumlah Karyawan").parent().contains("0").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 3: Summary cards dengan data
  // ----------------------------------------------------------
  it("Harus menampilkan summary cards dengan data yang benar", () => {
    // Mock payroll data
    cy.intercept("GET", "**/api/payroll*", {
      body: [
        {
          id: 1,
          user_id: 1,
          periode: "2024-12",
          base_salary: 3000000,
          bonus: 500000,
          deductions: 200000,
          total_salary: 3300000,
          user: { name: "Employee 1", role: "kasir" },
        },
        {
          id: 2,
          user_id: 2,
          periode: "2024-12",
          base_salary: 4000000,
          bonus: 1000000,
          deductions: 0,
          total_salary: 5000000,
          user: { name: "Employee 2", role: "admin" },
        },
      ],
    });

    cy.intercept("GET", "**/api/payroll/employees*", {
      body: [
        { id: 1, name: "Employee 1", role: "kasir" },
        { id: 2, name: "Employee 2", role: "admin" },
      ],
    });

    cy.reload();

    // Verifikasi Total Penggajian
    cy.contains("Total Penggajian").parent().within(() => {
      cy.contains("2").should("be.visible");
      cy.contains("data tersaring").should("be.visible");
    });

    // Verifikasi Total Gaji Dibayar
    cy.contains("Total Gaji Dibayar").parent().within(() => {
      cy.contains("Rp8.300.000").should("be.visible");
    });

    // Verifikasi Jumlah Karyawan
    cy.contains("Jumlah Karyawan").parent().within(() => {
      cy.contains("2").should("be.visible");
    });
  });

  // ----------------------------------------------------------
  // TEST 4: Tampilkan list payroll
  // ----------------------------------------------------------
  it("Harus menampilkan daftar payroll dengan informasi lengkap", () => {
    cy.intercept("GET", "**/api/payroll*", {
      body: [
        {
          id: 1,
          user_id: 1,
          periode: "2024-12",
          base_salary: 3000000,
          bonus: 500000,
          deductions: 200000,
          total_salary: 3300000,
          notes: "Gaji bulan Desember",
          user: { name: "John Doe", role: "kasir" },
        },
        {
          id: 2,
          user_id: 2,
          periode: "2024-11",
          base_salary: 4000000,
          bonus: 0,
          deductions: 500000,
          total_salary: 3500000,
          notes: null,
          user: { name: "Jane Smith", role: "admin" },
        },
      ],
    });

    cy.intercept("GET", "**/api/payroll/employees*", { body: [] });

    cy.reload();

    // Verifikasi payroll 1
    cy.contains("td", "John Doe").should("be.visible");
    cy.contains("span", "kasir").should("be.visible");
    cy.contains("td", "Desember 2024").should("be.visible");
    cy.contains("td", "Rp3.000.000").should("be.visible");
    cy.contains("td", "+Rp500.000").should("be.visible"); // Bonus
    cy.contains("td", "-Rp200.000").should("be.visible"); // Potongan
    cy.contains("td", "Rp3.300.000").should("be.visible"); // Total
    cy.contains("td", "Gaji bulan Desember").should("be.visible");

    // Verifikasi payroll 2
    cy.contains("td", "Jane Smith").should("be.visible");
    cy.contains("span", "admin").should("be.visible");
    cy.contains("td", "November 2024").should("be.visible");

    // Verifikasi total ada 2 payroll
    cy.get("tbody tr").should("have.length", 2);
  });

  // ----------------------------------------------------------
  // TEST 5: Role badges dengan warna yang benar
  // ----------------------------------------------------------
  it("Harus menampilkan badge role dengan styling yang benar", () => {
    cy.intercept("GET", "**/api/payroll*", {
      body: [
        {
          id: 1,
          user_id: 1,
          periode: "2024-12",
          base_salary: 3000000,
          bonus: 0,
          deductions: 0,
          total_salary: 3000000,
          user: { name: "Employee Kasir", role: "kasir" },
        },
        {
          id: 2,
          user_id: 2,
          periode: "2024-12",
          base_salary: 5000000,
          bonus: 0,
          deductions: 0,
          total_salary: 5000000,
          user: { name: "Employee Admin", role: "admin" },
        },
      ],
    });

    cy.intercept("GET", "**/api/payroll/employees*", { body: [] });

    cy.reload();

    // Verifikasi badge dengan styling
    cy.contains("tr", "Employee Kasir").within(() => {
      cy.contains("span", "kasir")
        .should("have.class", "bg-blue-50")
        .should("have.class", "text-blue-600");
    });

    cy.contains("tr", "Employee Admin").within(() => {
      cy.contains("span", "admin")
        .should("have.class", "bg-blue-50")
        .should("have.class", "text-blue-600");
    });
  });

  // ----------------------------------------------------------
  // TEST 6: CREATE - Buka modal input gaji baru
  // ----------------------------------------------------------
  it("Harus membuka modal form saat klik Input Gaji Baru", () => {
    // Mock employees
    cy.intercept("GET", "**/api/payroll/employees*", {
      body: [
        { id: 1, name: "Employee 1", role: "kasir" },
        { id: 2, name: "Employee 2", role: "admin" },
      ],
    });

    cy.reload();

    // Klik tombol Input Gaji Baru
    cy.contains("button", "Input Gaji Baru").click();

    // Verifikasi modal muncul
    cy.contains("h2", "Input Gaji Baru").should("be.visible");

    // Verifikasi form fields
    cy.contains("label", "Karyawan").should("be.visible");
    cy.contains("label", "Periode (Bulan & Tahun)").should("be.visible");
    cy.contains("label", "Gaji Pokok (Rp)").should("be.visible");
    cy.contains("label", "Bonus Performa (Rp)").should("be.visible");
    cy.contains("label", "Potongan / Kasbon (Rp)").should("be.visible");
    cy.contains("label", "Catatan").should("be.visible");

    // Verifikasi Total Gaji Bersih display
    cy.contains("Total Gaji Bersih:").should("be.visible");
    cy.contains("= Gaji Pokok + Bonus − Potongan").should("be.visible");

    // Verifikasi tombol
    cy.contains("button", "Batal").should("be.visible");
    cy.contains("button", "Simpan Gaji").should("be.visible");

    // Verifikasi close button
    cy.get("button").contains("✕").should("exist");
  });

  // ----------------------------------------------------------
  // TEST 7: CREATE - Tutup modal dengan tombol Batal
  // ----------------------------------------------------------
  it("Harus menutup modal saat klik tombol Batal", () => {
    cy.intercept("GET", "**/api/payroll/employees*", {
      body: [{ id: 1, name: "Employee 1", role: "kasir" }],
    });

    cy.reload();

    // Buka modal
    cy.contains("button", "Input Gaji Baru").click();
    cy.contains("h2", "Input Gaji Baru").should("be.visible");

    // Klik tombol Batal
    cy.contains("button", "Batal").click();

    // Verifikasi modal tertutup
    cy.contains("h2", "Input Gaji Baru").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 8: CREATE - Tutup modal dengan tombol X
  // ----------------------------------------------------------
  it("Harus menutup modal saat klik tombol X (close)", () => {
    cy.intercept("GET", "**/api/payroll/employees*", {
      body: [{ id: 1, name: "Employee 1", role: "kasir" }],
    });

    cy.reload();

    // Buka modal
    cy.contains("button", "Input Gaji Baru").click();
    cy.contains("h2", "Input Gaji Baru").should("be.visible");

    // Klik tombol X
    cy.get("button").contains("✕").click();

    // Verifikasi modal tertutup
    cy.contains("h2", "Input Gaji Baru").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 9: CREATE - Validasi field wajib
  // ----------------------------------------------------------
  it("Harus menampilkan error jika field wajib tidak diisi", () => {
    cy.intercept("GET", "**/api/payroll/employees*", {
      body: [{ id: 1, name: "Employee 1", role: "kasir" }],
    });

    cy.reload();

    // Buka modal
    cy.contains("button", "Input Gaji Baru").click();

    // Submit tanpa mengisi form
    cy.contains("button", "Simpan Gaji").click();

    // Verifikasi error muncul (HTML5 validation atau custom error)
    cy.contains("h2", "Input Gaji Baru").should("be.visible"); // Modal masih terbuka
  });

  // ----------------------------------------------------------
  // TEST 10: CREATE - Auto calculate Total Gaji Bersih
  // ----------------------------------------------------------
  it("Harus menghitung otomatis Total Gaji Bersih (Gaji Pokok + Bonus - Potongan)", () => {
    cy.intercept("GET", "**/api/payroll/employees*", {
      body: [{ id: 1, name: "Employee 1", role: "kasir" }],
    });

    cy.reload();

    // Buka modal
    cy.contains("button", "Input Gaji Baru").click();

    // Input data
    cy.get('input[name="base_salary"]').type("5000000");
    cy.get('input[name="bonus"]').type("1000000");
    cy.get('input[name="deductions"]').type("500000");

    // Verifikasi auto calculate: 5000000 + 1000000 - 500000 = 5500000
    cy.contains("Total Gaji Bersih:").parent().within(() => {
      cy.contains("Rp5.500.000").should("be.visible");
    });

    // Update values
    cy.get('input[name="bonus"]').clear().type("2000000");

    // Verifikasi update: 5000000 + 2000000 - 500000 = 6500000
    cy.contains("Total Gaji Bersih:").parent().within(() => {
      cy.contains("Rp6.500.000").should("be.visible");
    });
  });

  // ----------------------------------------------------------
  // TEST 11: CREATE - Tambah payroll berhasil
  // ----------------------------------------------------------
  it("Harus berhasil menambah payroll baru", () => {
    // Mock employees
    cy.intercept("GET", "**/api/payroll/employees*", {
      body: [
        { id: 1, name: "John Doe", role: "kasir" },
        { id: 2, name: "Jane Smith", role: "admin" },
      ],
    });

    // Mock POST success
    cy.intercept("POST", "**/api/payroll", {
      statusCode: 201,
      body: { id: 100, message: "Payroll berhasil ditambahkan" },
    }).as("createPayroll");

    // Mock GET after create
    cy.intercept("GET", "**/api/payroll*", {
      body: [
        {
          id: 100,
          user_id: 1,
          periode: "2024-12",
          base_salary: 3500000,
          bonus: 500000,
          deductions: 200000,
          total_salary: 3800000,
          notes: "Gaji Desember",
          user: { name: "John Doe", role: "kasir" },
        },
      ],
    }).as("getPayrollAfterCreate");

    cy.reload();

    // Buka modal
    cy.contains("button", "Input Gaji Baru").click();

    // Isi form
    cy.get('select[name="user_id"]').select("1");
    cy.get('input[name="periode"]').type("2024-12");
    cy.get('input[name="base_salary"]').type("3500000");
    cy.get('input[name="bonus"]').type("500000");
    cy.get('input[name="deductions"]').type("200000");
    cy.get('textarea[name="notes"]').type("Gaji Desember");

    // Submit
    cy.contains("button", "Simpan Gaji").click();

    // Verifikasi API dipanggil
    cy.wait("@createPayroll");
    cy.wait("@getPayrollAfterCreate");

    // Verifikasi modal tertutup
    cy.contains("h2", "Input Gaji Baru").should("not.exist");

    // Verifikasi data baru muncul di tabel
    cy.contains("td", "John Doe").should("be.visible");
    cy.contains("td", "Desember 2024").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 12: CREATE - Validation error dari server
  // ----------------------------------------------------------
  it("Harus menampilkan error jika validasi server gagal", () => {
    cy.intercept("GET", "**/api/payroll/employees*", {
      body: [{ id: 1, name: "Employee 1", role: "kasir" }],
    });

    // Mock POST error
    cy.intercept("POST", "**/api/payroll", {
      statusCode: 400,
      body: { message: "Periode wajib diisi." },
    }).as("createPayrollError");

    cy.reload();

    // Buka modal
    cy.contains("button", "Input Gaji Baru").click();

    // Isi form minimal
    cy.get('select[name="user_id"]').select("1");
    cy.get('input[name="base_salary"]').type("3000000");

    // Submit
    cy.contains("button", "Simpan Gaji").click();

    // Verifikasi error ditampilkan
    cy.contains("Periode wajib diisi.").should("be.visible");

    // Modal masih terbuka
    cy.contains("h2", "Input Gaji Baru").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 13: CREATE - Error handling saat create
  // ----------------------------------------------------------
  it("Harus menampilkan error jika create payroll gagal", () => {
    cy.intercept("GET", "**/api/payroll/employees*", {
      body: [{ id: 1, name: "Employee 1", role: "kasir" }],
    });

    // Mock POST error 500
    cy.intercept("POST", "**/api/payroll", {
      statusCode: 500,
      body: { message: "Server error" },
    }).as("createPayrollError");

    cy.reload();

    // Buka modal
    cy.contains("button", "Input Gaji Baru").click();

    // Isi form lengkap
    cy.get('select[name="user_id"]').select("1");
    cy.get('input[name="periode"]').type("2024-12");
    cy.get('input[name="base_salary"]').type("3000000");

    // Submit
    cy.contains("button", "Simpan Gaji").click();

    // Verifikasi error muncul
    cy.contains("Gagal menyimpan data penggajian.").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 14: Filter by periode
  // ----------------------------------------------------------
  it("Harus bisa filter payroll by periode", () => {
    // Mock data dengan berbagai periode
    cy.intercept("GET", "**/api/payroll*", {
      body: [
        {
          id: 1,
          user_id: 1,
          periode: "2024-12",
          base_salary: 3000000,
          bonus: 0,
          deductions: 0,
          total_salary: 3000000,
          user: { name: "Employee A", role: "kasir" },
        },
        {
          id: 2,
          user_id: 2,
          periode: "2024-11",
          base_salary: 3500000,
          bonus: 0,
          deductions: 0,
          total_salary: 3500000,
          user: { name: "Employee B", role: "admin" },
        },
        {
          id: 3,
          user_id: 3,
          periode: "2024-12",
          base_salary: 4000000,
          bonus: 0,
          deductions: 0,
          total_salary: 4000000,
          user: { name: "Employee C", role: "kasir" },
        },
      ],
    });

    cy.intercept("GET", "**/api/payroll/employees*", { body: [] });

    cy.reload();

    // Awalnya ada 3 payroll
    cy.get("tbody tr").should("have.length", 3);

    // Filter by Desember 2024
    cy.get("select").last().select("2024-12");

    // Harus ada 2 payroll (Employee A & C)
    cy.get("tbody tr").should("have.length", 2);
    cy.contains("td", "Employee A").should("be.visible");
    cy.contains("td", "Employee C").should("be.visible");
    cy.contains("td", "Employee B").should("not.exist");

    // Summary harus update
    cy.contains("Total Penggajian").parent().within(() => {
      cy.contains("2").should("be.visible");
    });

    cy.contains("Total Gaji Dibayar").parent().within(() => {
      cy.contains("Rp7.000.000").should("be.visible");
    });
  });

  // ----------------------------------------------------------
  // TEST 15: Filter reset (Semua Periode)
  // ----------------------------------------------------------
  it("Harus bisa reset filter ke Semua Periode", () => {
    cy.intercept("GET", "**/api/payroll*", {
      body: [
        {
          id: 1,
          user_id: 1,
          periode: "2024-12",
          base_salary: 3000000,
          bonus: 0,
          deductions: 0,
          total_salary: 3000000,
          user: { name: "Employee A", role: "kasir" },
        },
        {
          id: 2,
          user_id: 2,
          periode: "2024-11",
          base_salary: 3500000,
          bonus: 0,
          deductions: 0,
          total_salary: 3500000,
          user: { name: "Employee B", role: "admin" },
        },
      ],
    });

    cy.intercept("GET", "**/api/payroll/employees*", { body: [] });

    cy.reload();

    // Filter by Desember 2024
    cy.get("select").last().select("2024-12");
    cy.get("tbody tr").should("have.length", 1);

    // Reset ke Semua Periode
    cy.get("select").last().select("");

    // Harus tampil semua (2 payroll)
    cy.get("tbody tr").should("have.length", 2);
    cy.contains("td", "Employee A").should("be.visible");
    cy.contains("td", "Employee B").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 16: DELETE payroll dengan confirmation
  // ----------------------------------------------------------
  it("Harus bisa hapus payroll dengan confirmation", () => {
    // Mock data awal
    cy.intercept("GET", "**/api/payroll*", {
      body: [
        {
          id: 1,
          user_id: 1,
          periode: "2024-12",
          base_salary: 3000000,
          bonus: 0,
          deductions: 0,
          total_salary: 3000000,
          user: { name: "Employee A", role: "kasir" },
        },
      ],
    }).as("getPayroll");

    cy.intercept("GET", "**/api/payroll/employees*", { body: [] });

    // Mock DELETE success
    cy.intercept("DELETE", "**/api/payroll/1", {
      statusCode: 200,
      body: { message: "Payroll berhasil dihapus" },
    }).as("deletePayroll");

    // Mock GET after delete (data kosong)
    cy.intercept("GET", "**/api/payroll*", {
      body: [],
    }).as("getPayrollAfterDelete");

    cy.reload();
    cy.wait("@getPayroll");

    // Stub window.confirm untuk auto confirm
    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);
    });

    // Klik tombol delete
    cy.get("tbody tr").first().within(() => {
      cy.get('button[aria-label="Hapus"]').click();
    });

    // Verifikasi API dipanggil
    cy.wait("@deletePayroll");
    cy.wait("@getPayrollAfterDelete");

    // Verifikasi data terhapus
    cy.contains("Belum ada data penggajian.").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 17: DELETE - Cancel deletion
  // ----------------------------------------------------------
  it("Harus bisa cancel delete payroll", () => {
    cy.intercept("GET", "**/api/payroll*", {
      body: [
        {
          id: 1,
          user_id: 1,
          periode: "2024-12",
          base_salary: 3000000,
          bonus: 0,
          deductions: 0,
          total_salary: 3000000,
          user: { name: "Employee A", role: "kasir" },
        },
      ],
    });

    cy.intercept("GET", "**/api/payroll/employees*", { body: [] });

    cy.reload();

    // Stub window.confirm untuk cancel
    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(false);
    });

    // Klik tombol delete
    cy.get("tbody tr").first().within(() => {
      cy.get('button[aria-label="Hapus"]').click();
    });

    // Data masih ada
    cy.contains("td", "Employee A").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 18: DELETE - Error handling
  // ----------------------------------------------------------
  it("Harus menampilkan error jika delete payroll gagal", () => {
    cy.intercept("GET", "**/api/payroll*", {
      body: [
        {
          id: 1,
          user_id: 1,
          periode: "2024-12",
          base_salary: 3000000,
          bonus: 0,
          deductions: 0,
          total_salary: 3000000,
          user: { name: "Employee A", role: "kasir" },
        },
      ],
    });

    cy.intercept("GET", "**/api/payroll/employees*", { body: [] });

    // Mock DELETE error
    cy.intercept("DELETE", "**/api/payroll/1", {
      statusCode: 500,
      body: { message: "Gagal menghapus data" },
    }).as("deleteError");

    cy.reload();

    // Stub window.confirm & alert
    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);
      cy.stub(win, "alert").as("alertStub");
    });

    // Klik tombol delete
    cy.get("tbody tr").first().within(() => {
      cy.get('button[aria-label="Hapus"]').click();
    });

    cy.wait("@deleteError");

    // Verifikasi alert dipanggil dengan error message
    cy.get("@alertStub").should("have.been.calledOnce");
  });

  // ----------------------------------------------------------
  // TEST 19: Loading state
  // ----------------------------------------------------------
  it("Harus menampilkan loading state saat fetch data", () => {
    // Mock dengan delay
    cy.intercept("GET", "**/api/payroll*", (req) => {
      req.reply({
        delay: 1000,
        statusCode: 200,
        body: [],
      });
    }).as("getPayrollSlow");

    cy.intercept("GET", "**/api/payroll/employees*", { body: [] });

    cy.reload();

    // Verifikasi loading state
    cy.contains("Memuat data...").should("be.visible");

    cy.wait("@getPayrollSlow");

    // Loading hilang
    cy.contains("Memuat data...").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 20: Error state saat fetch
  // ----------------------------------------------------------
  it("Harus menampilkan error state jika fetch data gagal", () => {
    // Mock GET error
    cy.intercept("GET", "**/api/payroll*", {
      statusCode: 500,
      body: { message: "Server error" },
    }).as("getPayrollError");

    cy.intercept("GET", "**/api/payroll/employees*", { body: [] });

    cy.reload();
    cy.wait("@getPayrollError");

    // Verifikasi error message
    cy.contains("Gagal memuat data penggajian.").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 21: Format currency IDR
  // ----------------------------------------------------------
  it("Harus format currency dalam IDR dengan benar", () => {
    cy.intercept("GET", "**/api/payroll*", {
      body: [
        {
          id: 1,
          user_id: 1,
          periode: "2024-12",
          base_salary: 5500000,
          bonus: 1200000,
          deductions: 300000,
          total_salary: 6400000,
          user: { name: "Employee A", role: "kasir" },
        },
      ],
    });

    cy.intercept("GET", "**/api/payroll/employees*", { body: [] });

    cy.reload();

    // Verifikasi format IDR
    cy.contains("td", "Rp5.500.000").should("be.visible"); // Gaji Pokok
    cy.contains("td", "+Rp1.200.000").should("be.visible"); // Bonus
    cy.contains("td", "-Rp300.000").should("be.visible"); // Potongan
    cy.contains("td", "Rp6.400.000").should("be.visible"); // Total Bersih
  });

  // ----------------------------------------------------------
  // TEST 22: Format periode (Bulan Tahun dalam Bahasa Indonesia)
  // ----------------------------------------------------------
  it("Harus format periode dalam Bahasa Indonesia (Bulan Tahun)", () => {
    cy.intercept("GET", "**/api/payroll*", {
      body: [
        {
          id: 1,
          user_id: 1,
          periode: "2024-01",
          base_salary: 3000000,
          bonus: 0,
          deductions: 0,
          total_salary: 3000000,
          user: { name: "Employee A", role: "kasir" },
        },
        {
          id: 2,
          user_id: 2,
          periode: "2024-12",
          base_salary: 3000000,
          bonus: 0,
          deductions: 0,
          total_salary: 3000000,
          user: { name: "Employee B", role: "admin" },
        },
      ],
    });

    cy.intercept("GET", "**/api/payroll/employees*", { body: [] });

    cy.reload();

    // Verifikasi format periode Bahasa Indonesia
    cy.contains("td", "Januari 2024").should("be.visible");
    cy.contains("td", "Desember 2024").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 23: Bonus display dengan prefix +Rp
  // ----------------------------------------------------------
  it("Harus menampilkan bonus dengan prefix +Rp jika > 0", () => {
    cy.intercept("GET", "**/api/payroll*", {
      body: [
        {
          id: 1,
          user_id: 1,
          periode: "2024-12",
          base_salary: 3000000,
          bonus: 500000,
          deductions: 0,
          total_salary: 3500000,
          user: { name: "Employee A", role: "kasir" },
        },
        {
          id: 2,
          user_id: 2,
          periode: "2024-12",
          base_salary: 3000000,
          bonus: 0,
          deductions: 0,
          total_salary: 3000000,
          user: { name: "Employee B", role: "admin" },
        },
      ],
    });

    cy.intercept("GET", "**/api/payroll/employees*", { body: [] });

    cy.reload();

    // Bonus > 0: display +Rp500.000
    cy.contains("tr", "Employee A").within(() => {
      cy.contains("td", "+Rp500.000").should("be.visible");
    });

    // Bonus = 0: display -
    cy.contains("tr", "Employee B").within(() => {
      cy.get("td").eq(4).contains("-").should("be.visible");
    });
  });

  // ----------------------------------------------------------
  // TEST 24: Potongan display dengan prefix -Rp
  // ----------------------------------------------------------
  it("Harus menampilkan potongan dengan prefix -Rp jika > 0", () => {
    cy.intercept("GET", "**/api/payroll*", {
      body: [
        {
          id: 1,
          user_id: 1,
          periode: "2024-12",
          base_salary: 3000000,
          bonus: 0,
          deductions: 200000,
          total_salary: 2800000,
          user: { name: "Employee A", role: "kasir" },
        },
        {
          id: 2,
          user_id: 2,
          periode: "2024-12",
          base_salary: 3000000,
          bonus: 0,
          deductions: 0,
          total_salary: 3000000,
          user: { name: "Employee B", role: "admin" },
        },
      ],
    });

    cy.intercept("GET", "**/api/payroll/employees*", { body: [] });

    cy.reload();

    // Potongan > 0: display -Rp200.000
    cy.contains("tr", "Employee A").within(() => {
      cy.contains("td", "-Rp200.000").should("be.visible");
    });

    // Potongan = 0: display -
    cy.contains("tr", "Employee B").within(() => {
      cy.get("td").eq(5).contains("-").should("be.visible");
    });
  });

  // ----------------------------------------------------------
  // TEST 25: Notes field optional
  // ----------------------------------------------------------
  it("Harus menampilkan '-' jika notes kosong", () => {
    cy.intercept("GET", "**/api/payroll*", {
      body: [
        {
          id: 1,
          user_id: 1,
          periode: "2024-12",
          base_salary: 3000000,
          bonus: 0,
          deductions: 0,
          total_salary: 3000000,
          notes: "Ada catatan",
          user: { name: "Employee A", role: "kasir" },
        },
        {
          id: 2,
          user_id: 2,
          periode: "2024-12",
          base_salary: 3000000,
          bonus: 0,
          deductions: 0,
          total_salary: 3000000,
          notes: null,
          user: { name: "Employee B", role: "admin" },
        },
      ],
    });

    cy.intercept("GET", "**/api/payroll/employees*", { body: [] });

    cy.reload();

    // Notes ada isi
    cy.contains("tr", "Employee A").within(() => {
      cy.contains("td", "Ada catatan").should("be.visible");
    });

    // Notes kosong: display -
    cy.contains("tr", "Employee B").within(() => {
      cy.get("td").eq(7).contains("-").should("be.visible");
    });
  });

  // ----------------------------------------------------------
  // TEST 26: Loading state saat saving
  // ----------------------------------------------------------
  it("Harus menampilkan loading state saat menyimpan payroll", () => {
    cy.intercept("GET", "**/api/payroll/employees*", {
      body: [{ id: 1, name: "Employee 1", role: "kasir" }],
    });

    // Mock POST dengan delay
    cy.intercept("POST", "**/api/payroll", (req) => {
      req.reply({
        delay: 1500,
        statusCode: 201,
        body: { id: 100, message: "Success" },
      });
    }).as("createPayrollSlow");

    cy.intercept("GET", "**/api/payroll*", { body: [] });

    cy.reload();

    // Buka modal
    cy.contains("button", "Input Gaji Baru").click();

    // Isi form
    cy.get('select[name="user_id"]').select("1");
    cy.get('input[name="periode"]').type("2024-12");
    cy.get('input[name="base_salary"]').type("3000000");

    // Submit
    cy.contains("button", "Simpan Gaji").click();

    // Verifikasi button berubah jadi "Menyimpan..."
    cy.contains("button", "Menyimpan...").should("be.visible");
    cy.contains("button", "Menyimpan...").should("be.disabled");

    cy.wait("@createPayrollSlow");
  });

  // ----------------------------------------------------------
  // TEST 27: Multiple payrolls display
  // ----------------------------------------------------------
  it("Harus bisa menampilkan multiple payroll dengan benar", () => {
    cy.intercept("GET", "**/api/payroll*", {
      body: [
        {
          id: 1,
          user_id: 1,
          periode: "2024-12",
          base_salary: 3000000,
          bonus: 500000,
          deductions: 200000,
          total_salary: 3300000,
          notes: "Gaji A",
          user: { name: "Employee A", role: "kasir" },
        },
        {
          id: 2,
          user_id: 2,
          periode: "2024-11",
          base_salary: 4000000,
          bonus: 1000000,
          deductions: 500000,
          total_salary: 4500000,
          notes: "Gaji B",
          user: { name: "Employee B", role: "admin" },
        },
        {
          id: 3,
          user_id: 3,
          periode: "2024-10",
          base_salary: 3500000,
          bonus: 0,
          deductions: 0,
          total_salary: 3500000,
          notes: null,
          user: { name: "Employee C", role: "kasir" },
        },
      ],
    });

    cy.intercept("GET", "**/api/payroll/employees*", { body: [] });

    cy.reload();

    // Verifikasi total 3 payroll
    cy.get("tbody tr").should("have.length", 3);

    // Verifikasi masing-masing payroll
    cy.contains("td", "Employee A").should("be.visible");
    cy.contains("td", "Employee B").should("be.visible");
    cy.contains("td", "Employee C").should("be.visible");

    // Verifikasi summary
    cy.contains("Total Penggajian").parent().contains("3").should("be.visible");
    cy.contains("Total Gaji Dibayar")
      .parent()
      .contains("Rp11.300.000")
      .should("be.visible"); // 3300000 + 4500000 + 3500000
  });

  // ----------------------------------------------------------
  // TEST 28: FULL FLOW - Complete cycle (Create → Filter → Delete)
  // ----------------------------------------------------------
  it("FULL FLOW: Harus bisa complete cycle Create → Filter → Delete", () => {
    // Mock employees
    cy.intercept("GET", "**/api/payroll/employees*", {
      body: [
        { id: 1, name: "John Doe", role: "kasir" },
        { id: 2, name: "Jane Smith", role: "admin" },
      ],
    });

    // Mock initial data kosong
    cy.intercept("GET", "**/api/payroll*", {
      body: [],
    }).as("getPayrollInitial");

    cy.reload();
    cy.wait("@getPayrollInitial");

    // Verifikasi empty state
    cy.contains("Belum ada data penggajian.").should("be.visible");

    // === CREATE PAYROLL 1 ===
    cy.intercept("POST", "**/api/payroll", {
      statusCode: 201,
      body: { id: 100, message: "Success" },
    }).as("createPayroll1");

    cy.intercept("GET", "**/api/payroll*", {
      body: [
        {
          id: 100,
          user_id: 1,
          periode: "2024-12",
          base_salary: 3000000,
          bonus: 500000,
          deductions: 200000,
          total_salary: 3300000,
          notes: "Gaji Desember",
          user: { name: "John Doe", role: "kasir" },
        },
      ],
    }).as("getAfterCreate1");

    cy.contains("button", "Input Gaji Baru").click();
    cy.get('select[name="user_id"]').select("1");
    cy.get('input[name="periode"]').type("2024-12");
    cy.get('input[name="base_salary"]').type("3000000");
    cy.get('input[name="bonus"]').type("500000");
    cy.get('input[name="deductions"]').type("200000");
    cy.get('textarea[name="notes"]').type("Gaji Desember");
    cy.contains("button", "Simpan Gaji").click();

    cy.wait("@createPayroll1");
    cy.wait("@getAfterCreate1");

    // Verifikasi payroll 1 muncul
    cy.contains("td", "John Doe").should("be.visible");
    cy.contains("td", "Desember 2024").should("be.visible");

    // === CREATE PAYROLL 2 ===
    cy.intercept("POST", "**/api/payroll", {
      statusCode: 201,
      body: { id: 101, message: "Success" },
    }).as("createPayroll2");

    cy.intercept("GET", "**/api/payroll*", {
      body: [
        {
          id: 100,
          user_id: 1,
          periode: "2024-12",
          base_salary: 3000000,
          bonus: 500000,
          deductions: 200000,
          total_salary: 3300000,
          notes: "Gaji Desember",
          user: { name: "John Doe", role: "kasir" },
        },
        {
          id: 101,
          user_id: 2,
          periode: "2024-11",
          base_salary: 4000000,
          bonus: 1000000,
          deductions: 0,
          total_salary: 5000000,
          notes: "Gaji November",
          user: { name: "Jane Smith", role: "admin" },
        },
      ],
    }).as("getAfterCreate2");

    cy.contains("button", "Input Gaji Baru").click();
    cy.get('select[name="user_id"]').select("2");
    cy.get('input[name="periode"]').type("2024-11");
    cy.get('input[name="base_salary"]').type("4000000");
    cy.get('input[name="bonus"]').type("1000000");
    cy.get('textarea[name="notes"]').type("Gaji November");
    cy.contains("button", "Simpan Gaji").click();

    cy.wait("@createPayroll2");
    cy.wait("@getAfterCreate2");

    // Verifikasi ada 2 payroll
    cy.get("tbody tr").should("have.length", 2);

    // === FILTER BY PERIODE ===
    cy.get("select").last().select("2024-12");

    // Harus ada 1 payroll (John Doe)
    cy.get("tbody tr").should("have.length", 1);
    cy.contains("td", "John Doe").should("be.visible");
    cy.contains("td", "Jane Smith").should("not.exist");

    // Reset filter
    cy.get("select").last().select("");
    cy.get("tbody tr").should("have.length", 2);

    // === DELETE PAYROLL ===
    cy.intercept("DELETE", "**/api/payroll/100", {
      statusCode: 200,
      body: { message: "Deleted" },
    }).as("deletePayroll");

    cy.intercept("GET", "**/api/payroll*", {
      body: [
        {
          id: 101,
          user_id: 2,
          periode: "2024-11",
          base_salary: 4000000,
          bonus: 1000000,
          deductions: 0,
          total_salary: 5000000,
          notes: "Gaji November",
          user: { name: "Jane Smith", role: "admin" },
        },
      ],
    }).as("getAfterDelete");

    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);
    });

    cy.contains("tr", "John Doe").within(() => {
      cy.get('button[aria-label="Hapus"]').click();
    });

    cy.wait("@deletePayroll");
    cy.wait("@getAfterDelete");

    // Verifikasi hanya ada 1 payroll (Jane Smith)
    cy.get("tbody tr").should("have.length", 1);
    cy.contains("td", "Jane Smith").should("be.visible");
    cy.contains("td", "John Doe").should("not.exist");

    // Summary update
    cy.contains("Total Penggajian").parent().contains("1").should("be.visible");
    cy.contains("Total Gaji Dibayar")
      .parent()
      .contains("Rp5.000.000")
      .should("be.visible");
  });
});
