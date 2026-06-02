/**
 * ============================================================
 * SKENARIO PENGUJIAN: Expenses (Pengeluaran Operasional) - UMKM-Grow
 * ============================================================
 * Menguji seluruh fitur Pengeluaran Operasional end-to-end:
 *  - Tampilan halaman Pengeluaran Operasional
 *  - Total nominal pengeluaran (sum)
 *  - CREATE pengeluaran baru
 *  - Form validation (required fields)
 *  - Kategori dropdown (Listrik, Air, Gaji Karyawan, Sewa Tempat, Lain-lain)
 *  - Keterangan optional
 *  - Upload bukti foto (optional)
 *  - Display list pengeluaran
 *  - Format currency IDR dengan prefix (-)
 *  - Link "Lihat Struk" untuk bukti foto
 *  - Empty state
 *  - Loading & error states
 * ============================================================
 */

describe("Skenario Pengujian Expenses (Pengeluaran Operasional) UMKM-Grow", () => {
  let users;

  before(() => {
    cy.fixture("user").then((data) => {
      users = data;
    });
  });

  beforeEach(() => {
    // Login dan navigasi ke Expenses
    cy.clearLocalStorage();
    cy.login(users.validUser.email, users.validUser.password);
    cy.visit("/finance/expenses");
  });

  // ----------------------------------------------------------
  // TEST 1: Tampilan halaman Pengeluaran Operasional
  // ----------------------------------------------------------
  it("Harus menampilkan halaman Pengeluaran Operasional dengan elemen yang benar", () => {
    // Verifikasi judul halaman
    cy.contains("h1", "Pengeluaran Operasional").should("be.visible");
    cy.contains("Catatan pengeluaran operasional toko").should("be.visible");

    // Verifikasi tombol Catat Pengeluaran
    cy.contains("button", "Catat Pengeluaran").should("be.visible");

    // Verifikasi section Daftar Pengeluaran
    cy.contains("Daftar Pengeluaran").should("be.visible");

    // Verifikasi tabel headers
    cy.contains("th", "Tanggal").should("be.visible");
    cy.contains("th", "Kategori").should("be.visible");
    cy.contains("th", "Nominal").should("be.visible");
    cy.contains("th", "Keterangan").should("be.visible");
    cy.contains("th", "Bukti").should("be.visible");

    // Verifikasi Total
    cy.contains("Total:").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 2: Empty state - Belum ada pengeluaran
  // ----------------------------------------------------------
  it("Harus menampilkan pesan jika belum ada data pengeluaran", () => {
    // Mock API dengan data kosong
    cy.intercept("GET", "**/api/expenses*", {
      statusCode: 200,
      body: { data: [] },
    }).as("getExpenses");

    cy.reload();
    cy.wait("@getExpenses");

    // Verifikasi empty state
    cy.contains("Belum ada data pengeluaran.").should("be.visible");

    // Verifikasi total 0
    cy.contains("Total:").parent().contains("Rp0").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 3: Tampilkan list pengeluaran dengan data
  // ----------------------------------------------------------
  it("Harus menampilkan daftar pengeluaran dengan informasi lengkap", () => {
    // Mock expenses data
    cy.intercept("GET", "**/api/expenses*", {
      body: {
        data: [
          {
            id: 1,
            tanggal: "2024-12-15",
            kategori: "Listrik",
            nominal: 500000,
            keterangan: "Bayar listrik bulan Desember",
            bukti_foto: "proof1.jpg",
          },
          {
            id: 2,
            tanggal: "2024-12-14",
            kategori: "Air",
            nominal: 150000,
            keterangan: "Bayar PDAM",
            bukti_foto: null,
          },
        ],
      },
    });

    cy.reload();

    // Verifikasi expense 1
    cy.contains("td", "2024-12-15").should("be.visible");
    cy.contains("td", "Listrik").should("be.visible");
    cy.contains("td", "-Rp500.000").should("be.visible");
    cy.contains("td", "Bayar listrik bulan Desember").should("be.visible");
    cy.contains("a", "Lihat Struk").should("be.visible");

    // Verifikasi expense 2
    cy.contains("td", "2024-12-14").should("be.visible");
    cy.contains("td", "Air").should("be.visible");
    cy.contains("td", "-Rp150.000").should("be.visible");
    cy.contains("td", "Bayar PDAM").should("be.visible");

    // Verifikasi total ada 2 expenses
    cy.get("tbody tr").should("have.length", 2);
  });

  // ----------------------------------------------------------
  // TEST 4: Total nominal pengeluaran (sum)
  // ----------------------------------------------------------
  it("Harus menghitung total nominal pengeluaran dengan benar", () => {
    cy.intercept("GET", "**/api/expenses*", {
      body: {
        data: [
          {
            id: 1,
            tanggal: "2024-12-15",
            kategori: "Listrik",
            nominal: 500000,
            keterangan: "Listrik",
            bukti_foto: null,
          },
          {
            id: 2,
            tanggal: "2024-12-14",
            kategori: "Air",
            nominal: 150000,
            keterangan: "Air",
            bukti_foto: null,
          },
          {
            id: 3,
            tanggal: "2024-12-13",
            kategori: "Sewa Tempat",
            nominal: 3000000,
            keterangan: "Sewa",
            bukti_foto: null,
          },
        ],
      },
    });

    cy.reload();

    // Verifikasi total: 500000 + 150000 + 3000000 = 3650000
    cy.contains("Total:")
      .parent()
      .within(() => {
        cy.contains("Rp3.650.000").should("be.visible");
      });
  });

  // ----------------------------------------------------------
  // TEST 5: Format currency dengan prefix minus (-)
  // ----------------------------------------------------------
  it("Harus format currency dalam IDR dengan prefix minus (-)", () => {
    cy.intercept("GET", "**/api/expenses*", {
      body: {
        data: [
          {
            id: 1,
            tanggal: "2024-12-15",
            kategori: "Listrik",
            nominal: 1250000,
            keterangan: "Test",
            bukti_foto: null,
          },
        ],
      },
    });

    cy.reload();

    // Verifikasi format dengan prefix minus
    cy.contains("td", "-Rp1.250.000").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 6: Bukti foto - Display "Lihat Struk" jika ada
  // ----------------------------------------------------------
  it('Harus menampilkan link "Lihat Struk" jika bukti foto tersedia', () => {
    cy.intercept("GET", "**/api/expenses*", {
      body: {
        data: [
          {
            id: 1,
            tanggal: "2024-12-15",
            kategori: "Listrik",
            nominal: 500000,
            keterangan: "Test",
            bukti_foto: "proof123.jpg",
          },
        ],
      },
    });

    cy.reload();

    // Verifikasi link Lihat Struk ada dan href benar
    cy.contains("a", "Lihat Struk")
      .should("be.visible")
      .should("have.attr", "href")
      .and("include", "/uploads/proof123.jpg");

    cy.contains("a", "Lihat Struk")
      .should("have.attr", "target", "_blank")
      .should("have.attr", "rel", "noreferrer");
  });

  // ----------------------------------------------------------
  // TEST 7: Bukti foto - Display "-" jika tidak ada
  // ----------------------------------------------------------
  it('Harus menampilkan "-" jika bukti foto tidak ada', () => {
    cy.intercept("GET", "**/api/expenses*", {
      body: {
        data: [
          {
            id: 1,
            tanggal: "2024-12-15",
            kategori: "Listrik",
            nominal: 500000,
            keterangan: "Test",
            bukti_foto: null,
          },
        ],
      },
    });

    cy.reload();

    // Verifikasi "-" muncul di kolom Bukti
    cy.get("tbody tr")
      .first()
      .within(() => {
        cy.get("td").last().contains("-").should("be.visible");
      });
  });

  // ----------------------------------------------------------
  // TEST 8: CREATE - Buka modal Catat Pengeluaran
  // ----------------------------------------------------------
  it("Harus membuka modal form saat klik Catat Pengeluaran", () => {
    // Klik tombol Catat Pengeluaran
    cy.contains("button", "Catat Pengeluaran").click();

    // Verifikasi modal muncul
    cy.contains("Catat Pengeluaran").should("be.visible");
    cy.contains("Pencatatan pengeluaran operasional").should("be.visible");

    // Verifikasi form fields
    cy.contains("label", "Tanggal").should("be.visible");
    cy.contains("label", "Kategori").should("be.visible");
    cy.contains("label", "Nominal Rupiah").should("be.visible");
    cy.contains("label", "Keterangan").should("be.visible");
    cy.contains("label", "Unggah Bukti Fisik").should("be.visible");

    // Verifikasi tombol
    cy.contains("button", "Cancel").should("be.visible");
    cy.contains("button", "Save").should("be.visible");

    // Verifikasi close button
    cy.contains("button", "Close").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 9: CREATE - Tutup modal dengan tombol Cancel
  // ----------------------------------------------------------
  it("Harus menutup modal saat klik tombol Cancel", () => {
    // Buka modal
    cy.contains("button", "Catat Pengeluaran").click();
    cy.contains("Catat Pengeluaran").should("be.visible");

    // Klik tombol Cancel
    cy.contains("button", "Cancel").click();

    // Verifikasi modal tertutup
    cy.contains("Pencatatan pengeluaran operasional").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 10: CREATE - Tutup modal dengan tombol Close
  // ----------------------------------------------------------
  it("Harus menutup modal saat klik tombol Close", () => {
    // Buka modal
    cy.contains("button", "Catat Pengeluaran").click();
    cy.contains("Catat Pengeluaran").should("be.visible");

    // Klik tombol Close
    cy.contains("button", "Close").click();

    // Verifikasi modal tertutup
    cy.contains("Pencatatan pengeluaran operasional").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 11: CREATE - Kategori dropdown options
  // ----------------------------------------------------------
  it("Harus menampilkan semua kategori pengeluaran di dropdown", () => {
    // Buka modal
    cy.contains("button", "Catat Pengeluaran").click();

    // Verifikasi kategori options
    const expectedCategories = [
      "Listrik",
      "Air",
      "Gaji Karyawan",
      "Sewa Tempat",
      "Lain-lain",
    ];

    cy.get("select").first().within(() => {
      expectedCategories.forEach((category) => {
        cy.contains("option", category).should("exist");
      });
    });

    // Verifikasi default value adalah kategori pertama
    cy.get("select").first().should("have.value", "Listrik");
  });

  // ----------------------------------------------------------
  // TEST 12: CREATE - Form validation (required fields)
  // ----------------------------------------------------------
  it("Harus validasi field wajib (tanggal, kategori, nominal)", () => {
    // Buka modal
    cy.contains("button", "Catat Pengeluaran").click();

    // Submit tanpa mengisi nominal (tanggal dan kategori sudah default)
    cy.contains("button", "Save").click();

    // Modal masih terbuka (HTML5 validation)
    cy.contains("Pencatatan pengeluaran operasional").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 13: CREATE - Tanggal default adalah hari ini
  // ----------------------------------------------------------
  it("Harus set tanggal default ke hari ini", () => {
    // Buka modal
    cy.contains("button", "Catat Pengeluaran").click();

    // Verifikasi tanggal default adalah hari ini
    const today = new Date().toISOString().slice(0, 10);
    cy.get('input[type="date"]').should("have.value", today);
  });

  // ----------------------------------------------------------
  // TEST 14: CREATE - Tambah pengeluaran berhasil (tanpa file)
  // ----------------------------------------------------------
  it("Harus berhasil menambah pengeluaran tanpa bukti foto", () => {
    // Mock initial GET
    cy.intercept("GET", "**/api/expenses*", {
      body: { data: [] },
    }).as("getExpensesInitial");

    cy.reload();

    // Mock POST success
    cy.intercept("POST", "**/api/expenses", {
      statusCode: 201,
      body: { id: 100, message: "Pengeluaran berhasil disimpan" },
    }).as("createExpense");

    // Mock GET after create
    cy.intercept("GET", "**/api/expenses*", {
      body: {
        data: [
          {
            id: 100,
            tanggal: "2024-12-15",
            kategori: "Listrik",
            nominal: 500000,
            keterangan: "Bayar listrik bulan Desember",
            bukti_foto: null,
          },
        ],
      },
    }).as("getExpensesAfterCreate");

    // Stub window.alert
    cy.window().then((win) => {
      cy.stub(win, "alert").as("alertStub");
    });

    // Buka modal
    cy.contains("button", "Catat Pengeluaran").click();

    // Isi form
    cy.get('input[type="date"]').clear().type("2024-12-15");
    cy.get("select").first().select("Listrik");
    cy.get('input[type="number"]').type("500000");
    cy.get("textarea").type("Bayar listrik bulan Desember");

    // Submit
    cy.contains("button", "Save").click();

    // Verifikasi API dipanggil
    cy.wait("@createExpense");

    // Verifikasi alert muncul
    cy.get("@alertStub").should(
      "have.been.calledOnceWith",
      "Pengeluaran berhasil disimpan"
    );

    cy.wait("@getExpensesAfterCreate");

    // Verifikasi modal tertutup
    cy.contains("Pencatatan pengeluaran operasional").should("not.exist");

    // Verifikasi data baru muncul di tabel
    cy.contains("td", "2024-12-15").should("be.visible");
    cy.contains("td", "Listrik").should("be.visible");
    cy.contains("td", "-Rp500.000").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 15: CREATE - Keterangan optional (bisa kosong)
  // ----------------------------------------------------------
  it("Harus bisa tambah pengeluaran tanpa keterangan", () => {
    cy.intercept("GET", "**/api/expenses*", {
      body: { data: [] },
    });

    cy.reload();

    // Mock POST success
    cy.intercept("POST", "**/api/expenses", {
      statusCode: 201,
      body: { id: 101, message: "Success" },
    }).as("createExpense");

    cy.intercept("GET", "**/api/expenses*", {
      body: {
        data: [
          {
            id: 101,
            tanggal: "2024-12-15",
            kategori: "Air",
            nominal: 150000,
            keterangan: null,
            bukti_foto: null,
          },
        ],
      },
    });

    cy.window().then((win) => {
      cy.stub(win, "alert");
    });

    // Buka modal
    cy.contains("button", "Catat Pengeluaran").click();

    // Isi form tanpa keterangan
    cy.get('input[type="date"]').clear().type("2024-12-15");
    cy.get("select").first().select("Air");
    cy.get('input[type="number"]').type("150000");
    // Skip textarea (keterangan)

    // Submit
    cy.contains("button", "Save").click();

    cy.wait("@createExpense");

    // Verifikasi data muncul dengan keterangan "-"
    cy.contains("td", "Air").should("be.visible");
    cy.contains("td", "-Rp150.000").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 16: CREATE - Upload bukti foto
  // ----------------------------------------------------------
  it("Harus bisa upload bukti foto saat create pengeluaran", () => {
    cy.intercept("GET", "**/api/expenses*", {
      body: { data: [] },
    });

    cy.reload();

    // Mock POST success
    cy.intercept("POST", "**/api/expenses", {
      statusCode: 201,
      body: { id: 102, message: "Success" },
    }).as("createExpense");

    cy.intercept("GET", "**/api/expenses*", {
      body: {
        data: [
          {
            id: 102,
            tanggal: "2024-12-15",
            kategori: "Listrik",
            nominal: 500000,
            keterangan: "Test",
            bukti_foto: "uploaded_proof.jpg",
          },
        ],
      },
    });

    cy.window().then((win) => {
      cy.stub(win, "alert");
    });

    // Buka modal
    cy.contains("button", "Catat Pengeluaran").click();

    // Isi form dengan file upload
    cy.get('input[type="date"]').clear().type("2024-12-15");
    cy.get("select").first().select("Listrik");
    cy.get('input[type="number"]').type("500000");

    // Upload file (create fixture file)
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from("fake image content"),
        fileName: "proof.jpg",
        mimeType: "image/jpeg",
      },
      { force: true }
    );

    // Submit
    cy.contains("button", "Save").click();

    cy.wait("@createExpense");

    // Verifikasi link Lihat Struk muncul
    cy.contains("a", "Lihat Struk").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 17: CREATE - Error handling
  // ----------------------------------------------------------
  it("Harus menampilkan error jika create pengeluaran gagal", () => {
    cy.intercept("GET", "**/api/expenses*", {
      body: { data: [] },
    });

    cy.reload();

    // Mock POST error
    cy.intercept("POST", "**/api/expenses", {
      statusCode: 500,
      body: { message: "Server error" },
    }).as("createExpenseError");

    // Buka modal
    cy.contains("button", "Catat Pengeluaran").click();

    // Isi form
    cy.get('input[type="date"]').clear().type("2024-12-15");
    cy.get("select").first().select("Listrik");
    cy.get('input[type="number"]').type("500000");

    // Submit
    cy.contains("button", "Save").click();

    cy.wait("@createExpenseError");

    // Verifikasi error muncul
    cy.contains("Server error").should("be.visible");

    // Modal masih terbuka
    cy.contains("Pencatatan pengeluaran operasional").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 18: Loading state
  // ----------------------------------------------------------
  it("Harus menampilkan loading state saat fetch data", () => {
    // Mock dengan delay
    cy.intercept("GET", "**/api/expenses*", (req) => {
      req.reply({
        delay: 1000,
        statusCode: 200,
        body: { data: [] },
      });
    }).as("getExpensesSlow");

    cy.reload();

    // Verifikasi loading state
    cy.contains("Memuat data...").should("be.visible");

    cy.wait("@getExpensesSlow");

    // Loading hilang
    cy.contains("Memuat data...").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 19: Error state saat fetch
  // ----------------------------------------------------------
  it("Harus menampilkan error state jika fetch data gagal", () => {
    // Mock GET error
    cy.intercept("GET", "**/api/expenses*", {
      statusCode: 500,
      body: { message: "Server error" },
    }).as("getExpensesError");

    cy.reload();
    cy.wait("@getExpensesError");

    // Verifikasi error message
    cy.contains("Gagal memuat data pengeluaran.").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 20: Error state - Database not connected (503)
  // ----------------------------------------------------------
  it("Harus menampilkan error khusus jika database tidak tersambung", () => {
    // Mock GET error 503
    cy.intercept("GET", "**/api/expenses*", {
      statusCode: 503,
      body: { message: "Service unavailable" },
    }).as("getExpenses503");

    cy.reload();
    cy.wait("@getExpenses503");

    // Verifikasi error message
    cy.contains("Backend belum tersambung ke database").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 21: CREATE - Submitting state (button disabled)
  // ----------------------------------------------------------
  it("Harus disable button saat sedang submit", () => {
    cy.intercept("GET", "**/api/expenses*", {
      body: { data: [] },
    });

    cy.reload();

    cy.intercept("POST", "**/api/expenses", (req) => {
      req.reply({
        delay: 2000,
        statusCode: 201,
        body: { id: 1, message: "Success" },
      });
    });

    cy.window().then((win) => {
      cy.stub(win, "alert");
    });

    cy.contains("button", "Catat Pengeluaran").click();

    cy.get('input[type="date"]').clear().type("2024-12-15");
    cy.get("select").first().select("Listrik");
    cy.get('input[type="number"]').type("500000");

    cy.contains("button", "Save").click();

    // Button harus disabled saat submitting
    cy.contains("button", "Save").should("be.disabled");
  });
});


// ============================================================
// SKENARIO PENGUJIAN: Financial Reports (Laporan Keuangan)
// ============================================================
describe("Skenario Pengujian Financial Reports UMKM-Grow", () => {
  let users;

  before(() => {
    cy.fixture("user").then((data) => {
      users = data;
    });
  });

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.login(users.validUser.email, users.validUser.password);
    cy.visit("/finance/reports");
  });

  // ----------------------------------------------------------
  // TEST 1: Tampilan halaman Financial Reports
  // ----------------------------------------------------------
  it("Harus menampilkan halaman Financial Reports dengan elemen yang benar", () => {
    cy.contains("h1", "Financial Reports").should("be.visible");
    cy.contains("Lihat performa bisnis dan analitik keuangan").should("be.visible");

    cy.contains("button", "Financial Report").should("be.visible");
    cy.contains("button", "Laporan Pajak").should("be.visible");

    cy.contains("label", "Filter Waktu").should("be.visible");
    cy.get("select").should("be.visible");

    cy.contains("Total Revenue").should("be.visible");
    cy.contains("Total Cost").should("be.visible");
    cy.contains("Gross Profit").should("be.visible");
    cy.contains("Profit Margin").should("be.visible");

    cy.contains("Sales Trend").should("be.visible");
    cy.contains("Monthly Profit").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 2: Filter waktu - Options tersedia
  // ----------------------------------------------------------
  it("Harus menampilkan semua opsi filter waktu", () => {
    const expectedOptions = ["This Week", "This Month", "This Year", "All Time"];

    cy.get("select").within(() => {
      expectedOptions.forEach((option) => {
        cy.contains("option", option).should("exist");
      });
    });

    cy.get("select").should("have.value", "month");
  });

  // ----------------------------------------------------------
  // TEST 3: Display metric cards dengan data
  // ----------------------------------------------------------
  it("Harus menampilkan metric cards dengan nilai yang benar", () => {
    cy.intercept("GET", "**/api/reports/financial*", {
      body: {
        data: {
          revenue: 25000000,
          totalCost: 15000000,
          profitMargin: 40,
          salesTrend: [],
        },
      },
    }).as("getFinancialReport");

    cy.reload();
    cy.wait("@getFinancialReport");

    cy.contains("Total Revenue")
      .parent()
      .within(() => {
        cy.contains("Rp25.000.000").should("be.visible");
      });

    cy.contains("Total Cost")
      .parent()
      .within(() => {
        cy.contains("Rp15.000.000").should("be.visible");
      });

    cy.contains("Gross Profit")
      .parent()
      .within(() => {
        cy.contains("Rp10.000.000").should("be.visible");
      });

    cy.contains("Profit Margin")
      .parent()
      .within(() => {
        cy.contains("40.0%").should("be.visible");
      });
  });

  // ----------------------------------------------------------
  // TEST 4: Tab Laporan Pajak - Display table
  // ----------------------------------------------------------
  it("Harus bisa switch ke tab Laporan Pajak dan tampilkan table", () => {
    cy.intercept("GET", "**/api/reports/tax*", {
      statusCode: 200,
      body: { data: [] },
    }).as("getTaxReport");

    cy.contains("button", "Laporan Pajak").click();

    cy.contains("button", "Laporan Pajak")
      .should("have.class", "bg-blue-600")
      .should("have.class", "text-white");

    cy.contains("label", "Mulai").should("be.visible");
    cy.contains("label", "Sampai").should("be.visible");

    cy.contains("button", "Tampilkan Laporan").should("be.visible");
    cy.contains("button", "Unduh CSV Pajak").should("be.visible");

    cy.contains("th", "Tanggal").should("be.visible");
    cy.contains("th", "No Transaksi").should("be.visible");
    cy.contains("th", "Subtotal").should("be.visible");
    cy.contains("th", "Service Charge").should("be.visible");
    cy.contains("th", "Nominal Pajak").should("be.visible");
    cy.contains("th", "Total").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 5: Laporan Pajak - Display data
  // ----------------------------------------------------------
  it("Harus menampilkan data laporan pajak dengan benar", () => {
    cy.intercept("GET", "**/api/reports/tax*", {
      body: {
        data: [
          {
            tanggal: "2024-12-15",
            no_transaksi: "TRX001",
            subtotal: 100000,
            service_charge_amount: 5000,
            nominal_pajak: 10500,
            total: 115500,
          },
          {
            tanggal: "2024-12-16",
            no_transaksi: "TRX002",
            subtotal: 200000,
            service_charge_amount: 10000,
            nominal_pajak: 21000,
            total: 231000,
          },
        ],
      },
    }).as("getTaxReport");

    cy.contains("button", "Laporan Pajak").click();
    cy.wait("@getTaxReport");

    cy.contains("td", "2024-12-15").should("be.visible");
    cy.contains("td", "TRX001").should("be.visible");
    cy.contains("Rp100.000").should("be.visible");
    cy.contains("Rp5.000").should("be.visible");
    cy.contains("Rp10.500").should("be.visible");
    cy.contains("Rp115.500").should("be.visible");

    cy.contains("td", "TRX002").should("be.visible");
    cy.contains("Rp231.000").should("be.visible");

    cy.get("tbody tr").should("have.length", 2);
  });

  // ----------------------------------------------------------
  // TEST 6: Loading state - Charts
  // ----------------------------------------------------------
  it("Harus menampilkan loading state pada metric cards dan charts", () => {
    cy.intercept("GET", "**/api/reports/financial*", (req) => {
      req.reply({
        delay: 1000,
        statusCode: 200,
        body: {
          data: {
            revenue: 10000000,
            totalCost: 6000000,
            profitMargin: 40,
            salesTrend: [],
          },
        },
      });
    }).as("getFinancialReportSlow");

    cy.reload();

    cy.contains("Memuat...").should("be.visible");
    cy.contains("Loading chart...").should("be.visible");

    cy.wait("@getFinancialReportSlow");

    cy.contains("Memuat...").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 7: Error state - API error
  // ----------------------------------------------------------
  it("Harus menampilkan error message jika API gagal", () => {
    cy.intercept("GET", "**/api/reports/financial*", {
      statusCode: 500,
      body: { message: "Internal server error" },
    }).as("getFinancialReportError");

    cy.reload();
    cy.wait("@getFinancialReportError");

    cy.contains("Internal server error").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 8: Gross Profit negative - Display dengan warna merah
  // ----------------------------------------------------------
  it("Harus menampilkan Gross Profit negatif dengan warna merah", () => {
    cy.intercept("GET", "**/api/reports/financial*", {
      body: {
        data: {
          revenue: 10000000,
          totalCost: 15000000,
          profitMargin: -50,
          salesTrend: [],
        },
      },
    });

    cy.reload();

    cy.contains("Gross Profit")
      .parent()
      .within(() => {
        cy.contains("-Rp5.000.000")
          .should("be.visible")
          .should("have.class", "text-rose-500");
      });
  });

  // ----------------------------------------------------------
  // TEST 9: Laporan Pajak - Download CSV
  // ----------------------------------------------------------
  it("Harus bisa download CSV laporan pajak", () => {
    cy.intercept("GET", "**/api/reports/tax*", {
      body: {
        data: [
          {
            tanggal: "2024-12-15",
            no_transaksi: "TRX001",
            subtotal: 100000,
            service_charge_amount: 5000,
            nominal_pajak: 10500,
            total: 115500,
          },
        ],
      },
    });

    cy.contains("button", "Laporan Pajak").click();

    cy.window().then((win) => {
      cy.stub(win.URL, "createObjectURL").returns("blob:mock-url");
      cy.stub(win.URL, "revokeObjectURL");
    });

    cy.contains("button", "Unduh CSV Pajak").click();

    cy.window().its("URL.createObjectURL").should("have.been.called");
  });

  // ----------------------------------------------------------
  // TEST 10: 401 Unauthorized - Redirect to login
  // ----------------------------------------------------------
  it("Harus redirect ke login jika unauthorized (401)", () => {
    cy.intercept("GET", "**/api/reports/financial*", {
      statusCode: 401,
      body: { message: "Unauthorized" },
    }).as("getFinancialReport401");

    cy.reload();
    cy.wait("@getFinancialReport401");

    cy.url().should("include", "/login");
  });
});
