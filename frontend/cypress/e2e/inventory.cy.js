/**
 * ============================================================
 * SKENARIO PENGUJIAN: Inventory Management - UMKM-Grow
 * ============================================================
 * Menguji seluruh fitur Inventory end-to-end:
 *  - CRUD Produk (Create, Read, Update, Delete)
 *  - Product variants management
 *  - Stock display & low stock alerts
 *  - Search & filter products
 *  - Form validation & error handling
 *  - Duplicate SKU detection
 * ============================================================
 */

describe("Skenario Pengujian Inventory UMKM-Grow", () => {
  let users;

  before(() => {
    cy.fixture("user").then((data) => {
      users = data;
    });
  });

  beforeEach(() => {
    // Login dan navigasi ke Inventory
    cy.clearLocalStorage();
    cy.login(users.validUser.email, users.validUser.password);
    cy.visit("/inventory");
  });

  // ----------------------------------------------------------
  // TEST 1: Tampilan halaman Inventory
  // ----------------------------------------------------------
  it("Harus menampilkan halaman Inventory dengan elemen yang benar", () => {
    // Verifikasi judul halaman
    cy.contains("h1", "Katalog Produk").should("be.visible");
    cy.contains("Kelola produk dan stok inventaris toko").should("be.visible");

    // Verifikasi tombol Tambah Produk
    cy.contains("button", "Tambah Produk").should("be.visible");

    // Verifikasi tabel header
    cy.contains("th", "Produk").should("be.visible");
    cy.contains("th", "SKU").should("be.visible");
    cy.contains("th", "Harga").should("be.visible");
    cy.contains("th", "Stok").should("be.visible");
    cy.contains("th", "Status").should("be.visible");
    cy.contains("th", "Aksi").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 2: Tampilan empty state
  // ----------------------------------------------------------
  it("Harus menampilkan pesan jika belum ada produk", () => {
    // Mock API: tidak ada produk
    cy.intercept("GET", "**/api/products*", {
      statusCode: 200,
      body: { data: [] },
    }).as("getProducts");

    cy.reload();
    cy.wait("@getProducts");

    // Verifikasi pesan empty state
    cy.contains('Belum ada produk. Klik "Tambah Produk" untuk mulai').should(
      "be.visible"
    );
  });

  // ----------------------------------------------------------
  // TEST 3: Tampilkan list produk
  // ----------------------------------------------------------
  it("Harus menampilkan daftar produk yang ada", () => {
    // Mock API dengan data produk
    cy.intercept("GET", "**/api/products*", {
      body: {
        data: [
          {
            id: 1,
            name: "Kopi Arabica",
            sku: "PRD-001",
            base_price: 50000,
            stok: 100,
            stok_minimum: 10,
            variants: [],
          },
          {
            id: 2,
            name: "Teh Hijau",
            sku: "PRD-002",
            base_price: 25000,
            stok: 5,
            stok_minimum: 10,
            variants: [],
          },
        ],
      },
    });

    cy.reload();

    // Verifikasi produk muncul di tabel
    cy.contains("td", "Kopi Arabica").should("be.visible");
    cy.contains("td", "PRD-001").should("be.visible");
    cy.contains("td", "Rp 50.000").should("be.visible");

    cy.contains("td", "Teh Hijau").should("be.visible");
    cy.contains("td", "PRD-002").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 4: Low stock alert - Badge stok rendah
  // ----------------------------------------------------------
  it("Harus menampilkan badge 'Stok Rendah' untuk produk dengan stok <= minimum", () => {
    // Mock API dengan produk stok rendah
    cy.intercept("GET", "**/api/products*", {
      body: {
        data: [
          {
            id: 1,
            name: "Produk Stok Rendah",
            sku: "LOW-001",
            base_price: 10000,
            stok: 5,
            stok_minimum: 10,
            variants: [],
          },
          {
            id: 2,
            name: "Produk Stok Aman",
            sku: "SAFE-001",
            base_price: 10000,
            stok: 50,
            stok_minimum: 10,
            variants: [],
          },
        ],
      },
    });

    cy.reload();

    // Verifikasi badge Stok Rendah
    cy.contains("Produk Stok Rendah")
      .parent()
      .within(() => {
        cy.contains("Stok Rendah").should("be.visible");
        cy.get(".text-rose-500").should("contain", "5");
      });

    // Verifikasi badge Tersedia
    cy.contains("Produk Stok Aman")
      .parent()
      .within(() => {
        cy.contains("Tersedia").should("be.visible");
      });
  });

  // ----------------------------------------------------------
  // TEST 5: CREATE - Buka modal tambah produk
  // ----------------------------------------------------------
  it("Harus membuka modal form saat klik Tambah Produk", () => {
    // Klik tombol Tambah Produk
    cy.contains("button", "Tambah Produk").click();

    // Verifikasi modal muncul
    cy.contains("Tambah Produk Baru").should("be.visible");
    cy.contains("Form Produk").should("be.visible");

    // Verifikasi form fields
    cy.get('input[placeholder="Contoh: Kopi Arabica Gayo"]').should("be.visible");
    cy.get('input[placeholder="Contoh: 1"]').should("be.visible");
    cy.get('input[placeholder="150000"]').should("be.visible");
    cy.get('input[placeholder="Contoh: PRD-001"]').should("be.visible");

    // Verifikasi tombol close
    cy.get('button[aria-label="Tutup"]').should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 6: CREATE - Tambah produk tanpa variant berhasil
  // ----------------------------------------------------------
  it("Harus bisa membuat produk baru tanpa variant", () => {
    // Mock API create berhasil
    cy.intercept("POST", "**/api/products", {
      statusCode: 201,
      body: {
        message: "Product created successfully",
        data: {
          id: 1,
          name: "Kopi Arabica Gayo",
          sku: "PRD-001",
          base_price: 50000,
          category_id: 1,
          variants: [],
        },
      },
    }).as("createProduct");

    // Mock refresh products
    cy.intercept("GET", "**/api/products*", {
      body: {
        data: [
          {
            id: 1,
            name: "Kopi Arabica Gayo",
            sku: "PRD-001",
            base_price: 50000,
            stok: 0,
            stok_minimum: 10,
          },
        ],
      },
    });

    // Buka modal
    cy.contains("button", "Tambah Produk").click();

    // Isi form
    cy.get('input[placeholder="Contoh: Kopi Arabica Gayo"]').type("Kopi Arabica Gayo");
    cy.get('input[placeholder="Contoh: 1"]').type("1");
    cy.get('input[placeholder="150000"]').type("50000");
    cy.get('input[placeholder="Contoh: PRD-001"]').type("PRD-001");

    // Submit form
    cy.contains("button", "Simpan").click();
    cy.wait("@createProduct");

    // Verifikasi modal tutup
    cy.contains("Form Produk").should("not.exist");

    // Verifikasi produk muncul di tabel
    cy.contains("Kopi Arabica Gayo").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 7: CREATE - Form validation - SKU wajib
  // ----------------------------------------------------------
  it("Harus mencegah submit jika SKU kosong", () => {
    // Buka modal
    cy.contains("button", "Tambah Produk").click();

    // Isi form tanpa SKU
    cy.get('input[placeholder="Contoh: Kopi Arabica Gayo"]').type("Produk Test");
    cy.get('input[placeholder="150000"]').type("10000");

    // Submit form (SKU required akan mencegah)
    cy.contains("button", "Simpan").click();

    // Modal tidak tutup
    cy.contains("Form Produk").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 8: CREATE - Duplicate SKU error
  // ----------------------------------------------------------
  it("Harus menampilkan error jika SKU sudah ada", () => {
    // Mock API error duplicate SKU
    cy.intercept("POST", "**/api/products", {
      statusCode: 409,
      body: {
        message: "SKU already exists in this branch",
      },
    }).as("createProductError");

    // Buka modal
    cy.contains("button", "Tambah Produk").click();

    // Isi form dengan SKU yang sudah ada
    cy.get('input[placeholder="Contoh: Kopi Arabica Gayo"]').type("Produk Duplikat");
    cy.get('input[placeholder="150000"]').type("10000");
    cy.get('input[placeholder="Contoh: PRD-001"]').type("PRD-EXIST");

    // Submit
    cy.contains("button", "Simpan").click();
    cy.wait("@createProductError");

    // Verifikasi error message muncul di halaman
    cy.contains("SKU sudah terpakai. Gunakan SKU yang berbeda").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 9: CREATE - Tambah produk dengan variants
  // ----------------------------------------------------------
  it("Harus bisa membuat produk dengan multiple variants", () => {
    // Mock API create
    cy.intercept("POST", "**/api/products", {
      statusCode: 201,
      body: {
        message: "Product created successfully",
        data: {
          id: 1,
          name: "Baju Kaos",
          sku: "CLOTH-001",
          base_price: 100000,
          variants: [
            { variant_name: "Size M - Merah", stock: 10, additional_price: 0 },
            { variant_name: "Size L - Biru", stock: 15, additional_price: 5000 },
          ],
        },
      },
    }).as("createProduct");

    cy.intercept("GET", "**/api/products*", { body: { data: [] } });

    // Buka modal
    cy.contains("button", "Tambah Produk").click();

    // Isi form basic
    cy.get('input[placeholder="Contoh: Kopi Arabica Gayo"]').type("Baju Kaos");
    cy.get('input[placeholder="150000"]').type("100000");
    cy.get('input[placeholder="Contoh: PRD-001"]').type("CLOTH-001");

    // Tambah variant pertama
    cy.contains("button", "Tambah Varian").click();
    cy.get('input[placeholder=\'Contoh: "Size L - Putih"\']').first().type("Size M - Merah");
    cy.get('input[placeholder="0"]').eq(0).type("0");
    cy.get('input[placeholder="0"]').eq(1).type("10");

    // Tambah variant kedua
    cy.contains("button", "Tambah Varian").click();
    cy.get('input[placeholder=\'Contoh: "Size L - Putih"\']').eq(1).type("Size L - Biru");
    cy.get('input[placeholder="0"]').eq(2).type("5000");
    cy.get('input[placeholder="0"]').eq(3).type("15");

    // Submit
    cy.contains("button", "Simpan").click();
    cy.wait("@createProduct");

    // Verifikasi request payload
    cy.get("@createProduct")
      .its("request.body")
      .should("deep.include", {
        name: "Baju Kaos",
        sku: "CLOTH-001",
        base_price: 100000,
      })
      .its("variants")
      .should("have.length", 2);
  });

  // ----------------------------------------------------------
  // TEST 10: Variants - Remove variant dari form
  // ----------------------------------------------------------
  it("Harus bisa menghapus variant dari form", () => {
    // Buka modal
    cy.contains("button", "Tambah Produk").click();

    // Tambah 2 variants
    cy.contains("button", "Tambah Varian").click();
    cy.contains("button", "Tambah Varian").click();

    // Verifikasi ada 2 variant form
    cy.get('input[placeholder=\'Contoh: "Size L - Putih"\']').should("have.length", 2);

    // Hapus variant pertama (klik tombol trash)
    cy.get('button[aria-label="Hapus varian"]').first().click();

    // Verifikasi tinggal 1 variant
    cy.get('input[placeholder=\'Contoh: "Size L - Putih"\']').should("have.length", 1);
  });

  // ----------------------------------------------------------
  // TEST 11: UPDATE - Buka modal edit produk
  // ----------------------------------------------------------
  it("Harus membuka modal edit saat klik tombol edit", () => {
    // Mock products
    cy.intercept("GET", "**/api/products*", {
      body: {
        data: [
          {
            id: 1,
            name: "Kopi Arabica",
            sku: "PRD-001",
            base_price: 50000,
            category_id: 1,
            stok: 100,
            stok_minimum: 10,
            variants: [],
          },
        ],
      },
    });

    cy.reload();

    // Klik tombol edit
    cy.get('button[aria-label="Edit produk"]').first().click();

    // Verifikasi modal edit muncul
    cy.contains("Edit Produk").should("be.visible");

    // Verifikasi data ter-populate
    cy.get('input[placeholder="Contoh: Kopi Arabica Gayo"]').should(
      "have.value",
      "Kopi Arabica"
    );
    cy.get('input[placeholder="Contoh: PRD-001"]').should("have.value", "PRD-001");
    cy.get('input[placeholder="150000"]').should("have.value", "50000");
    cy.get('input[placeholder="Contoh: 1"]').should("have.value", "1");
  });

  // ----------------------------------------------------------
  // TEST 12: UPDATE - Edit produk berhasil
  // ----------------------------------------------------------
  it("Harus bisa mengupdate produk yang ada", () => {
    // Mock products
    cy.intercept("GET", "**/api/products*", {
      body: {
        data: [
          {
            id: 1,
            name: "Kopi Arabica",
            sku: "PRD-001",
            base_price: 50000,
            stok: 100,
            stok_minimum: 10,
            variants: [],
          },
        ],
      },
    });

    // Mock update API
    cy.intercept("PUT", "**/api/products/1", {
      statusCode: 200,
      body: {
        message: "Product updated successfully",
        data: {
          id: 1,
          name: "Kopi Arabica Premium",
          sku: "PRD-001",
          base_price: 75000,
        },
      },
    }).as("updateProduct");

    cy.reload();

    // Klik edit
    cy.get('button[aria-label="Edit produk"]').first().click();

    // Ubah nama dan harga
    cy.get('input[placeholder="Contoh: Kopi Arabica Gayo"]')
      .clear()
      .type("Kopi Arabica Premium");
    cy.get('input[placeholder="150000"]').clear().type("75000");

    // Submit
    cy.contains("button", "Simpan").click();
    cy.wait("@updateProduct");

    // Verifikasi modal tutup
    cy.contains("Edit Produk").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 13: UPDATE - Edit variant existing product
  // ----------------------------------------------------------
  it("Harus bisa mengupdate variants produk yang sudah ada", () => {
    // Mock products dengan variants
    cy.intercept("GET", "**/api/products*", {
      body: {
        data: [
          {
            id: 1,
            name: "Baju Kaos",
            sku: "CLOTH-001",
            base_price: 100000,
            stok: 25,
            stok_minimum: 10,
            variants: [
              {
                variant_name: "Size M - Merah",
                stock: 10,
                additional_price: 0,
              },
              {
                variant_name: "Size L - Biru",
                stock: 15,
                additional_price: 5000,
              },
            ],
          },
        ],
      },
    });

    // Mock update API
    cy.intercept("PUT", "**/api/products/1", {
      statusCode: 200,
      body: {
        message: "Product updated successfully",
      },
    }).as("updateProduct");

    cy.reload();

    // Klik edit
    cy.get('button[aria-label="Edit produk"]').first().click();

    // Verifikasi variants ter-populate
    cy.get('input[placeholder=\'Contoh: "Size L - Putih"\']').should("have.length", 2);
    cy.get('input[placeholder=\'Contoh: "Size L - Putih"\']')
      .first()
      .should("have.value", "Size M - Merah");

    // Tambah variant baru
    cy.contains("button", "Tambah Varian").click();
    cy.get('input[placeholder=\'Contoh: "Size L - Putih"\']')
      .eq(2)
      .type("Size XL - Hijau");
    cy.get('input[placeholder="0"]').last().type("20");

    // Submit
    cy.contains("button", "Simpan").click();
    cy.wait("@updateProduct");

    // Verifikasi request ada 3 variants
    cy.get("@updateProduct").its("request.body.variants").should("have.length", 3);
  });

  // ----------------------------------------------------------
  // TEST 14: DELETE - Hapus produk dengan confirmation
  // ----------------------------------------------------------
  it("Harus bisa menghapus produk setelah konfirmasi", () => {
    // Mock products
    cy.intercept("GET", "**/api/products*", {
      body: {
        data: [
          {
            id: 1,
            name: "Produk Akan Dihapus",
            sku: "DEL-001",
            base_price: 10000,
            stok: 0,
            stok_minimum: 10,
            variants: [],
          },
        ],
      },
    });

    // Mock delete API
    cy.intercept("DELETE", "**/api/products/1", {
      statusCode: 200,
      body: {
        message: "Product soft deleted successfully",
      },
    }).as("deleteProduct");

    cy.reload();

    // Stub window.confirm to auto-confirm
    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);
    });

    // Klik tombol hapus
    cy.get('button[aria-label="Hapus produk"]').first().click();

    // Verifikasi API delete dipanggil
    cy.wait("@deleteProduct");
  });

  // ----------------------------------------------------------
  // TEST 15: DELETE - Cancel deletion
  // ----------------------------------------------------------
  it("Harus membatalkan hapus jika user klik Cancel di confirmation", () => {
    // Mock products
    cy.intercept("GET", "**/api/products*", {
      body: {
        data: [
          {
            id: 1,
            name: "Produk Test",
            sku: "TEST-001",
            base_price: 10000,
            stok: 10,
            stok_minimum: 10,
            variants: [],
          },
        ],
      },
    });

    // Mock delete API (seharusnya tidak dipanggil)
    cy.intercept("DELETE", "**/api/products/1", {
      statusCode: 200,
    }).as("deleteProduct");

    cy.reload();

    // Stub window.confirm to return false (cancel)
    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(false);
    });

    // Klik tombol hapus
    cy.get('button[aria-label="Hapus produk"]').first().click();

    // Verifikasi API delete TIDAK dipanggil
    cy.get("@deleteProduct.all").should("have.length", 0);

    // Produk masih ada di tabel
    cy.contains("Produk Test").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 16: Modal - Close modal dengan tombol X
  // ----------------------------------------------------------
  it("Harus bisa menutup modal dengan tombol X", () => {
    // Buka modal
    cy.contains("button", "Tambah Produk").click();

    // Verifikasi modal terbuka
    cy.contains("Form Produk").should("be.visible");

    // Klik tombol close
    cy.get('button[aria-label="Tutup"]').click();

    // Verifikasi modal tutup
    cy.contains("Form Produk").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 17: Stock Calculation - Display stock from variants
  // ----------------------------------------------------------
  it("Harus menampilkan total stok dari variants", () => {
    // Mock product dengan variants (stok total = 10 + 15 = 25)
    cy.intercept("GET", "**/api/products*", {
      body: {
        data: [
          {
            id: 1,
            name: "Produk dengan Variants",
            sku: "VAR-001",
            base_price: 50000,
            stok: 25,
            stok_minimum: 10,
            variants: [
              { variant_name: "Variant A", stock: 10 },
              { variant_name: "Variant B", stock: 15 },
            ],
          },
        ],
      },
    });

    cy.reload();

    // Verifikasi stok total ditampilkan
    cy.contains("Produk dengan Variants")
      .parent()
      .within(() => {
        cy.contains("25").should("be.visible");
      });
  });

  // ----------------------------------------------------------
  // TEST 18: Branch Context - Filter by branch
  // ----------------------------------------------------------
  it("Harus memfilter produk berdasarkan cabang yang dipilih", () => {
    // Mock branches
    cy.intercept("GET", "**/api/branches", {
      body: [
        { id_cabang: 1, nama_cabang: "Cabang Pusat" },
        { id_cabang: 2, nama_cabang: "Cabang 2" },
      ],
    });

    // Mock products untuk cabang 1
    cy.intercept("GET", "**/api/products*branch_id=1*", {
      body: {
        data: [
          {
            id: 1,
            name: "Produk Cabang 1",
            sku: "CB1-001",
            base_price: 10000,
            stok: 10,
            stok_minimum: 10,
          },
        ],
      },
    }).as("getProductsBranch1");

    cy.reload();

    // Verifikasi API dipanggil dengan branch_id
    cy.wait("@getProductsBranch1");
  });

  // ----------------------------------------------------------
  // TEST 19: Loading State
  // ----------------------------------------------------------
  it("Harus menampilkan loading state saat fetch data", () => {
    // Mock API dengan delay
    cy.intercept("GET", "**/api/products*", (req) => {
      req.reply((res) => {
        res.setDelay(1000);
        res.send({ data: [] });
      });
    }).as("getProducts");

    cy.reload();

    // Verifikasi loading text muncul
    cy.contains("Memuat data...").should("be.visible");

    cy.wait("@getProducts");

    // Verifikasi loading hilang
    cy.contains("Memuat data...").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 20: Error Handling - API Error
  // ----------------------------------------------------------
  it("Harus menampilkan error message jika API gagal", () => {
    // Mock API error
    cy.intercept("GET", "**/api/products*", {
      statusCode: 500,
      body: {
        message: "Internal server error",
      },
    }).as("getProductsError");

    cy.reload();
    cy.wait("@getProductsError");

    // Verifikasi error message muncul
    cy.contains("Gagal memuat produk").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 21: FULL FLOW - Complete CRUD cycle
  // ----------------------------------------------------------
  it("FULL FLOW: Create → Read → Update → Delete produk dengan variants", () => {
    // 1. CREATE
    cy.intercept("POST", "**/api/products", {
      statusCode: 201,
      body: {
        data: {
          id: 1,
          name: "Produk Full Test",
          sku: "FULL-001",
          base_price: 100000,
          variants: [
            { variant_name: "Variant 1", stock: 10, additional_price: 0 },
          ],
        },
      },
    }).as("createProduct");

    // Buka modal create
    cy.contains("button", "Tambah Produk").click();

    // Isi form
    cy.get('input[placeholder="Contoh: Kopi Arabica Gayo"]').type("Produk Full Test");
    cy.get('input[placeholder="150000"]').type("100000");
    cy.get('input[placeholder="Contoh: PRD-001"]').type("FULL-001");

    // Tambah variant
    cy.contains("button", "Tambah Varian").click();
    cy.get('input[placeholder=\'Contoh: "Size L - Putih"\']').type("Variant 1");
    cy.get('input[placeholder="0"]').first().type("0");
    cy.get('input[placeholder="0"]').eq(1).type("10");

    // Submit create
    cy.contains("button", "Simpan").click();
    cy.wait("@createProduct");

    // 2. READ - Mock products setelah create
    cy.intercept("GET", "**/api/products*", {
      body: {
        data: [
          {
            id: 1,
            name: "Produk Full Test",
            sku: "FULL-001",
            base_price: 100000,
            stok: 10,
            stok_minimum: 10,
            variants: [{ variant_name: "Variant 1", stock: 10 }],
          },
        ],
      },
    });

    cy.reload();

    // Verifikasi produk muncul
    cy.contains("Produk Full Test").should("be.visible");
    cy.contains("FULL-001").should("be.visible");

    // 3. UPDATE
    cy.intercept("PUT", "**/api/products/1", {
      statusCode: 200,
      body: {
        message: "Product updated successfully",
      },
    }).as("updateProduct");

    // Klik edit
    cy.get('button[aria-label="Edit produk"]').first().click();

    // Update nama
    cy.get('input[placeholder="Contoh: Kopi Arabica Gayo"]')
      .clear()
      .type("Produk Full Test Updated");

    // Submit update
    cy.contains("button", "Simpan").click();
    cy.wait("@updateProduct");

    // 4. DELETE
    cy.intercept("DELETE", "**/api/products/1", {
      statusCode: 200,
      body: { message: "Product soft deleted successfully" },
    }).as("deleteProduct");

    // Mock products kosong setelah delete
    cy.intercept("GET", "**/api/products*", {
      body: { data: [] },
    });

    // Stub confirm
    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);
    });

    // Klik delete
    cy.get('button[aria-label="Hapus produk"]').first().click();
    cy.wait("@deleteProduct");

    // Verifikasi produk hilang
    cy.contains("Produk Full Test").should("not.exist");
    cy.contains('Belum ada produk').should("be.visible");
  });
});
