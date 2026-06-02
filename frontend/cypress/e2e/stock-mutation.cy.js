/**
 * ============================================================
 * SKENARIO PENGUJIAN: Stock Mutation (Mutasi Stok) - UMKM-Grow
 * ============================================================
 * Menguji seluruh fitur Transfer Mutasi Stok end-to-end:
 *  - Tampilan halaman mutasi stok
 *  - Form transfer stok antar cabang
 *  - Validasi form (field wajib, quantity > 0)
 *  - Submit mutasi berhasil
 *  - Riwayat mutasi (incoming & outgoing)
 *  - Branch context filtering
 *  - ACID transaction handling
 *  - Error handling & messages
 *  - Load products by branch
 * ============================================================
 */

describe("Skenario Pengujian Stock Mutation UMKM-Grow", () => {
  let users;

  before(() => {
    cy.fixture("user").then((data) => {
      users = data;
    });
  });

  beforeEach(() => {
    // Login dan navigasi ke Stock Mutation
    cy.clearLocalStorage();
    cy.login(users.validUser.email, users.validUser.password);
    cy.visit("/inventory/mutations");
  });

  // ----------------------------------------------------------
  // TEST 1: Tampilan halaman Stock Mutation
  // ----------------------------------------------------------
  it("Harus menampilkan halaman Stock Mutation dengan elemen yang benar", () => {
    // Verifikasi judul halaman
    cy.contains("h1", "Transfer Mutasi Stok").should("be.visible");
    cy.contains("Pindahkan stok barang antar cabang").should("be.visible");

    // Verifikasi form mutasi ada
    cy.contains("h2", "Form Mutasi").should("be.visible");

    // Verifikasi form fields
    cy.contains("label", "Cabang Asal").should("be.visible");
    cy.contains("label", "Pilih Barang").should("be.visible");
    cy.contains("label", "Jumlah (Qty)").should("be.visible");
    cy.contains("label", "Cabang Tujuan").should("be.visible");
    cy.contains("label", "Catatan").should("be.visible");

    // Verifikasi tombol submit
    cy.contains("button", "Proses Mutasi").should("be.visible");

    // Verifikasi tabel riwayat mutasi
    cy.contains("h2", "Riwayat Mutasi").should("be.visible");
    cy.contains("Menampilkan mutasi masuk dan keluar").should("be.visible");

    // Verifikasi tabel headers
    cy.contains("th", "Tanggal").should("be.visible");
    cy.contains("th", "Barang").should("be.visible");
    cy.contains("th", "Dari").should("be.visible");
    cy.contains("th", "Ke").should("be.visible");
    cy.contains("th", "Qty").should("be.visible");
    cy.contains("th", "Status").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 2: Cabang asal ter-populate dari context
  // ----------------------------------------------------------
  it("Harus menampilkan cabang asal dari selected branch context", () => {
    // Mock branches
    cy.intercept("GET", "**/api/branches", {
      body: [
        { id_cabang: 1, nama_cabang: "Cabang Pusat" },
        { id_cabang: 2, nama_cabang: "Cabang Jakarta" },
      ],
    });

    cy.reload();

    // Verifikasi cabang asal disabled dan ter-isi
    cy.contains("label", "Cabang Asal")
      .parent()
      .within(() => {
        cy.get("input").should("be.disabled");
        cy.get("input").should("not.have.value", "");
      });
  });

  // ----------------------------------------------------------
  // TEST 3: Load products berdasarkan selected branch
  // ----------------------------------------------------------
  it("Harus memuat produk dari cabang yang dipilih", () => {
    // Mock products dari cabang 1
    cy.intercept("GET", "**/api/products?branch_id=1", {
      body: {
        data: [
          { id: 1, name: "Kopi Arabica", nama_produk: "Kopi Arabica", stok: 50 },
          { id: 2, name: "Teh Hijau", nama_produk: "Teh Hijau", stok: 30 },
        ],
      },
    }).as("getProducts");

    cy.reload();
    cy.wait("@getProducts");

    // Buka dropdown pilih barang
    cy.get('select[name="product_id"]').select("1");

    // Verifikasi produk tersedia di dropdown
    cy.get('select[name="product_id"]').within(() => {
      cy.contains("option", "Kopi Arabica").should("exist");
      cy.contains("option", "Teh Hijau").should("exist");
    });
  });

  // ----------------------------------------------------------
  // TEST 4: Empty state - Tidak ada produk di cabang
  // ----------------------------------------------------------
  it("Harus menampilkan pesan jika tidak ada produk di cabang", () => {
    // Mock products kosong
    cy.intercept("GET", "**/api/products?branch_id=*", {
      body: { data: [] },
    });

    cy.reload();

    // Verifikasi dropdown menampilkan pesan tidak ada barang
    cy.get('select[name="product_id"]').within(() => {
      cy.contains("option", "Tidak ada barang di cabang ini").should("be.visible");
    });
  });

  // ----------------------------------------------------------
  // TEST 5: Filter cabang tujuan (exclude cabang asal)
  // ----------------------------------------------------------
  it("Harus memfilter cabang tujuan, tidak boleh sama dengan cabang asal", () => {
    // Mock branches
    cy.intercept("GET", "**/api/branches", {
      body: [
        { id_cabang: 1, nama_cabang: "Cabang Pusat" },
        { id_cabang: 2, nama_cabang: "Cabang Jakarta" },
        { id_cabang: 3, nama_cabang: "Cabang Bandung" },
      ],
    });

    cy.reload();

    // Buka dropdown cabang tujuan (asumsi selected branch = 1)
    cy.get('select[name="to_branch_id"]').within(() => {
      // Cabang Pusat tidak boleh muncul (karena itu cabang asal)
      cy.contains("option", "Cabang Pusat").should("not.exist");

      // Cabang lain harus muncul
      cy.contains("option", "Cabang Jakarta").should("exist");
      cy.contains("option", "Cabang Bandung").should("exist");
    });
  });

  // ----------------------------------------------------------
  // TEST 6: Form validation - Field wajib diisi
  // ----------------------------------------------------------
  it("Harus mencegah submit jika ada field wajib yang kosong", () => {
    // Mock products
    cy.intercept("GET", "**/api/products?branch_id=*", {
      body: {
        data: [{ id: 1, name: "Produk Test", nama_produk: "Produk Test" }],
      },
    });

    cy.reload();

    // Coba submit tanpa mengisi form
    cy.contains("button", "Proses Mutasi").click();

    // Verifikasi error message muncul (browser native validation atau custom)
    cy.contains("Semua field harus diisi").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 7: Form validation - Quantity harus > 0
  // ----------------------------------------------------------
  it("Harus menampilkan error jika quantity <= 0", () => {
    // Mock data
    cy.intercept("GET", "**/api/products?branch_id=*", {
      body: {
        data: [{ id: 1, name: "Produk Test", nama_produk: "Produk Test" }],
      },
    });

    cy.intercept("GET", "**/api/branches", {
      body: [
        { id_cabang: 1, nama_cabang: "Cabang Pusat" },
        { id_cabang: 2, nama_cabang: "Cabang Jakarta" },
      ],
    });

    cy.reload();

    // Isi form dengan quantity 0
    cy.get('select[name="product_id"]').select("1");
    cy.get('input[name="quantity"]').type("0");
    cy.get('select[name="to_branch_id"]').select("2");

    // Submit
    cy.contains("button", "Proses Mutasi").click();

    // Verifikasi error message
    cy.contains("Jumlah harus lebih dari 0").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 8: Submit mutasi berhasil
  // ----------------------------------------------------------
  it("Harus bisa melakukan transfer mutasi stok dengan sukses", () => {
    // Mock data
    cy.intercept("GET", "**/api/products?branch_id=*", {
      body: {
        data: [{ id: 1, name: "Kopi Arabica", nama_produk: "Kopi Arabica" }],
      },
    });

    cy.intercept("GET", "**/api/branches", {
      body: [
        { id_cabang: 1, nama_cabang: "Cabang Pusat" },
        { id_cabang: 2, nama_cabang: "Cabang Jakarta" },
      ],
    });

    // Mock mutasi berhasil
    cy.intercept("POST", "**/api/mutations", {
      statusCode: 201,
      body: {
        message: "Stock mutation successful",
        data: {
          id_mutasi: 1,
          product_id: 1,
          from_branch_id: 1,
          to_branch_id: 2,
          quantity: 10,
        },
      },
    }).as("createMutation");

    // Mock refresh mutations
    cy.intercept("GET", "**/api/mutations?branch_id=*", {
      body: [
        {
          id_mutasi: 1,
          from_branch_id: 1,
          to_branch_id: 2,
          quantity: 10,
          tanggal: new Date().toISOString(),
          product: { nama_produk: "Kopi Arabica" },
          fromBranch: { nama_cabang: "Cabang Pusat" },
          toBranch: { nama_cabang: "Cabang Jakarta" },
        },
      ],
    });

    cy.reload();

    // Isi form
    cy.get('select[name="product_id"]').select("1");
    cy.get('input[name="quantity"]').type("10");
    cy.get('select[name="to_branch_id"]').select("2");
    cy.get('textarea[name="notes"]').type("Transfer stok untuk promo");

    // Submit
    cy.contains("button", "Proses Mutasi").click();
    cy.wait("@createMutation");

    // Verifikasi success message
    cy.contains("Mutasi stok berhasil diproses!").should("be.visible");

    // Verifikasi form ter-reset
    cy.get('select[name="product_id"]').should("have.value", "");
    cy.get('input[name="quantity"]').should("have.value", "");
    cy.get('select[name="to_branch_id"]').should("have.value", "");
    cy.get('textarea[name="notes"]').should("have.value", "");
  });

  // ----------------------------------------------------------
  // TEST 9: Error handling - Stok tidak cukup
  // ----------------------------------------------------------
  it("Harus menampilkan error jika stok tidak mencukupi", () => {
    // Mock data
    cy.intercept("GET", "**/api/products?branch_id=*", {
      body: {
        data: [{ id: 1, name: "Kopi Arabica", nama_produk: "Kopi Arabica", stok: 5 }],
      },
    });

    cy.intercept("GET", "**/api/branches", {
      body: [
        { id_cabang: 1, nama_cabang: "Cabang Pusat" },
        { id_cabang: 2, nama_cabang: "Cabang Jakarta" },
      ],
    });

    // Mock API error - insufficient stock
    cy.intercept("POST", "**/api/mutations", {
      statusCode: 400,
      body: {
        error: "Insufficient stock in source branch",
      },
    }).as("createMutationError");

    cy.reload();

    // Isi form dengan quantity lebih besar dari stok
    cy.get('select[name="product_id"]').select("1");
    cy.get('input[name="quantity"]').type("100");
    cy.get('select[name="to_branch_id"]').select("2");

    // Submit
    cy.contains("button", "Proses Mutasi").click();
    cy.wait("@createMutationError");

    // Verifikasi error message
    cy.contains("Insufficient stock in source branch").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 10: Riwayat mutasi - Empty state
  // ----------------------------------------------------------
  it("Harus menampilkan pesan jika belum ada riwayat mutasi", () => {
    // Mock mutations kosong
    cy.intercept("GET", "**/api/mutations?branch_id=*", {
      body: [],
    });

    cy.reload();

    // Verifikasi pesan empty state
    cy.contains("Belum ada riwayat mutasi.").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 11: Riwayat mutasi - Tampilkan list mutasi
  // ----------------------------------------------------------
  it("Harus menampilkan list riwayat mutasi dengan benar", () => {
    // Mock mutations
    cy.intercept("GET", "**/api/mutations?branch_id=1", {
      body: [
        {
          id_mutasi: 1,
          from_branch_id: 1,
          to_branch_id: 2,
          quantity: 10,
          tanggal: "2024-01-15T10:00:00.000Z",
          product: { nama_produk: "Kopi Arabica" },
          fromBranch: { nama_cabang: "Cabang Pusat" },
          toBranch: { nama_cabang: "Cabang Jakarta" },
        },
        {
          id_mutasi: 2,
          from_branch_id: 2,
          to_branch_id: 1,
          quantity: 5,
          tanggal: "2024-01-16T14:30:00.000Z",
          product: { nama_produk: "Teh Hijau" },
          fromBranch: { nama_cabang: "Cabang Jakarta" },
          toBranch: { nama_cabang: "Cabang Pusat" },
        },
      ],
    });

    cy.reload();

    // Verifikasi mutasi pertama (outgoing)
    cy.contains("td", "Kopi Arabica").should("be.visible");
    cy.contains("td", "Cabang Pusat").should("be.visible");
    cy.contains("td", "Cabang Jakarta").should("be.visible");
    cy.contains("span", "-10").should("be.visible"); // Outgoing (minus)
    cy.contains("span", "Keluar").should("be.visible");

    // Verifikasi mutasi kedua (incoming)
    cy.contains("td", "Teh Hijau").should("be.visible");
    cy.contains("span", "+5").should("be.visible"); // Incoming (plus)
    cy.contains("span", "Masuk").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 12: Badge status - Outgoing mutation (Keluar)
  // ----------------------------------------------------------
  it("Harus menampilkan badge 'Keluar' dengan warna merah untuk outgoing mutation", () => {
    // Mock mutation keluar (from current branch)
    cy.intercept("GET", "**/api/mutations?branch_id=1", {
      body: [
        {
          id_mutasi: 1,
          from_branch_id: 1, // Same as selected branch
          to_branch_id: 2,
          quantity: 10,
          tanggal: new Date().toISOString(),
          product: { nama_produk: "Produk Test" },
          fromBranch: { nama_cabang: "Cabang Pusat" },
          toBranch: { nama_cabang: "Cabang Jakarta" },
        },
      ],
    });

    cy.reload();

    // Verifikasi badge Keluar dengan styling merah
    cy.contains("span", "Keluar")
      .should("be.visible")
      .should("have.class", "text-rose-600")
      .should("have.class", "bg-rose-100");

    // Verifikasi quantity dengan minus dan warna merah
    cy.contains("span", "-10")
      .should("be.visible")
      .should("have.class", "text-rose-500");
  });

  // ----------------------------------------------------------
  // TEST 13: Badge status - Incoming mutation (Masuk)
  // ----------------------------------------------------------
  it("Harus menampilkan badge 'Masuk' dengan warna hijau untuk incoming mutation", () => {
    // Mock mutation masuk (to current branch)
    cy.intercept("GET", "**/api/mutations?branch_id=1", {
      body: [
        {
          id_mutasi: 1,
          from_branch_id: 2,
          to_branch_id: 1, // Same as selected branch
          quantity: 15,
          tanggal: new Date().toISOString(),
          product: { nama_produk: "Produk Test" },
          fromBranch: { nama_cabang: "Cabang Jakarta" },
          toBranch: { nama_cabang: "Cabang Pusat" },
        },
      ],
    });

    cy.reload();

    // Verifikasi badge Masuk dengan styling hijau
    cy.contains("span", "Masuk")
      .should("be.visible")
      .should("have.class", "text-emerald-600")
      .should("have.class", "bg-emerald-100");

    // Verifikasi quantity dengan plus dan warna hijau
    cy.contains("span", "+15")
      .should("be.visible")
      .should("have.class", "text-emerald-500");
  });

  // ----------------------------------------------------------
  // TEST 14: Format tanggal Indonesia
  // ----------------------------------------------------------
  it("Harus menampilkan tanggal dalam format Indonesia", () => {
    // Mock mutation dengan tanggal tertentu
    cy.intercept("GET", "**/api/mutations?branch_id=*", {
      body: [
        {
          id_mutasi: 1,
          from_branch_id: 1,
          to_branch_id: 2,
          quantity: 10,
          tanggal: "2024-01-15T10:00:00.000Z",
          product: { nama_produk: "Produk Test" },
          fromBranch: { nama_cabang: "Cabang A" },
          toBranch: { nama_cabang: "Cabang B" },
        },
      ],
    });

    cy.reload();

    // Verifikasi format tanggal Indonesia (dd/mm/yyyy)
    cy.get("tbody tr td").first().should("contain", "/01/2024");
  });

  // ----------------------------------------------------------
  // TEST 15: Loading state saat submit
  // ----------------------------------------------------------
  it("Harus menampilkan loading state saat submit mutasi", () => {
    // Mock data
    cy.intercept("GET", "**/api/products?branch_id=*", {
      body: {
        data: [{ id: 1, name: "Produk Test", nama_produk: "Produk Test" }],
      },
    });

    cy.intercept("GET", "**/api/branches", {
      body: [
        { id_cabang: 1, nama_cabang: "Cabang Pusat" },
        { id_cabang: 2, nama_cabang: "Cabang Jakarta" },
      ],
    });

    // Mock API dengan delay
    cy.intercept("POST", "**/api/mutations", (req) => {
      req.reply((res) => {
        res.setDelay(2000);
        res.send({ statusCode: 201, body: { message: "Success" } });
      });
    }).as("createMutation");

    cy.reload();

    // Isi form
    cy.get('select[name="product_id"]').select("1");
    cy.get('input[name="quantity"]').type("5");
    cy.get('select[name="to_branch_id"]').select("2");

    // Submit
    cy.contains("button", "Proses Mutasi").click();

    // Verifikasi loading text
    cy.contains("button", "Memproses...").should("be.visible");
    cy.contains("button", "Memproses...").should("be.disabled");

    cy.wait("@createMutation");

    // Verifikasi loading hilang
    cy.contains("button", "Proses Mutasi").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 16: Loading state saat load products
  // ----------------------------------------------------------
  it("Harus menampilkan loading state saat memuat produk", () => {
    // Mock API dengan delay
    cy.intercept("GET", "**/api/products?branch_id=*", (req) => {
      req.reply((res) => {
        res.setDelay(1000);
        res.send({ body: { data: [] } });
      });
    }).as("getProducts");

    cy.reload();

    // Verifikasi loading di dropdown
    cy.get('select[name="product_id"]').within(() => {
      cy.contains("option", "Memuat...").should("be.visible");
    });

    cy.wait("@getProducts");
  });

  // ----------------------------------------------------------
  // TEST 17: Optional notes field
  // ----------------------------------------------------------
  it("Harus bisa submit mutasi tanpa mengisi catatan (optional)", () => {
    // Mock data
    cy.intercept("GET", "**/api/products?branch_id=*", {
      body: {
        data: [{ id: 1, name: "Produk Test", nama_produk: "Produk Test" }],
      },
    });

    cy.intercept("GET", "**/api/branches", {
      body: [
        { id_cabang: 1, nama_cabang: "Cabang Pusat" },
        { id_cabang: 2, nama_cabang: "Cabang Jakarta" },
      ],
    });

    cy.intercept("POST", "**/api/mutations", {
      statusCode: 201,
      body: { message: "Success" },
    }).as("createMutation");

    cy.intercept("GET", "**/api/mutations?branch_id=*", { body: [] });

    cy.reload();

    // Isi form tanpa catatan
    cy.get('select[name="product_id"]').select("1");
    cy.get('input[name="quantity"]').type("5");
    cy.get('select[name="to_branch_id"]').select("2");
    // Tidak isi notes

    // Submit harus berhasil
    cy.contains("button", "Proses Mutasi").click();
    cy.wait("@createMutation");

    // Verifikasi request body notes kosong atau empty string
    cy.get("@createMutation")
      .its("request.body")
      .should("have.property", "notes")
      .should("be.oneOf", ["", undefined]);

    // Verifikasi success message
    cy.contains("Mutasi stok berhasil diproses!").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 18: Error handling - Network error
  // ----------------------------------------------------------
  it("Harus menampilkan error jika terjadi network error", () => {
    // Mock data
    cy.intercept("GET", "**/api/products?branch_id=*", {
      body: {
        data: [{ id: 1, name: "Produk Test", nama_produk: "Produk Test" }],
      },
    });

    cy.intercept("GET", "**/api/branches", {
      body: [
        { id_cabang: 1, nama_cabang: "Cabang Pusat" },
        { id_cabang: 2, nama_cabang: "Cabang Jakarta" },
      ],
    });

    // Mock network error
    cy.intercept("POST", "**/api/mutations", {
      forceNetworkError: true,
    }).as("createMutationError");

    cy.reload();

    // Isi form
    cy.get('select[name="product_id"]').select("1");
    cy.get('input[name="quantity"]').type("5");
    cy.get('select[name="to_branch_id"]').select("2");

    // Submit
    cy.contains("button", "Proses Mutasi").click();

    // Verifikasi error message muncul
    cy.contains("error|").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 19: ACID Transaction - Verify request payload
  // ----------------------------------------------------------
  it("Harus mengirim payload dengan struktur yang benar untuk ACID transaction", () => {
    // Mock data
    cy.intercept("GET", "**/api/products?branch_id=*", {
      body: {
        data: [{ id: 1, name: "Kopi Arabica", nama_produk: "Kopi Arabica" }],
      },
    });

    cy.intercept("GET", "**/api/branches", {
      body: [
        { id_cabang: 1, nama_cabang: "Cabang Pusat" },
        { id_cabang: 2, nama_cabang: "Cabang Jakarta" },
      ],
    });

    cy.intercept("POST", "**/api/mutations", {
      statusCode: 201,
      body: { message: "Success" },
    }).as("createMutation");

    cy.intercept("GET", "**/api/mutations?branch_id=*", { body: [] });

    cy.reload();

    // Isi form
    cy.get('select[name="product_id"]').select("1");
    cy.get('input[name="quantity"]').type("20");
    cy.get('select[name="to_branch_id"]').select("2");
    cy.get('textarea[name="notes"]').type("Transfer untuk promo akhir tahun");

    // Submit
    cy.contains("button", "Proses Mutasi").click();
    cy.wait("@createMutation");

    // Verifikasi request payload structure
    cy.get("@createMutation")
      .its("request.body")
      .should("deep.equal", {
        product_id: 1,
        from_branch_id: 1,
        to_branch_id: 2,
        quantity: 20,
        notes: "Transfer untuk promo akhir tahun",
      });
  });

  // ----------------------------------------------------------
  // TEST 20: Event dispatching - Stock mutation updated
  // ----------------------------------------------------------
  it("Harus dispatch event 'stock-mutation-updated' setelah mutasi berhasil", () => {
    // Mock data
    cy.intercept("GET", "**/api/products?branch_id=*", {
      body: {
        data: [{ id: 1, name: "Produk Test", nama_produk: "Produk Test" }],
      },
    });

    cy.intercept("GET", "**/api/branches", {
      body: [
        { id_cabang: 1, nama_cabang: "Cabang Pusat" },
        { id_cabang: 2, nama_cabang: "Cabang Jakarta" },
      ],
    });

    cy.intercept("POST", "**/api/mutations", {
      statusCode: 201,
      body: { message: "Success" },
    }).as("createMutation");

    cy.intercept("GET", "**/api/mutations?branch_id=*", { body: [] });

    cy.reload();

    // Spy on window event
    cy.window().then((win) => {
      cy.spy(win, "dispatchEvent").as("dispatchEvent");
    });

    // Isi form
    cy.get('select[name="product_id"]').select("1");
    cy.get('input[name="quantity"]').type("5");
    cy.get('select[name="to_branch_id"]').select("2");

    // Submit
    cy.contains("button", "Proses Mutasi").click();
    cy.wait("@createMutation");

    // Verifikasi event dispatched
    cy.get("@dispatchEvent").should("have.been.called");
  });

  // ----------------------------------------------------------
  // TEST 21: FULL FLOW - Complete mutation cycle
  // ----------------------------------------------------------
  it("FULL FLOW: Create mutation → View in history → Verify status", () => {
    // Setup mocks
    cy.intercept("GET", "**/api/products?branch_id=*", {
      body: {
        data: [
          { id: 1, name: "Kopi Arabica", nama_produk: "Kopi Arabica", stok: 100 },
        ],
      },
    });

    cy.intercept("GET", "**/api/branches", {
      body: [
        { id_cabang: 1, nama_cabang: "Cabang Pusat" },
        { id_cabang: 2, nama_cabang: "Cabang Jakarta" },
      ],
    });

    // 1. Initial state - no mutations
    cy.intercept("GET", "**/api/mutations?branch_id=1", {
      body: [],
    }).as("getMutationsEmpty");

    cy.reload();
    cy.wait("@getMutationsEmpty");

    // Verifikasi empty state
    cy.contains("Belum ada riwayat mutasi.").should("be.visible");

    // 2. Create mutation
    cy.intercept("POST", "**/api/mutations", {
      statusCode: 201,
      body: {
        message: "Stock mutation successful",
        data: {
          id_mutasi: 1,
          product_id: 1,
          from_branch_id: 1,
          to_branch_id: 2,
          quantity: 25,
          notes: "Full flow test",
        },
      },
    }).as("createMutation");

    // Mock after create - mutation appears in history
    cy.intercept("GET", "**/api/mutations?branch_id=1", {
      body: [
        {
          id_mutasi: 1,
          from_branch_id: 1,
          to_branch_id: 2,
          quantity: 25,
          tanggal: new Date().toISOString(),
          product: { nama_produk: "Kopi Arabica" },
          fromBranch: { nama_cabang: "Cabang Pusat" },
          toBranch: { nama_cabang: "Cabang Jakarta" },
        },
      ],
    }).as("getMutationsWithData");

    // Isi form dan submit
    cy.get('select[name="product_id"]').select("1");
    cy.get('input[name="quantity"]').type("25");
    cy.get('select[name="to_branch_id"]').select("2");
    cy.get('textarea[name="notes"]').type("Full flow test");

    cy.contains("button", "Proses Mutasi").click();
    cy.wait("@createMutation");

    // 3. Verify success message
    cy.contains("Mutasi stok berhasil diproses!").should("be.visible");

    // 4. Verify mutation appears in history
    cy.wait("@getMutationsWithData");

    cy.contains("td", "Kopi Arabica").should("be.visible");
    cy.contains("td", "Cabang Pusat").should("be.visible");
    cy.contains("td", "Cabang Jakarta").should("be.visible");
    cy.contains("span", "-25").should("be.visible");
    cy.contains("span", "Keluar").should("be.visible");

    // 5. Verify form reset
    cy.get('select[name="product_id"]').should("have.value", "");
    cy.get('input[name="quantity"]').should("have.value", "");
    cy.get('select[name="to_branch_id"]').should("have.value", "");
    cy.get('textarea[name="notes"]').should("have.value", "");
  });

  // ----------------------------------------------------------
  // TEST 22: Multiple mutations in history
  // ----------------------------------------------------------
  it("Harus menampilkan multiple mutations dengan status yang berbeda", () => {
    // Mock multiple mutations (incoming & outgoing)
    cy.intercept("GET", "**/api/mutations?branch_id=1", {
      body: [
        {
          id_mutasi: 1,
          from_branch_id: 1,
          to_branch_id: 2,
          quantity: 10,
          tanggal: "2024-01-10T10:00:00.000Z",
          product: { nama_produk: "Kopi Arabica" },
          fromBranch: { nama_cabang: "Cabang Pusat" },
          toBranch: { nama_cabang: "Cabang Jakarta" },
        },
        {
          id_mutasi: 2,
          from_branch_id: 3,
          to_branch_id: 1,
          quantity: 15,
          tanggal: "2024-01-11T14:00:00.000Z",
          product: { nama_produk: "Teh Hijau" },
          fromBranch: { nama_cabang: "Cabang Bandung" },
          toBranch: { nama_cabang: "Cabang Pusat" },
        },
        {
          id_mutasi: 3,
          from_branch_id: 1,
          to_branch_id: 3,
          quantity: 20,
          tanggal: "2024-01-12T09:00:00.000Z",
          product: { nama_produk: "Gula Aren" },
          fromBranch: { nama_cabang: "Cabang Pusat" },
          toBranch: { nama_cabang: "Cabang Bandung" },
        },
      ],
    });

    cy.reload();

    // Verifikasi 3 mutations muncul
    cy.get("tbody tr").should("have.length", 3);

    // Verifikasi mutation 1 - Outgoing
    cy.contains("tr", "Kopi Arabica").within(() => {
      cy.contains("span", "-10").should("have.class", "text-rose-500");
      cy.contains("span", "Keluar").should("have.class", "text-rose-600");
    });

    // Verifikasi mutation 2 - Incoming
    cy.contains("tr", "Teh Hijau").within(() => {
      cy.contains("span", "+15").should("have.class", "text-emerald-500");
      cy.contains("span", "Masuk").should("have.class", "text-emerald-600");
    });

    // Verifikasi mutation 3 - Outgoing
    cy.contains("tr", "Gula Aren").within(() => {
      cy.contains("span", "-20").should("have.class", "text-rose-500");
      cy.contains("span", "Keluar").should("have.class", "text-rose-600");
    });
  });

  // ----------------------------------------------------------
  // TEST 23: Disabled state - Form disabled saat loading products
  // ----------------------------------------------------------
  it("Harus disable tombol submit saat loading products", () => {
    // Mock API dengan delay
    cy.intercept("GET", "**/api/products?branch_id=*", (req) => {
      req.reply((res) => {
        res.setDelay(2000);
        res.send({ body: { data: [] } });
      });
    }).as("getProducts");

    cy.reload();

    // Verifikasi tombol disabled
    cy.contains("button", "Proses Mutasi").should("be.disabled");

    cy.wait("@getProducts");

    // Verifikasi tombol enabled setelah loading
    cy.contains("button", "Proses Mutasi").should("not.be.disabled");
  });

  // ----------------------------------------------------------
  // TEST 24: Min value validation for quantity input
  // ----------------------------------------------------------
  it("Harus memiliki min=1 pada input quantity", () => {
    cy.get('input[name="quantity"]').should("have.attr", "min", "1");
  });

  // ----------------------------------------------------------
  // TEST 25: Required fields validation
  // ----------------------------------------------------------
  it("Harus memiliki attribute required pada field wajib", () => {
    // Verifikasi required attributes
    cy.get('select[name="product_id"]').should("have.attr", "required");
    cy.get('input[name="quantity"]').should("have.attr", "required");
    cy.get('select[name="to_branch_id"]').should("have.attr", "required");

    // Verifikasi notes tidak required (optional)
    cy.get('textarea[name="notes"]').should("not.have.attr", "required");
  });
});
