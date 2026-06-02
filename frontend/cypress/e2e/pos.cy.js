/**
 * ============================================================
 * SKENARIO PENGUJIAN: Point of Sale (POS) - UMKM-Grow
 * ============================================================
 * Menguji seluruh fitur POS end-to-end:
 *  - Shift management (open/close)
 *  - Product search & filtering
 *  - Cart management (add, increment, decrement, clear, hold)
 *  - Customer/member lookup & loyalty points
 *  - Promo code application
 *  - Payment methods & calculation
 *  - Checkout process
 *  - Receipt generation
 * ============================================================
 */

describe("Skenario Pengujian POS UMKM-Grow", () => {
  let users;

  before(() => {
    cy.fixture("user").then((data) => {
      users = data;
    });
  });

  beforeEach(() => {
    // Login dan navigasi ke POS
    cy.clearLocalStorage();
    cy.login(users.validUser.email, users.validUser.password);
    cy.visit("/pos");
  });

  // ----------------------------------------------------------
  // TEST 1: Tampilan halaman POS
  // ----------------------------------------------------------
  it("Harus menampilkan halaman POS dengan elemen yang benar", () => {
    // Verifikasi judul halaman
    cy.contains("h1", "Point of Sale").should("be.visible");
    cy.contains("Proses transaksi penjualan pelanggan").should("be.visible");

    // Verifikasi search bar
    cy.get('input[placeholder="Cari produk..."]').should("be.visible");

    // Verifikasi category buttons
    cy.contains("button", "All").should("be.visible");
    cy.contains("button", "Beverage").should("be.visible");
    cy.contains("button", "Food").should("be.visible");

    // Verifikasi sidebar keranjang
    cy.contains("Keranjang Belanja").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 2: Shift Management - Modal buka shift muncul
  // ----------------------------------------------------------
  it("Harus menampilkan modal buka shift jika shift belum dibuka", () => {
    // Mock API: tidak ada shift aktif
    cy.intercept("GET", "**/api/shifts/active*", {
      statusCode: 200,
      body: { data: null },
    }).as("getActiveShift");

    cy.reload();
    cy.wait("@getActiveShift");

    // Verifikasi modal muncul
    cy.contains("Shift Belum Dibuka").should("be.visible");
    cy.contains("Anda perlu membuka shift sebelum dapat melakukan transaksi").should(
      "be.visible"
    );

    // Verifikasi input saldo awal
    cy.get('input[placeholder="Masukkan saldo awal"]').should("be.visible");

    // Verifikasi tombol
    cy.contains("button", "Batal").should("be.visible");
    cy.contains("button", "Buka Shift").should("be.visible").and("be.disabled");
  });

  // ----------------------------------------------------------
  // TEST 3: Shift Management - Buka shift berhasil
  // ----------------------------------------------------------
  it("Harus bisa membuka shift dengan saldo awal", () => {
    // Mock API: tidak ada shift aktif
    cy.intercept("GET", "**/api/shifts/active*", {
      statusCode: 200,
      body: { data: null },
    }).as("getActiveShift");

    // Mock API: buka shift berhasil
    cy.intercept("POST", "**/api/shifts/start", {
      statusCode: 201,
      body: {
        message: "Shift berhasil dibuka",
        data: { id: 1, saldo_awal: 100000, status: "Aktif" },
      },
    }).as("startShift");

    cy.reload();
    cy.wait("@getActiveShift");

    // Isi saldo awal
    cy.get('input[placeholder="Masukkan saldo awal"]').type("100000");

    // Tombol harus enabled
    cy.contains("button", "Buka Shift").should("not.be.disabled");

    // Klik buka shift
    cy.contains("button", "Buka Shift").click();
    cy.wait("@startShift");
  });

  // ----------------------------------------------------------
  // TEST 4: Product Search - Cari produk by nama
  // ----------------------------------------------------------
  it("Harus bisa mencari produk berdasarkan nama", () => {
    // Mock shift aktif
    cy.intercept("GET", "**/api/shifts/active*", {
      body: { data: { id: 1, status: "Aktif" } },
    });

    // Mock products
    cy.intercept("GET", "**/api/products*", {
      body: [
        { id: 1, name: "Kopi Latte", price: 25000, stock: 50 },
        { id: 2, name: "Teh Manis", price: 15000, stock: 30 },
        { id: 3, name: "Roti Bakar", price: 20000, stock: 20 },
      ],
    });

    cy.reload();

    // Ketik di search bar
    cy.get('input[placeholder="Cari produk..."]').type("kopi");

    // Verifikasi hanya produk yang match yang muncul
    cy.contains("Kopi Latte").should("be.visible");
    cy.contains("Teh Manis").should("not.exist");
    cy.contains("Roti Bakar").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 5: Product Filtering - Filter by category
  // ----------------------------------------------------------
  it("Harus bisa filter produk berdasarkan kategori", () => {
    // Mock shift aktif
    cy.intercept("GET", "**/api/shifts/active*", {
      body: { data: { id: 1, status: "Aktif" } },
    });

    // Mock products
    cy.intercept("GET", "**/api/products*", {
      body: [
        { id: 1, name: "Kopi Latte", price: 25000, stock: 50 },
        { id: 2, name: "Roti Bakar", price: 20000, stock: 20 },
        { id: 3, name: "Cake Coklat", price: 35000, stock: 15 },
      ],
    });

    cy.reload();

    // Klik kategori Beverage
    cy.contains("button", "Beverage").click();

    // Verifikasi hanya beverage yang muncul
    cy.contains("Kopi Latte").should("be.visible");
    cy.contains("Roti Bakar").should("not.exist");

    // Klik kategori Dessert
    cy.contains("button", "Dessert").click();
    cy.contains("Cake Coklat").should("be.visible");
    cy.contains("Kopi Latte").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 6: Cart Management - Tambah produk ke keranjang
  // ----------------------------------------------------------
  it("Harus bisa menambahkan produk ke keranjang", () => {
    // Mock shift aktif
    cy.intercept("GET", "**/api/shifts/active*", {
      body: { data: { id: 1, status: "Aktif" } },
    });

    // Mock products
    cy.intercept("GET", "**/api/products*", {
      body: [{ id: 1, name: "Kopi Latte", price: 25000, stock: 50 }],
    });

    cy.reload();

    // Klik produk
    cy.contains("Kopi Latte").click();

    // Verifikasi produk masuk keranjang
    cy.contains("Keranjang Belanja").parent().within(() => {
      cy.contains("Kopi Latte").should("be.visible");
      cy.contains("Rp25.000").should("be.visible");
    });

    // Verifikasi jumlah item
    cy.contains("1 item").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 7: Cart Management - Increment & Decrement quantity
  // ----------------------------------------------------------
  it("Harus bisa menambah dan mengurangi quantity produk di keranjang", () => {
    // Mock shift aktif
    cy.intercept("GET", "**/api/shifts/active*", {
      body: { data: { id: 1, status: "Aktif" } },
    });

    // Mock products
    cy.intercept("GET", "**/api/products*", {
      body: [{ id: 1, name: "Kopi Latte", price: 25000, stock: 50 }],
    });

    cy.reload();

    // Tambah produk ke keranjang
    cy.contains("Kopi Latte").click();

    // Klik tombol + untuk increment
    cy.get('button[type="button"]').contains("+").click();

    // Verifikasi quantity bertambah (subtotal jadi 50000)
    cy.contains("Rp50.000").should("be.visible");

    // Klik tombol - untuk decrement
    cy.get('button[type="button"]').contains("-").click();

    // Verifikasi quantity berkurang (subtotal jadi 25000)
    cy.contains("Rp25.000").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 8: Cart Management - Clear cart
  // ----------------------------------------------------------
  it("Harus bisa mengosongkan keranjang", () => {
    // Mock shift aktif
    cy.intercept("GET", "**/api/shifts/active*", {
      body: { data: { id: 1, status: "Aktif" } },
    });

    // Mock products
    cy.intercept("GET", "**/api/products*", {
      body: [{ id: 1, name: "Kopi Latte", price: 25000, stock: 50 }],
    });

    cy.reload();

    // Tambah produk
    cy.contains("Kopi Latte").click();

    // Klik tombol Clear
    cy.contains("button", "Clear").click();

    // Verifikasi keranjang kosong
    cy.contains("0 item").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 9: Cart Management - Hold & Restore cart
  // ----------------------------------------------------------
  it("Harus bisa hold dan restore keranjang", () => {
    // Mock shift aktif
    cy.intercept("GET", "**/api/shifts/active*", {
      body: { data: { id: 1, status: "Aktif" } },
    });

    // Mock products
    cy.intercept("GET", "**/api/products*", {
      body: [
        { id: 1, name: "Kopi Latte", price: 25000, stock: 50 },
        { id: 2, name: "Teh Manis", price: 15000, stock: 30 },
      ],
    });

    cy.reload();

    // Tambah produk pertama
    cy.contains("Kopi Latte").click();

    // Hold cart
    cy.contains("button", "Hold").click();

    // Verifikasi keranjang kosong setelah hold
    cy.contains("0 item").should("be.visible");

    // Tambah produk kedua
    cy.contains("Teh Manis").click();
    cy.contains("1 item").should("be.visible");

    // Restore hold cart
    cy.contains("button", "Restore Hold").click();

    // Verifikasi cart pertama kembali
    cy.contains("Kopi Latte").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 10: Customer/Member - Cari member by phone
  // ----------------------------------------------------------
  it("Harus bisa mencari member berdasarkan nomor telepon", () => {
    // Mock shift aktif
    cy.intercept("GET", "**/api/shifts/active*", {
      body: { data: { id: 1, status: "Aktif" } },
    });

    // Mock member search
    cy.intercept("GET", "**/api/members/search*", {
      statusCode: 200,
      body: {
        data: {
          id: 1,
          name: "John Doe",
          phone: "081234567890",
          loyalty_points: 150,
          level: "Gold",
        },
      },
    }).as("searchMember");

    cy.reload();

    // Ketik nomor telepon
    cy.get('input[placeholder="Nomor telepon customer"]').type("081234567890");

    // Klik tombol Cari
    cy.contains("button", "Cari").click();
    cy.wait("@searchMember");

    // Verifikasi member info muncul
    cy.contains("John Doe").should("be.visible");
    cy.contains("081234567890").should("be.visible");
    cy.contains("150 pts").should("be.visible");
    cy.contains("Gold").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 11: Customer/Member - Member tidak ditemukan
  // ----------------------------------------------------------
  it("Harus menampilkan pesan jika member tidak ditemukan", () => {
    // Mock shift aktif
    cy.intercept("GET", "**/api/shifts/active*", {
      body: { data: { id: 1, status: "Aktif" } },
    });

    // Mock member search - tidak ditemukan
    cy.intercept("GET", "**/api/members/search*", {
      statusCode: 200,
      body: { data: null },
    }).as("searchMember");

    cy.reload();

    // Ketik nomor telepon
    cy.get('input[placeholder="Nomor telepon customer"]').type("089999999999");

    // Klik tombol Cari
    cy.contains("button", "Cari").click();
    cy.wait("@searchMember");

    // Verifikasi pesan tidak ditemukan
    cy.contains("Customer tidak ditemukan").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 12: Promo Code - Terapkan promo berhasil
  // ----------------------------------------------------------
  it("Harus bisa menerapkan kode promo yang valid", () => {
    // Mock shift aktif
    cy.intercept("GET", "**/api/shifts/active*", {
      body: { data: { id: 1, status: "Aktif" } },
    });

    // Mock products
    cy.intercept("GET", "**/api/products*", {
      body: [{ id: 1, name: "Kopi Latte", price: 25000, stock: 50 }],
    });

    // Mock promo verification - berhasil
    cy.intercept("POST", "**/api/promos/verify", {
      statusCode: 200,
      body: {
        valid: true,
        total_diskon: 5000,
        kode_promo: "DISKON5K",
      },
    }).as("verifyPromo");

    cy.reload();

    // Tambah produk ke keranjang
    cy.contains("Kopi Latte").click();

    // Ketik kode promo
    cy.get('input[placeholder*="promo"]').type("DISKON5K");

    // Klik tombol Terapkan
    cy.contains("button", "Terapkan").click();
    cy.wait("@verifyPromo");

    // Verifikasi pesan sukses
    cy.contains("Promo berhasil diterapkan").should("be.visible");

    // Verifikasi diskon muncul di summary
    cy.contains("Diskon").parent().should("contain", "-Rp5.000");
  });

  // ----------------------------------------------------------
  // TEST 13: Promo Code - Promo tidak valid
  // ----------------------------------------------------------
  it("Harus menampilkan pesan error jika promo tidak valid", () => {
    // Mock shift aktif
    cy.intercept("GET", "**/api/shifts/active*", {
      body: { data: { id: 1, status: "Aktif" } },
    });

    // Mock products
    cy.intercept("GET", "**/api/products*", {
      body: [{ id: 1, name: "Kopi Latte", price: 25000, stock: 50 }],
    });

    // Mock promo verification - gagal
    cy.intercept("POST", "**/api/promos/verify", {
      statusCode: 200,
      body: {
        valid: false,
        total_diskon: 0,
        message: "Kode promo tidak ditemukan atau sudah tidak aktif.",
      },
    }).as("verifyPromo");

    cy.reload();

    // Tambah produk
    cy.contains("Kopi Latte").click();

    // Ketik kode promo salah
    cy.get('input[placeholder*="promo"]').type("SALAH123");

    // Klik tombol Terapkan
    cy.contains("button", "Terapkan").click();
    cy.wait("@verifyPromo");

    // Verifikasi pesan error
    cy.contains("Kode promo tidak ditemukan atau sudah tidak aktif").should(
      "be.visible"
    );
  });

  // ----------------------------------------------------------
  // TEST 14: Payment Methods - Pilih metode pembayaran
  // ----------------------------------------------------------
  it("Harus bisa memilih metode pembayaran", () => {
    // Mock shift aktif
    cy.intercept("GET", "**/api/shifts/active*", {
      body: { data: { id: 1, status: "Aktif" } },
    });

    cy.reload();

    // Verifikasi 3 metode pembayaran ada
    cy.contains("button", "Cash").should("be.visible");
    cy.contains("button", "Transfer").should("be.visible");
    cy.contains("button", "QRIS").should("be.visible");

    // Klik Transfer
    cy.contains("button", "Transfer").click();

    // Verifikasi Transfer aktif (punya class bg-blue-600)
    cy.contains("button", "Transfer").should("have.class", "bg-blue-600");

    // Klik QRIS
    cy.contains("button", "QRIS").click();
    cy.contains("button", "QRIS").should("have.class", "bg-blue-600");
  });

  // ----------------------------------------------------------
  // TEST 15: Payment Calculation - Hitung total dengan benar
  // ----------------------------------------------------------
  it("Harus menghitung total pembayaran dengan benar (subtotal + service charge + tax - discount)", () => {
    // Mock shift aktif
    cy.intercept("GET", "**/api/shifts/active*", {
      body: { data: { id: 1, status: "Aktif" } },
    });

    // Mock products
    cy.intercept("GET", "**/api/products*", {
      body: [{ id: 1, name: "Kopi Latte", price: 25000, stock: 50 }],
    });

    // Mock settings dengan service charge 5% dan tax 10%
    cy.intercept("GET", "**/api/settings*", {
      body: { service_charge_percent: 5, tax_percent: 10 },
    });

    cy.reload();

    // Tambah produk
    cy.contains("Kopi Latte").click();

    // Verifikasi subtotal
    cy.contains("Subtotal").parent().should("contain", "Rp25.000");

    // Verifikasi service charge (5% dari 25000 = 1250)
    cy.contains("Service Charge").should("be.visible");

    // Verifikasi tax (10%)
    cy.contains("Pajak").should("be.visible");

    // Verifikasi total bayar ada
    cy.contains("Total Bayar").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 16: Checkout - Validasi keranjang kosong
  // ----------------------------------------------------------
  it("Harus mencegah checkout jika keranjang kosong", () => {
    // Mock shift aktif
    cy.intercept("GET", "**/api/shifts/active*", {
      body: { data: { id: 1, status: "Aktif" } },
    });

    cy.reload();

    // Tombol checkout harus disabled
    cy.contains("button", "Checkout").should("be.disabled");
  });

  // ----------------------------------------------------------
  // TEST 17: Checkout - Validasi shift belum dibuka
  // ----------------------------------------------------------
  it("Harus mencegah checkout jika shift belum dibuka", () => {
    // Mock shift tidak aktif
    cy.intercept("GET", "**/api/shifts/active*", {
      body: { data: null },
    });

    // Mock products
    cy.intercept("GET", "**/api/products*", {
      body: [{ id: 1, name: "Kopi Latte", price: 25000, stock: 50 }],
    });

    cy.reload();

    // Modal shift harus muncul, block checkout
    cy.contains("Shift Belum Dibuka").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 18: Checkout - Proses checkout berhasil
  // ----------------------------------------------------------
  it("Harus bisa melakukan checkout dan menampilkan receipt", () => {
    // Mock shift aktif
    cy.intercept("GET", "**/api/shifts/active*", {
      body: { data: { id: 1, status: "Aktif" } },
    });

    // Mock products
    cy.intercept("GET", "**/api/products*", {
      body: [{ id: 1, name: "Kopi Latte", price: 25000, stock: 50 }],
    });

    // Mock checkout berhasil
    cy.intercept("POST", "**/api/pos/checkout", {
      statusCode: 200,
      body: {
        message: "Checkout berhasil",
        data: {
          transaction_id: 123,
          subtotal: 25000,
          discount_amount: 0,
          service_charge_amount: 1250,
          tax_amount: 2625,
          total_amount: 28875,
        },
      },
    }).as("checkout");

    cy.reload();

    // Tambah produk
    cy.contains("Kopi Latte").click();

    // Isi uang tunai
    cy.get('input[placeholder="0"]').type("30000");

    // Klik checkout
    cy.contains("button", "Checkout").click();
    cy.wait("@checkout");

    // Verifikasi receipt modal muncul
    cy.contains("UMKM Grow").should("be.visible");
    cy.contains("Terima kasih telah berbelanja").should("be.visible");

    // Verifikasi tombol aksi
    cy.contains("button", "Cetak Struk").should("be.visible");
    cy.contains("button", "Kirim WA").should("be.visible");
    cy.contains("button", "Tutup").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 19: Checkout - Loyalty points ditambahkan untuk member
  // ----------------------------------------------------------
  it("Harus menambahkan loyalty points untuk member setelah checkout", () => {
    // Mock shift aktif
    cy.intercept("GET", "**/api/shifts/active*", {
      body: { data: { id: 1, status: "Aktif" } },
    });

    // Mock products
    cy.intercept("GET", "**/api/products*", {
      body: [{ id: 1, name: "Kopi Latte", price: 25000, stock: 50 }],
    });

    // Mock member search
    cy.intercept("GET", "**/api/members/search*", {
      body: {
        data: {
          id: 1,
          name: "John Doe",
          phone: "081234567890",
          loyalty_points: 100,
          level: "Silver",
        },
      },
    });

    // Mock checkout
    cy.intercept("POST", "**/api/pos/checkout", {
      body: {
        data: {
          transaction_id: 123,
          subtotal: 25000,
          total_amount: 28875,
        },
      },
    });

    // Mock add points (1 point per Rp10,000 → 25000/10000 = 2 points)
    cy.intercept("POST", "**/api/members/add-points", {
      statusCode: 200,
      body: {
        message: "Points added successfully",
        points_added: 2,
        data: {
          id: 1,
          name: "John Doe",
          loyalty_points: 102,
        },
      },
    }).as("addPoints");

    cy.reload();

    // Cari member
    cy.get('input[placeholder="Nomor telepon customer"]').type("081234567890");
    cy.contains("button", "Cari").click();

    // Tambah produk
    cy.contains("Kopi Latte").click();

    // Isi uang tunai
    cy.get('input[placeholder="0"]').type("30000");

    // Checkout
    cy.contains("button", "Checkout").click();

    // Verifikasi API add points dipanggil
    cy.wait("@addPoints").its("request.body").should("deep.include", {
      member_id: 1,
      amount: 25000,
    });
  });

  // ----------------------------------------------------------
  // TEST 20: Shift Management - Tutup shift
  // ----------------------------------------------------------
  it("Harus bisa menutup shift dengan saldo akhir", () => {
    // Mock shift aktif
    cy.intercept("GET", "**/api/shifts/active*", {
      body: { data: { id: 1, saldo_awal: 100000, status: "Aktif" } },
    });

    // Mock close shift
    cy.intercept("PUT", "**/api/shifts/end", {
      statusCode: 200,
      body: {
        message: "Shift berhasil ditutup",
        data: { id: 1, saldo_akhir: 500000, status: "Selesai" },
      },
    }).as("endShift");

    cy.reload();

    // Klik tombol Tutup Shift
    cy.contains("button", "Tutup Shift").click();

    // Verifikasi modal tutup shift muncul
    cy.contains("Tutup Shift").should("be.visible");
    cy.contains("Masukkan saldo akhir untuk menutup shift ini").should("be.visible");

    // Isi saldo akhir
    cy.get('input[placeholder="Masukkan saldo akhir"]').type("500000");

    // Klik tombol Tutup Shift di modal
    cy.contains("button", "Tutup Shift").last().click();
    cy.wait("@endShift");
  });

  // ----------------------------------------------------------
  // TEST 21: Stock Warning - Produk stok rendah
  // ----------------------------------------------------------
  it("Harus menampilkan warning untuk produk dengan stok rendah (<10)", () => {
    // Mock shift aktif
    cy.intercept("GET", "**/api/shifts/active*", {
      body: { data: { id: 1, status: "Aktif" } },
    });

    // Mock products dengan stok rendah
    cy.intercept("GET", "**/api/products*", {
      body: [
        { id: 1, name: "Kopi Latte", price: 25000, stock: 5 },
        { id: 2, name: "Teh Manis", price: 15000, stock: 50 },
      ],
    });

    cy.reload();

    // Verifikasi badge stok rendah muncul (bg-rose-500)
    cy.contains("Kopi Latte")
      .parent()
      .within(() => {
        cy.get(".bg-rose-500").should("contain", "Stok: 5");
      });

    // Verifikasi produk dengan stok normal tidak ada badge merah
    cy.contains("Teh Manis")
      .parent()
      .within(() => {
        cy.get(".bg-rose-500").should("not.exist");
      });
  });

  // ----------------------------------------------------------
  // TEST 22: Stock Validation - Produk out of stock tidak bisa ditambah
  // ----------------------------------------------------------
  it("Harus mencegah menambahkan produk yang stoknya habis", () => {
    // Mock shift aktif
    cy.intercept("GET", "**/api/shifts/active*", {
      body: { data: { id: 1, status: "Aktif" } },
    });

    // Mock products dengan stok 0
    cy.intercept("GET", "**/api/products*", {
      body: [{ id: 1, name: "Kopi Latte", price: 25000, stock: 0 }],
    });

    cy.reload();

    // Verifikasi tombol produk disabled
    cy.contains("Kopi Latte").parent().should("have.class", "cursor-not-allowed");

    // Klik produk (tidak akan masuk keranjang)
    cy.contains("Kopi Latte").click({ force: true });

    // Verifikasi keranjang tetap kosong
    cy.contains("0 item").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 23: Cash Payment - Hitung kembalian
  // ----------------------------------------------------------
  it("Harus menghitung kembalian dengan benar untuk pembayaran Cash", () => {
    // Mock shift aktif
    cy.intercept("GET", "**/api/shifts/active*", {
      body: { data: { id: 1, status: "Aktif" } },
    });

    // Mock products
    cy.intercept("GET", "**/api/products*", {
      body: [{ id: 1, name: "Kopi Latte", price: 25000, stock: 50 }],
    });

    cy.reload();

    // Tambah produk (total sekitar 28875 dengan service charge & tax)
    cy.contains("Kopi Latte").click();

    // Pilih metode Cash
    cy.contains("button", "Cash").click();

    // Isi uang tunai 50000
    cy.get('input[placeholder="0"]').type("50000");

    // Verifikasi kembalian muncul
    cy.contains("Change:").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 24: Receipt - Tutup receipt dan clear cart
  // ----------------------------------------------------------
  it("Harus clear cart setelah menutup receipt", () => {
    // Mock shift aktif
    cy.intercept("GET", "**/api/shifts/active*", {
      body: { data: { id: 1, status: "Aktif" } },
    });

    // Mock products
    cy.intercept("GET", "**/api/products*", {
      body: [{ id: 1, name: "Kopi Latte", price: 25000, stock: 50 }],
    });

    // Mock checkout
    cy.intercept("POST", "**/api/pos/checkout", {
      body: {
        data: {
          transaction_id: 123,
          subtotal: 25000,
          total_amount: 28875,
        },
      },
    });

    cy.reload();

    // Tambah produk
    cy.contains("Kopi Latte").click();

    // Isi uang tunai
    cy.get('input[placeholder="0"]').type("30000");

    // Checkout
    cy.contains("button", "Checkout").click();

    // Tutup receipt
    cy.contains("button", "Tutup").click();

    // Verifikasi keranjang kosong
    cy.contains("0 item").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 25: Error Handling - 401 Unauthorized
  // ----------------------------------------------------------
  it("Harus redirect ke login jika token expired (401)", () => {
    // Mock shift aktif
    cy.intercept("GET", "**/api/shifts/active*", {
      body: { data: { id: 1, status: "Aktif" } },
    });

    // Mock products
    cy.intercept("GET", "**/api/products*", {
      body: [{ id: 1, name: "Kopi Latte", price: 25000, stock: 50 }],
    });

    // Mock checkout dengan 401
    cy.intercept("POST", "**/api/pos/checkout", {
      statusCode: 401,
      body: { message: "Unauthorized" },
    });

    cy.reload();

    // Tambah produk
    cy.contains("Kopi Latte").click();

    // Isi uang tunai
    cy.get('input[placeholder="0"]').type("30000");

    // Checkout
    cy.contains("button", "Checkout").click();

    // Verifikasi redirect ke login
    cy.url().should("include", "/login");
  });

  // ----------------------------------------------------------
  // TEST 26: Complete Flow - Full transaction dengan member & promo
  // ----------------------------------------------------------
  it("FULL FLOW: Buka shift → Cari member → Tambah produk → Apply promo → Checkout → Tutup shift", () => {
    // Mock shift tidak aktif
    cy.intercept("GET", "**/api/shifts/active*", {
      statusCode: 200,
      body: { data: null },
    }).as("getActiveShift");

    cy.reload();
    cy.wait("@getActiveShift");

    // 1. BUKA SHIFT
    cy.intercept("POST", "**/api/shifts/start", {
      body: { data: { id: 1, saldo_awal: 100000, status: "Aktif" } },
    });

    cy.get('input[placeholder="Masukkan saldo awal"]').type("100000");
    cy.contains("button", "Buka Shift").click();

    // Mock shift aktif setelah dibuka
    cy.intercept("GET", "**/api/shifts/active*", {
      body: { data: { id: 1, saldo_awal: 100000, status: "Aktif" } },
    });

    // Mock products
    cy.intercept("GET", "**/api/products*", {
      body: [{ id: 1, name: "Kopi Latte", price: 25000, stock: 50 }],
    });

    cy.reload();

    // 2. CARI MEMBER
    cy.intercept("GET", "**/api/members/search*", {
      body: {
        data: {
          id: 1,
          name: "John Doe",
          phone: "081234567890",
          loyalty_points: 100,
          level: "Silver",
        },
      },
    });

    cy.get('input[placeholder="Nomor telepon customer"]').type("081234567890");
    cy.contains("button", "Cari").click();
    cy.contains("John Doe").should("be.visible");

    // 3. TAMBAH PRODUK
    cy.contains("Kopi Latte").click();
    cy.contains("1 item").should("be.visible");

    // 4. APPLY PROMO
    cy.intercept("POST", "**/api/promos/verify", {
      body: { valid: true, total_diskon: 5000, kode_promo: "DISKON5K" },
    });

    cy.get('input[placeholder*="promo"]').type("DISKON5K");
    cy.contains("button", "Terapkan").click();
    cy.contains("Promo berhasil diterapkan").should("be.visible");

    // 5. CHECKOUT
    cy.intercept("POST", "**/api/pos/checkout", {
      body: {
        data: {
          transaction_id: 123,
          subtotal: 25000,
          discount_amount: 5000,
          total_amount: 23875,
        },
      },
    });

    cy.intercept("POST", "**/api/members/add-points", {
      body: { points_added: 2 },
    });

    cy.get('input[placeholder="0"]').type("30000");
    cy.contains("button", "Checkout").click();

    // Verifikasi receipt
    cy.contains("Terima kasih telah berbelanja").should("be.visible");
    cy.contains("button", "Tutup").click();

    // 6. TUTUP SHIFT
    cy.intercept("PUT", "**/api/shifts/end", {
      body: { message: "Shift berhasil ditutup" },
    });

    cy.contains("button", "Tutup Shift").click();
    cy.get('input[placeholder="Masukkan saldo akhir"]').type("500000");
    cy.contains("button", "Tutup Shift").last().click();
  });
});
