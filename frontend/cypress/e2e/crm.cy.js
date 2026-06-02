/**
 * ============================================================
 * SKENARIO PENGUJIAN: CRM (Database Pelanggan) - UMKM-Grow
 * ============================================================
 * Menguji seluruh fitur CRM/Customer Management end-to-end:
 *  - Tampilan halaman Database Pelanggan
 *  - Search pelanggan (nama/HP) dengan debounce
 *  - Pagination (Prev/Next)
 *  - CREATE pelanggan baru
 *  - EDIT pelanggan
 *  - DELETE pelanggan dengan confirmation
 *  - View Riwayat Transaksi (modal history)
 *  - Form validation (required fields)
 *  - Phone duplicate validation
 *  - Email optional
 *  - Loyalty points display
 *  - Avatar display
 *  - Empty state
 *  - Loading & error states
 * ============================================================
 */

describe("Skenario Pengujian CRM (Database Pelanggan) UMKM-Grow", () => {
  let users;

  before(() => {
    cy.fixture("user").then((data) => {
      users = data;
    });
  });

  beforeEach(() => {
    // Login dan navigasi ke CRM
    cy.clearLocalStorage();
    cy.login(users.validUser.email, users.validUser.password);
    cy.visit("/crm");
  });

  // ----------------------------------------------------------
  // TEST 1: Tampilan halaman Database Pelanggan
  // ----------------------------------------------------------
  it("Harus menampilkan halaman Database Pelanggan dengan elemen yang benar", () => {
    // Verifikasi judul halaman
    cy.contains("h1", "Database Pelanggan").should("be.visible");
    cy.contains("Kelola data pelanggan dan riwayat transaksi").should("be.visible");

    // Verifikasi search box
    cy.get('input[placeholder="Cari nama / no HP..."]').should("be.visible");

    // Verifikasi tombol Tambah Pelanggan
    cy.contains("button", "Tambah Pelanggan").should("be.visible");

    // Verifikasi tabel headers
    cy.contains("th", "Nama").should("be.visible");
    cy.contains("th", "No. HP").should("be.visible");
    cy.contains("th", "Email").should("be.visible");
    cy.contains("th", "Poin").should("be.visible");
    cy.contains("th", "Alamat").should("be.visible");
    cy.contains("th", "Aksi").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 2: Empty state - Belum ada pelanggan
  // ----------------------------------------------------------
  it("Harus menampilkan pesan jika belum ada pelanggan", () => {
    // Mock API dengan data kosong
    cy.intercept("GET", "**/api/customers*", {
      statusCode: 200,
      body: {
        data: [],
        totalPages: 1,
        totalData: 0,
        currentPage: 1,
      },
    }).as("getCustomers");

    cy.reload();
    cy.wait("@getCustomers");

    // Verifikasi empty state
    cy.contains('Belum ada pelanggan. Klik "Tambah Pelanggan" untuk mulai.').should(
      "be.visible"
    );
  });

  // ----------------------------------------------------------
  // TEST 3: Tampilkan list pelanggan dengan data lengkap
  // ----------------------------------------------------------
  it("Harus menampilkan daftar pelanggan dengan informasi lengkap", () => {
    // Mock customers data
    cy.intercept("GET", "**/api/customers*", {
      body: {
        data: [
          {
            id: 1,
            name: "Siti Nurhaliza",
            phone: "081234567890",
            email: "siti@email.com",
            loyalty_points: 150,
            address: "Jl. Merdeka No. 123, Jakarta",
          },
          {
            id: 2,
            name: "Budi Santoso",
            phone: "082345678901",
            email: null,
            loyalty_points: 75,
            address: "Jl. Sudirman No. 456, Bandung",
          },
        ],
        totalPages: 1,
        totalData: 2,
        currentPage: 1,
      },
    });

    cy.reload();

    // Verifikasi pelanggan 1
    cy.contains("td", "Siti Nurhaliza").should("be.visible");
    cy.contains("td", "081234567890").should("be.visible");
    cy.contains("td", "siti@email.com").should("be.visible");
    cy.contains("td", "150 pts").should("be.visible");
    cy.contains("td", "Jl. Merdeka No. 123, Jakarta").should("be.visible");

    // Verifikasi pelanggan 2
    cy.contains("td", "Budi Santoso").should("be.visible");
    cy.contains("td", "082345678901").should("be.visible");
    cy.contains("td", "75 pts").should("be.visible");

    // Verifikasi total ada 2 pelanggan
    cy.get("tbody tr").should("have.length", 2);

    // Verifikasi pagination info
    cy.contains("Total 2 pelanggan").should("be.visible");
    cy.contains("Halaman 1 / 1").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 4: Avatar display dengan Dicebear
  // ----------------------------------------------------------
  it("Harus menampilkan avatar pelanggan dengan Dicebear", () => {
    cy.intercept("GET", "**/api/customers*", {
      body: {
        data: [
          {
            id: 1,
            name: "John Doe",
            phone: "081234567890",
            email: "john@email.com",
            loyalty_points: 100,
            address: "Jakarta",
          },
        ],
        totalPages: 1,
        totalData: 1,
      },
    });

    cy.reload();

    // Verifikasi avatar image ada
    cy.get("img[alt='Avatar']").should("exist");
    cy.get("img[alt='Avatar']")
      .should("have.attr", "src")
      .and("include", "dicebear.com");
  });

  // ----------------------------------------------------------
  // TEST 5: Loyalty points display
  // ----------------------------------------------------------
  it("Harus menampilkan loyalty points dengan format yang benar", () => {
    cy.intercept("GET", "**/api/customers*", {
      body: {
        data: [
          {
            id: 1,
            name: "Customer A",
            phone: "081111111111",
            email: "a@email.com",
            loyalty_points: 250,
            address: "Jakarta",
          },
          {
            id: 2,
            name: "Customer B",
            phone: "082222222222",
            email: "b@email.com",
            loyalty_points: 0,
            address: "Bandung",
          },
        ],
        totalPages: 1,
        totalData: 2,
      },
    });

    cy.reload();

    // Verifikasi format loyalty points
    cy.contains("tr", "Customer A").within(() => {
      cy.contains("250 pts")
        .should("be.visible")
        .should("have.class", "text-emerald-500");
    });

    cy.contains("tr", "Customer B").within(() => {
      cy.contains("0 pts").should("be.visible");
    });
  });

  // ----------------------------------------------------------
  // TEST 6: CREATE - Buka modal Tambah Pelanggan
  // ----------------------------------------------------------
  it("Harus membuka modal form saat klik Tambah Pelanggan", () => {
    // Klik tombol Tambah Pelanggan
    cy.contains("button", "Tambah Pelanggan").click();

    // Verifikasi modal muncul
    cy.contains("Tambah Pelanggan").should("be.visible");
    cy.contains("Form Pelanggan").should("be.visible");

    // Verifikasi form fields
    cy.contains("label", "Nama").should("be.visible");
    cy.contains("label", "No HP").should("be.visible");
    cy.contains("label", "Email (Opsional)").should("be.visible");
    cy.contains("label", "Alamat").should("be.visible");

    // Verifikasi tombol
    cy.contains("button", "Batal").should("be.visible");
    cy.contains("button", "Simpan").should("be.visible");

    // Verifikasi close button (X)
    cy.get('button[aria-label="Tutup"]').should("exist");
  });

  // ----------------------------------------------------------
  // TEST 7: CREATE - Tutup modal dengan tombol Batal
  // ----------------------------------------------------------
  it("Harus menutup modal saat klik tombol Batal", () => {
    // Buka modal
    cy.contains("button", "Tambah Pelanggan").click();
    cy.contains("Form Pelanggan").should("be.visible");

    // Klik tombol Batal
    cy.contains("button", "Batal").click();

    // Verifikasi modal tertutup
    cy.contains("Form Pelanggan").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 8: CREATE - Tutup modal dengan tombol X
  // ----------------------------------------------------------
  it("Harus menutup modal saat klik tombol X (close)", () => {
    // Buka modal
    cy.contains("button", "Tambah Pelanggan").click();
    cy.contains("Form Pelanggan").should("be.visible");

    // Klik tombol X
    cy.get('button[aria-label="Tutup"]').click();

    // Verifikasi modal tertutup
    cy.contains("Form Pelanggan").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 9: CREATE - Form validation (required fields)
  // ----------------------------------------------------------
  it("Harus validasi field wajib (nama, phone, alamat)", () => {
    // Buka modal
    cy.contains("button", "Tambah Pelanggan").click();

    // Submit tanpa mengisi form
    cy.contains("button", "Simpan").click();

    // Modal masih terbuka (HTML5 validation)
    cy.contains("Form Pelanggan").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 10: CREATE - Tambah pelanggan berhasil
  // ----------------------------------------------------------
  it("Harus berhasil menambah pelanggan baru", () => {
    // Mock initial GET
    cy.intercept("GET", "**/api/customers*", {
      body: { data: [], totalPages: 1, totalData: 0 },
    }).as("getCustomersInitial");

    cy.reload();

    // Mock POST success
    cy.intercept("POST", "**/api/customers", {
      statusCode: 201,
      body: { id: 100, message: "Pelanggan berhasil ditambahkan" },
    }).as("createCustomer");

    // Mock GET after create
    cy.intercept("GET", "**/api/customers*", {
      body: {
        data: [
          {
            id: 100,
            name: "Siti Nurhaliza",
            phone: "081234567890",
            email: "siti@email.com",
            loyalty_points: 0,
            address: "Jl. Merdeka No. 123, Jakarta",
          },
        ],
        totalPages: 1,
        totalData: 1,
      },
    }).as("getCustomersAfterCreate");

    // Buka modal
    cy.contains("button", "Tambah Pelanggan").click();

    // Isi form
    cy.get('input[placeholder="Contoh: Siti Nurhaliza"]').type("Siti Nurhaliza");
    cy.get('input[placeholder="08xxxxxxxxxx"]').type("081234567890");
    cy.get('input[placeholder="nama@email.com"]').type("siti@email.com");
    cy.get('textarea[placeholder="Alamat lengkap pelanggan..."]').type(
      "Jl. Merdeka No. 123, Jakarta"
    );

    // Submit
    cy.contains("button", "Simpan").click();

    // Verifikasi API dipanggil
    cy.wait("@createCustomer").its("request.body").should("deep.include", {
      name: "Siti Nurhaliza",
      phone: "081234567890",
      email: "siti@email.com",
      address: "Jl. Merdeka No. 123, Jakarta",
    });

    cy.wait("@getCustomersAfterCreate");

    // Verifikasi modal tertutup
    cy.contains("Form Pelanggan").should("not.exist");

    // Verifikasi data baru muncul di tabel
    cy.contains("td", "Siti Nurhaliza").should("be.visible");
    cy.contains("td", "081234567890").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 11: CREATE - Email optional (bisa kosong)
  // ----------------------------------------------------------
  it("Harus bisa tambah pelanggan tanpa email", () => {
    cy.intercept("GET", "**/api/customers*", {
      body: { data: [], totalPages: 1, totalData: 0 },
    });

    cy.reload();

    // Mock POST success
    cy.intercept("POST", "**/api/customers", {
      statusCode: 201,
      body: { id: 101, message: "Success" },
    }).as("createCustomer");

    cy.intercept("GET", "**/api/customers*", {
      body: {
        data: [
          {
            id: 101,
            name: "Budi Santoso",
            phone: "082345678901",
            email: null,
            loyalty_points: 0,
            address: "Bandung",
          },
        ],
        totalPages: 1,
        totalData: 1,
      },
    });

    // Buka modal
    cy.contains("button", "Tambah Pelanggan").click();

    // Isi form tanpa email
    cy.get('input[placeholder="Contoh: Siti Nurhaliza"]').type("Budi Santoso");
    cy.get('input[placeholder="08xxxxxxxxxx"]').type("082345678901");
    // Skip email
    cy.get('textarea[placeholder="Alamat lengkap pelanggan..."]').type("Bandung");

    // Submit
    cy.contains("button", "Simpan").click();

    cy.wait("@createCustomer").its("request.body").should("deep.include", {
      name: "Budi Santoso",
      phone: "082345678901",
      email: null,
      address: "Bandung",
    });

    // Verifikasi data muncul dengan email "-"
    cy.contains("td", "Budi Santoso").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 12: CREATE - Phone duplicate validation (409 conflict)
  // ----------------------------------------------------------
  it("Harus menampilkan error jika nomor HP sudah terdaftar", () => {
    cy.intercept("GET", "**/api/customers*", {
      body: { data: [], totalPages: 1, totalData: 0 },
    });

    cy.reload();

    // Mock POST error 409
    cy.intercept("POST", "**/api/customers", {
      statusCode: 409,
      body: { message: "Nomor HP sudah terdaftar" },
    }).as("createCustomerDuplicate");

    // Buka modal
    cy.contains("button", "Tambah Pelanggan").click();

    // Isi form
    cy.get('input[placeholder="Contoh: Siti Nurhaliza"]').type("Test User");
    cy.get('input[placeholder="08xxxxxxxxxx"]').type("081234567890");
    cy.get('textarea[placeholder="Alamat lengkap pelanggan..."]').type("Jakarta");

    // Submit
    cy.contains("button", "Simpan").click();

    cy.wait("@createCustomerDuplicate");

    // Verifikasi error muncul
    cy.contains("Nomor HP sudah terdaftar di sistem!").should("be.visible");

    // Modal masih terbuka
    cy.contains("Form Pelanggan").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 13: CREATE - Error handling
  // ----------------------------------------------------------
  it("Harus menampilkan error jika create pelanggan gagal", () => {
    cy.intercept("GET", "**/api/customers*", {
      body: { data: [], totalPages: 1, totalData: 0 },
    });

    cy.reload();

    // Mock POST error 500
    cy.intercept("POST", "**/api/customers", {
      statusCode: 500,
      body: { message: "Server error" },
    }).as("createCustomerError");

    // Buka modal
    cy.contains("button", "Tambah Pelanggan").click();

    // Isi form
    cy.get('input[placeholder="Contoh: Siti Nurhaliza"]').type("Test User");
    cy.get('input[placeholder="08xxxxxxxxxx"]').type("081234567890");
    cy.get('textarea[placeholder="Alamat lengkap pelanggan..."]').type("Jakarta");

    // Submit
    cy.contains("button", "Simpan").click();

    cy.wait("@createCustomerError");

    // Verifikasi error muncul
    cy.contains("Server error").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 14: EDIT - Buka modal edit pelanggan
  // ----------------------------------------------------------
  it("Harus membuka modal edit dengan data pelanggan yang dipilih", () => {
    cy.intercept("GET", "**/api/customers*", {
      body: {
        data: [
          {
            id: 1,
            name: "Siti Nurhaliza",
            phone: "081234567890",
            email: "siti@email.com",
            loyalty_points: 150,
            address: "Jakarta",
          },
        ],
        totalPages: 1,
        totalData: 1,
      },
    });

    cy.reload();

    // Klik tombol edit
    cy.get('button[aria-label="Edit pelanggan"]').click();

    // Verifikasi modal muncul dengan judul Edit
    cy.contains("Edit Pelanggan").should("be.visible");
    cy.contains("Form Pelanggan").should("be.visible");

    // Verifikasi form terisi dengan data pelanggan
    cy.get('input[placeholder="Contoh: Siti Nurhaliza"]').should(
      "have.value",
      "Siti Nurhaliza"
    );
    cy.get('input[placeholder="08xxxxxxxxxx"]').should("have.value", "081234567890");
    cy.get('input[placeholder="nama@email.com"]').should("have.value", "siti@email.com");
    cy.get('textarea[placeholder="Alamat lengkap pelanggan..."]').should(
      "have.value",
      "Jakarta"
    );
  });

  // ----------------------------------------------------------
  // TEST 15: EDIT - Update pelanggan berhasil
  // ----------------------------------------------------------
  it("Harus berhasil update data pelanggan", () => {
    cy.intercept("GET", "**/api/customers*", {
      body: {
        data: [
          {
            id: 1,
            name: "Siti Nurhaliza",
            phone: "081234567890",
            email: "siti@email.com",
            loyalty_points: 150,
            address: "Jakarta",
          },
        ],
        totalPages: 1,
        totalData: 1,
      },
    }).as("getCustomersInitial");

    cy.reload();
    cy.wait("@getCustomersInitial");

    // Mock PUT success
    cy.intercept("PUT", "**/api/customers/1", {
      statusCode: 200,
      body: { message: "Pelanggan berhasil diupdate" },
    }).as("updateCustomer");

    // Mock GET after update
    cy.intercept("GET", "**/api/customers*", {
      body: {
        data: [
          {
            id: 1,
            name: "Siti Nurhaliza Updated",
            phone: "089999999999",
            email: "siti.new@email.com",
            loyalty_points: 150,
            address: "Jakarta Selatan",
          },
        ],
        totalPages: 1,
        totalData: 1,
      },
    }).as("getCustomersAfterUpdate");

    // Klik tombol edit
    cy.get('button[aria-label="Edit pelanggan"]').click();

    // Update data
    cy.get('input[placeholder="Contoh: Siti Nurhaliza"]')
      .clear()
      .type("Siti Nurhaliza Updated");
    cy.get('input[placeholder="08xxxxxxxxxx"]').clear().type("089999999999");
    cy.get('input[placeholder="nama@email.com"]').clear().type("siti.new@email.com");
    cy.get('textarea[placeholder="Alamat lengkap pelanggan..."]')
      .clear()
      .type("Jakarta Selatan");

    // Submit
    cy.contains("button", "Simpan").click();

    // Verifikasi API dipanggil
    cy.wait("@updateCustomer").its("request.body").should("deep.include", {
      name: "Siti Nurhaliza Updated",
      phone: "089999999999",
      email: "siti.new@email.com",
      address: "Jakarta Selatan",
    });

    cy.wait("@getCustomersAfterUpdate");

    // Verifikasi modal tertutup
    cy.contains("Form Pelanggan").should("not.exist");

    // Verifikasi data terupdate
    cy.contains("td", "Siti Nurhaliza Updated").should("be.visible");
    cy.contains("td", "089999999999").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 16: DELETE - Hapus pelanggan dengan confirmation
  // ----------------------------------------------------------
  it("Harus bisa hapus pelanggan dengan confirmation", () => {
    // Mock initial data
    cy.intercept("GET", "**/api/customers*", {
      body: {
        data: [
          {
            id: 1,
            name: "Siti Nurhaliza",
            phone: "081234567890",
            email: "siti@email.com",
            loyalty_points: 150,
            address: "Jakarta",
          },
        ],
        totalPages: 1,
        totalData: 1,
      },
    }).as("getCustomersInitial");

    cy.reload();
    cy.wait("@getCustomersInitial");

    // Mock DELETE success
    cy.intercept("DELETE", "**/api/customers/1", {
      statusCode: 200,
      body: { message: "Pelanggan berhasil dihapus" },
    }).as("deleteCustomer");

    // Mock GET after delete (data kosong)
    cy.intercept("GET", "**/api/customers*", {
      body: { data: [], totalPages: 1, totalData: 0 },
    }).as("getCustomersAfterDelete");

    // Stub window.confirm untuk auto confirm
    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);
    });

    // Klik tombol delete
    cy.get('button[aria-label="Hapus pelanggan"]').click();

    // Verifikasi API dipanggil
    cy.wait("@deleteCustomer");
    cy.wait("@getCustomersAfterDelete");

    // Verifikasi data terhapus (empty state)
    cy.contains('Belum ada pelanggan. Klik "Tambah Pelanggan" untuk mulai.').should(
      "be.visible"
    );
  });

  // ----------------------------------------------------------
  // TEST 17: DELETE - Cancel deletion
  // ----------------------------------------------------------
  it("Harus bisa cancel delete pelanggan", () => {
    cy.intercept("GET", "**/api/customers*", {
      body: {
        data: [
          {
            id: 1,
            name: "Siti Nurhaliza",
            phone: "081234567890",
            email: "siti@email.com",
            loyalty_points: 150,
            address: "Jakarta",
          },
        ],
        totalPages: 1,
        totalData: 1,
      },
    });

    cy.reload();

    // Stub window.confirm untuk cancel
    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(false);
    });

    // Klik tombol delete
    cy.get('button[aria-label="Hapus pelanggan"]').click();

    // Data masih ada
    cy.contains("td", "Siti Nurhaliza").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 18: DELETE - Error handling
  // ----------------------------------------------------------
  it("Harus menampilkan error jika delete pelanggan gagal", () => {
    cy.intercept("GET", "**/api/customers*", {
      body: {
        data: [
          {
            id: 1,
            name: "Siti Nurhaliza",
            phone: "081234567890",
            email: "siti@email.com",
            loyalty_points: 150,
            address: "Jakarta",
          },
        ],
        totalPages: 1,
        totalData: 1,
      },
    });

    cy.reload();

    // Mock DELETE error
    cy.intercept("DELETE", "**/api/customers/1", {
      statusCode: 500,
      body: { message: "Gagal menghapus pelanggan" },
    }).as("deleteError");

    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);
    });

    // Klik tombol delete
    cy.get('button[aria-label="Hapus pelanggan"]').click();

    cy.wait("@deleteError");

    // Verifikasi error muncul
    cy.contains("Gagal menghapus pelanggan").should("be.visible");

    // Data masih ada
    cy.contains("td", "Siti Nurhaliza").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 19: Search pelanggan dengan debounce
  // ----------------------------------------------------------
  it("Harus bisa search pelanggan by nama atau HP dengan debounce", () => {
    // Mock initial data
    cy.intercept("GET", "**/api/customers*", {
      body: {
        data: [
          {
            id: 1,
            name: "Siti Nurhaliza",
            phone: "081234567890",
            email: "siti@email.com",
            loyalty_points: 150,
            address: "Jakarta",
          },
          {
            id: 2,
            name: "Budi Santoso",
            phone: "082345678901",
            email: "budi@email.com",
            loyalty_points: 75,
            address: "Bandung",
          },
        ],
        totalPages: 1,
        totalData: 2,
      },
    }).as("getCustomersInitial");

    cy.reload();
    cy.wait("@getCustomersInitial");

    // Mock search result
    cy.intercept("GET", "**/api/customers*search=Siti*", {
      body: {
        data: [
          {
            id: 1,
            name: "Siti Nurhaliza",
            phone: "081234567890",
            email: "siti@email.com",
            loyalty_points: 150,
            address: "Jakarta",
          },
        ],
        totalPages: 1,
        totalData: 1,
      },
    }).as("getCustomersSearch");

    // Type search query
    cy.get('input[placeholder="Cari nama / no HP..."]').type("Siti");

    // Wait for debounce (300ms) + request
    cy.wait("@getCustomersSearch", { timeout: 1000 });

    // Verifikasi hanya Siti yang muncul
    cy.contains("td", "Siti Nurhaliza").should("be.visible");
    cy.contains("td", "Budi Santoso").should("not.exist");

    // Verifikasi pagination info update
    cy.contains("Total 1 pelanggan").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 20: Pagination - Next page
  // ----------------------------------------------------------
  it("Harus bisa navigasi ke halaman berikutnya (Next)", () => {
    // Mock page 1
    cy.intercept("GET", "**/api/customers*page=1*", {
      body: {
        data: [
          {
            id: 1,
            name: "Customer 1",
            phone: "081111111111",
            email: "c1@email.com",
            loyalty_points: 100,
            address: "Jakarta",
          },
        ],
        totalPages: 2,
        totalData: 15,
        currentPage: 1,
      },
    }).as("getCustomersPage1");

    cy.reload();
    cy.wait("@getCustomersPage1");

    // Verifikasi halaman 1
    cy.contains("Halaman 1 / 2").should("be.visible");
    cy.contains("td", "Customer 1").should("be.visible");

    // Mock page 2
    cy.intercept("GET", "**/api/customers*page=2*", {
      body: {
        data: [
          {
            id: 2,
            name: "Customer 2",
            phone: "082222222222",
            email: "c2@email.com",
            loyalty_points: 200,
            address: "Bandung",
          },
        ],
        totalPages: 2,
        totalData: 15,
        currentPage: 2,
      },
    }).as("getCustomersPage2");

    // Klik Next
    cy.contains("button", "Next").click();

    cy.wait("@getCustomersPage2");

    // Verifikasi halaman 2
    cy.contains("Halaman 2 / 2").should("be.visible");
    cy.contains("td", "Customer 2").should("be.visible");
    cy.contains("td", "Customer 1").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 21: Pagination - Previous page
  // ----------------------------------------------------------
  it("Harus bisa navigasi ke halaman sebelumnya (Prev)", () => {
    // Mock page 2
    cy.intercept("GET", "**/api/customers*", {
      body: {
        data: [
          {
            id: 2,
            name: "Customer 2",
            phone: "082222222222",
            email: "c2@email.com",
            loyalty_points: 200,
            address: "Bandung",
          },
        ],
        totalPages: 2,
        totalData: 15,
        currentPage: 2,
      },
    }).as("getCustomersPage2");

    cy.reload();

    // Set page to 2 manually by clicking Next
    cy.intercept("GET", "**/api/customers*page=1*", {
      body: {
        data: [
          {
            id: 1,
            name: "Customer 1",
            phone: "081111111111",
            email: "c1@email.com",
            loyalty_points: 100,
            address: "Jakarta",
          },
        ],
        totalPages: 2,
        totalData: 15,
        currentPage: 1,
      },
    }).as("getCustomersPage1");

    cy.contains("button", "Next").click();
    cy.wait("@getCustomersPage2");

    // Verifikasi di page 2
    cy.contains("Halaman 2 / 2").should("be.visible");

    // Klik Prev
    cy.contains("button", "Prev").click();

    cy.wait("@getCustomersPage1");

    // Verifikasi kembali ke page 1
    cy.contains("Halaman 1 / 2").should("be.visible");
    cy.contains("td", "Customer 1").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 22: Pagination - Buttons disabled state
  // ----------------------------------------------------------
  it("Harus disable Prev di page 1 dan Next di page terakhir", () => {
    // Mock single page
    cy.intercept("GET", "**/api/customers*", {
      body: {
        data: [
          {
            id: 1,
            name: "Customer 1",
            phone: "081111111111",
            email: "c1@email.com",
            loyalty_points: 100,
            address: "Jakarta",
          },
        ],
        totalPages: 1,
        totalData: 1,
        currentPage: 1,
      },
    });

    cy.reload();

    // Verifikasi Prev dan Next disabled
    cy.contains("button", "Prev").should("be.disabled");
    cy.contains("button", "Next").should("be.disabled");
  });

  // ----------------------------------------------------------
  // TEST 23: Loading state
  // ----------------------------------------------------------
  it("Harus menampilkan loading state saat fetch data", () => {
    // Mock dengan delay
    cy.intercept("GET", "**/api/customers*", (req) => {
      req.reply({
        delay: 1000,
        statusCode: 200,
        body: { data: [], totalPages: 1, totalData: 0 },
      });
    }).as("getCustomersSlow");

    cy.reload();

    // Verifikasi loading state
    cy.contains("Memuat data...").should("be.visible");

    cy.wait("@getCustomersSlow");

    // Loading hilang
    cy.contains("Memuat data...").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 24: Error state saat fetch
  // ----------------------------------------------------------
  it("Harus menampilkan error state jika fetch data gagal", () => {
    // Mock GET error
    cy.intercept("GET", "**/api/customers*", {
      statusCode: 500,
      body: { message: "Server error" },
    }).as("getCustomersError");

    cy.reload();
    cy.wait("@getCustomersError");

    // Verifikasi error message
    cy.contains("Gagal memuat pelanggan.").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 25: View Riwayat Transaksi - Buka modal
  // ----------------------------------------------------------
  it("Harus membuka modal riwayat transaksi saat klik icon Clock", () => {
    cy.intercept("GET", "**/api/customers*", {
      body: {
        data: [
          {
            id: 1,
            name: "Siti Nurhaliza",
            phone: "081234567890",
            email: "siti@email.com",
            loyalty_points: 150,
            address: "Jakarta",
          },
        ],
        totalPages: 1,
        totalData: 1,
      },
    });

    // Mock transactions
    cy.intercept("GET", "**/api/customers/1/transactions*", {
      body: {
        data: [
          {
            id: 1001,
            date: "2024-12-15T10:30:00Z",
            total_price: 150000,
            status: "completed",
          },
        ],
        totalPages: 1,
        currentPage: 1,
      },
    }).as("getTransactions");

    cy.reload();

    // Klik icon riwayat transaksi
    cy.get('button[aria-label="Riwayat transaksi"]').click();

    cy.wait("@getTransactions");

    // Verifikasi modal muncul
    cy.contains("Riwayat Belanja").should("be.visible");
    cy.contains("Siti Nurhaliza").should("be.visible");

    // Verifikasi table headers
    cy.contains("th", "Tanggal").should("be.visible");
    cy.contains("th", "ID Transaksi").should("be.visible");
    cy.contains("th", "Total").should("be.visible");
    cy.contains("th", "Status").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 26: Riwayat Transaksi - Display data
  // ----------------------------------------------------------
  it("Harus menampilkan riwayat transaksi dengan format yang benar", () => {
    cy.intercept("GET", "**/api/customers*", {
      body: {
        data: [
          {
            id: 1,
            name: "Siti Nurhaliza",
            phone: "081234567890",
            email: "siti@email.com",
            loyalty_points: 150,
            address: "Jakarta",
          },
        ],
        totalPages: 1,
        totalData: 1,
      },
    });

    // Mock transactions
    cy.intercept("GET", "**/api/customers/1/transactions*", {
      body: {
        data: [
          {
            id: 1001,
            date: "2024-12-15T10:30:00Z",
            total_price: 150000,
            status: "completed",
          },
          {
            id: 1002,
            date: "2024-12-14T15:45:00Z",
            total_price: 250000,
            status: "pending",
          },
        ],
        totalPages: 1,
        currentPage: 1,
      },
    }).as("getTransactions");

    cy.reload();

    // Buka modal riwayat
    cy.get('button[aria-label="Riwayat transaksi"]').click();
    cy.wait("@getTransactions");

    // Verifikasi transaksi 1
    cy.contains("td", "1001").should("be.visible");
    cy.contains("td", "Rp 150.000").should("be.visible");
    cy.contains("completed").should("be.visible");

    // Verifikasi transaksi 2
    cy.contains("td", "1002").should("be.visible");
    cy.contains("td", "Rp 250.000").should("be.visible");
    cy.contains("pending").should("be.visible");

    // Verifikasi total 2 transaksi
    cy.get("tbody tr").should("have.length", 2);
  });

  // ----------------------------------------------------------
  // TEST 27: Riwayat Transaksi - Empty state
  // ----------------------------------------------------------
  it("Harus menampilkan pesan jika belum ada riwayat transaksi", () => {
    cy.intercept("GET", "**/api/customers*", {
      body: {
        data: [
          {
            id: 1,
            name: "Siti Nurhaliza",
            phone: "081234567890",
            email: "siti@email.com",
            loyalty_points: 0,
            address: "Jakarta",
          },
        ],
        totalPages: 1,
        totalData: 1,
      },
    });

    // Mock transactions kosong
    cy.intercept("GET", "**/api/customers/1/transactions*", {
      body: {
        data: [],
        totalPages: 1,
        currentPage: 1,
      },
    }).as("getTransactionsEmpty");

    cy.reload();

    // Buka modal riwayat
    cy.get('button[aria-label="Riwayat transaksi"]').click();
    cy.wait("@getTransactionsEmpty");

    // Verifikasi empty state
    cy.contains("Belum ada riwayat transaksi.").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 28: Riwayat Transaksi - Pagination
  // ----------------------------------------------------------
  it("Harus bisa pagination di modal riwayat transaksi", () => {
    cy.intercept("GET", "**/api/customers*", {
      body: {
        data: [
          {
            id: 1,
            name: "Siti Nurhaliza",
            phone: "081234567890",
            email: "siti@email.com",
            loyalty_points: 150,
            address: "Jakarta",
          },
        ],
        totalPages: 1,
        totalData: 1,
      },
    });

    // Mock transactions page 1
    cy.intercept("GET", "**/api/customers/1/transactions*page=1*", {
      body: {
        data: [
          {
            id: 1001,
            date: "2024-12-15T10:30:00Z",
            total_price: 150000,
            status: "completed",
          },
        ],
        totalPages: 2,
        currentPage: 1,
      },
    }).as("getTransactionsPage1");

    cy.reload();

    // Buka modal riwayat
    cy.get('button[aria-label="Riwayat transaksi"]').click();
    cy.wait("@getTransactionsPage1");

    // Verifikasi page 1
    cy.contains("Halaman 1 / 2").should("be.visible");
    cy.contains("td", "1001").should("be.visible");

    // Mock transactions page 2
    cy.intercept("GET", "**/api/customers/1/transactions*page=2*", {
      body: {
        data: [
          {
            id: 1002,
            date: "2024-12-14T15:45:00Z",
            total_price: 250000,
            status: "pending",
          },
        ],
        totalPages: 2,
        currentPage: 2,
      },
    }).as("getTransactionsPage2");

    // Klik Next
    cy.contains("button", "Next").last().click();

    cy.wait("@getTransactionsPage2");

    // Verifikasi page 2
    cy.contains("Halaman 2 / 2").should("be.visible");
    cy.contains("td", "1002").should("be.visible");
    cy.contains("td", "1001").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 29: Riwayat Transaksi - Close modal
  // ----------------------------------------------------------
  it("Harus menutup modal riwayat transaksi saat klik tombol X", () => {
    cy.intercept("GET", "**/api/customers*", {
      body: {
        data: [
          {
            id: 1,
            name: "Siti Nurhaliza",
            phone: "081234567890",
            email: "siti@email.com",
            loyalty_points: 150,
            address: "Jakarta",
          },
        ],
        totalPages: 1,
        totalData: 1,
      },
    });

    cy.intercept("GET", "**/api/customers/1/transactions*", {
      body: { data: [], totalPages: 1, currentPage: 1 },
    });

    cy.reload();

    // Buka modal riwayat
    cy.get('button[aria-label="Riwayat transaksi"]').click();
    cy.contains("Riwayat Belanja").should("be.visible");

    // Klik tombol X
    cy.get('button[aria-label="Tutup"]').last().click();

    // Verifikasi modal tertutup
    cy.contains("Riwayat Belanja").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 30: Riwayat Transaksi - Loading state
  // ----------------------------------------------------------
  it("Harus menampilkan loading state saat fetch riwayat transaksi", () => {
    cy.intercept("GET", "**/api/customers*", {
      body: {
        data: [
          {
            id: 1,
            name: "Siti Nurhaliza",
            phone: "081234567890",
            email: "siti@email.com",
            loyalty_points: 150,
            address: "Jakarta",
          },
        ],
        totalPages: 1,
        totalData: 1,
      },
    });

    // Mock transactions dengan delay
    cy.intercept("GET", "**/api/customers/1/transactions*", (req) => {
      req.reply({
        delay: 1500,
        statusCode: 200,
        body: { data: [], totalPages: 1, currentPage: 1 },
      });
    }).as("getTransactionsSlow");

    cy.reload();

    // Buka modal riwayat
    cy.get('button[aria-label="Riwayat transaksi"]').click();

    // Verifikasi loading state
    cy.contains("Memuat...").should("be.visible");

    cy.wait("@getTransactionsSlow");

    // Loading hilang
    cy.contains("Memuat...").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 31: Riwayat Transaksi - Error handling
  // ----------------------------------------------------------
  it("Harus menampilkan error jika fetch riwayat transaksi gagal", () => {
    cy.intercept("GET", "**/api/customers*", {
      body: {
        data: [
          {
            id: 1,
            name: "Siti Nurhaliza",
            phone: "081234567890",
            email: "siti@email.com",
            loyalty_points: 150,
            address: "Jakarta",
          },
        ],
        totalPages: 1,
        totalData: 1,
      },
    });

    // Mock transactions error
    cy.intercept("GET", "**/api/customers/1/transactions*", {
      statusCode: 500,
      body: { message: "Server error" },
    }).as("getTransactionsError");

    cy.reload();

    // Buka modal riwayat
    cy.get('button[aria-label="Riwayat transaksi"]').click();
    cy.wait("@getTransactionsError");

    // Verifikasi error muncul
    cy.contains("Gagal memuat riwayat transaksi.").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 32: FULL FLOW - Complete cycle (Create → Edit → View History → Delete)
  // ----------------------------------------------------------
  it("FULL FLOW: Harus bisa complete cycle Create → Edit → View History → Delete", () => {
    // Mock initial empty
    cy.intercept("GET", "**/api/customers*", {
      body: { data: [], totalPages: 1, totalData: 0 },
    }).as("getCustomersInitial");

    cy.reload();
    cy.wait("@getCustomersInitial");

    // Verifikasi empty state
    cy.contains('Belum ada pelanggan. Klik "Tambah Pelanggan" untuk mulai.').should(
      "be.visible"
    );

    // === CREATE ===
    cy.intercept("POST", "**/api/customers", {
      statusCode: 201,
      body: { id: 100, message: "Success" },
    }).as("createCustomer");

    cy.intercept("GET", "**/api/customers*", {
      body: {
        data: [
          {
            id: 100,
            name: "Siti Nurhaliza",
            phone: "081234567890",
            email: "siti@email.com",
            loyalty_points: 0,
            address: "Jl. Merdeka No. 123, Jakarta",
          },
        ],
        totalPages: 1,
        totalData: 1,
      },
    }).as("getAfterCreate");

    cy.contains("button", "Tambah Pelanggan").click();
    cy.get('input[placeholder="Contoh: Siti Nurhaliza"]').type("Siti Nurhaliza");
    cy.get('input[placeholder="08xxxxxxxxxx"]').type("081234567890");
    cy.get('input[placeholder="nama@email.com"]').type("siti@email.com");
    cy.get('textarea[placeholder="Alamat lengkap pelanggan..."]').type(
      "Jl. Merdeka No. 123, Jakarta"
    );
    cy.contains("button", "Simpan").click();

    cy.wait("@createCustomer");
    cy.wait("@getAfterCreate");

    // Verifikasi data muncul
    cy.contains("td", "Siti Nurhaliza").should("be.visible");
    cy.contains("Total 1 pelanggan").should("be.visible");

    // === EDIT ===
    cy.intercept("PUT", "**/api/customers/100", {
      statusCode: 200,
      body: { message: "Updated" },
    }).as("updateCustomer");

    cy.intercept("GET", "**/api/customers*", {
      body: {
        data: [
          {
            id: 100,
            name: "Siti Nurhaliza Updated",
            phone: "089999999999",
            email: "siti.new@email.com",
            loyalty_points: 150,
            address: "Jakarta Selatan",
          },
        ],
        totalPages: 1,
        totalData: 1,
      },
    }).as("getAfterUpdate");

    cy.get('button[aria-label="Edit pelanggan"]').click();
    cy.get('input[placeholder="Contoh: Siti Nurhaliza"]')
      .clear()
      .type("Siti Nurhaliza Updated");
    cy.get('input[placeholder="08xxxxxxxxxx"]').clear().type("089999999999");
    cy.contains("button", "Simpan").click();

    cy.wait("@updateCustomer");
    cy.wait("@getAfterUpdate");

    // Verifikasi data terupdate
    cy.contains("td", "Siti Nurhaliza Updated").should("be.visible");
    cy.contains("td", "089999999999").should("be.visible");
    cy.contains("td", "150 pts").should("be.visible");

    // === VIEW HISTORY ===
    cy.intercept("GET", "**/api/customers/100/transactions*", {
      body: {
        data: [
          {
            id: 1001,
            date: "2024-12-15T10:30:00Z",
            total_price: 150000,
            status: "completed",
          },
        ],
        totalPages: 1,
        currentPage: 1,
      },
    }).as("getTransactions");

    cy.get('button[aria-label="Riwayat transaksi"]').click();
    cy.wait("@getTransactions");

    // Verifikasi modal riwayat
    cy.contains("Riwayat Belanja").should("be.visible");
    cy.contains("td", "1001").should("be.visible");
    cy.contains("td", "Rp 150.000").should("be.visible");

    // Close modal history
    cy.get('button[aria-label="Tutup"]').last().click();
    cy.contains("Riwayat Belanja").should("not.exist");

    // === DELETE ===
    cy.intercept("DELETE", "**/api/customers/100", {
      statusCode: 200,
      body: { message: "Deleted" },
    }).as("deleteCustomer");

    cy.intercept("GET", "**/api/customers*", {
      body: { data: [], totalPages: 1, totalData: 0 },
    }).as("getAfterDelete");

    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);
    });

    cy.get('button[aria-label="Hapus pelanggan"]').click();

    cy.wait("@deleteCustomer");
    cy.wait("@getAfterDelete");

    // Verifikasi kembali ke empty state
    cy.contains('Belum ada pelanggan. Klik "Tambah Pelanggan" untuk mulai.').should(
      "be.visible"
    );
  });
});
