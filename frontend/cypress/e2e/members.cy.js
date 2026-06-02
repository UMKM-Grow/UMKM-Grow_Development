/**
 * ============================================================
 * SKENARIO PENGUJIAN: Members Management - UMKM-Grow
 * ============================================================
 * Menguji seluruh fitur Manajemen Member end-to-end:
 *  - Tampilan halaman members
 *  - CRUD Members (Create, Read, Update)
 *  - Search/Filter members
 *  - Pagination (Prev/Next)
 *  - Form validation (field wajib)
 *  - Modal (open/close)
 *  - Level badges (Bronze, Silver, Gold)
 *  - Loyalty points display
 *  - Empty state handling
 *  - Loading & error states
 * ============================================================
 */

describe("Skenario Pengujian Members Management UMKM-Grow", () => {
  let users;

  before(() => {
    cy.fixture("user").then((data) => {
      users = data;
    });
  });

  beforeEach(() => {
    // Login dan navigasi ke Members
    cy.clearLocalStorage();
    cy.login(users.validUser.email, users.validUser.password);
    cy.visit("/members");
  });

  // ----------------------------------------------------------
  // TEST 1: Tampilan halaman Members
  // ----------------------------------------------------------
  it("Harus menampilkan halaman Members dengan elemen yang benar", () => {
    // Verifikasi judul halaman
    cy.contains("h1", "Members").should("be.visible");
    cy.contains("Kelola data member dan program loyalitas").should("be.visible");

    // Verifikasi search box
    cy.get('input[placeholder="Cari member..."]').should("be.visible");

    // Verifikasi tombol Tambah Member
    cy.contains("button", "Tambah Member").should("be.visible");

    // Verifikasi tabel headers
    cy.contains("th", "Nama").should("be.visible");
    cy.contains("th", "Nomor Telepon").should("be.visible");
    cy.contains("th", "Email").should("be.visible");
    cy.contains("th", "Poin").should("be.visible");
    cy.contains("th", "Level").should("be.visible");
    cy.contains("th", "Aksi").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 2: Empty state - Belum ada member
  // ----------------------------------------------------------
  it("Harus menampilkan pesan jika belum ada member", () => {
    // Mock API dengan data kosong
    cy.intercept("GET", "**/api/members*", {
      statusCode: 200,
      body: {
        data: [],
        pagination: { totalPages: 1 },
      },
    }).as("getMembers");

    cy.reload();
    cy.wait("@getMembers");

    // Verifikasi pesan empty state
    cy.contains('Belum ada member. Klik "Tambah Member" untuk mulai.').should(
      "be.visible"
    );
  });

  // ----------------------------------------------------------
  // TEST 3: Tampilkan list members
  // ----------------------------------------------------------
  it("Harus menampilkan daftar members dengan informasi lengkap", () => {
    // Mock API dengan data members
    cy.intercept("GET", "**/api/members*", {
      body: {
        data: [
          {
            id: 1,
            name: "John Doe",
            nomor_telepon: "081234567890",
            email: "john@example.com",
            total_poin: 150,
            level: "Silver",
          },
          {
            id: 2,
            name: "Jane Smith",
            nomor_telepon: "081234567891",
            email: "jane@example.com",
            total_poin: 500,
            level: "Gold",
          },
          {
            id: 3,
            name: "Bob Brown",
            nomor_telepon: "081234567892",
            email: null,
            total_poin: 50,
            level: "Bronze",
          },
        ],
        pagination: { totalPages: 1 },
      },
    });

    cy.reload();

    // Verifikasi member 1 - Silver
    cy.contains("td", "John Doe").should("be.visible");
    cy.contains("td", "081234567890").should("be.visible");
    cy.contains("td", "john@example.com").should("be.visible");
    cy.contains("td", "150 pts").should("be.visible");
    cy.contains("span", "Silver").should("be.visible");

    // Verifikasi member 2 - Gold
    cy.contains("td", "Jane Smith").should("be.visible");
    cy.contains("td", "500 pts").should("be.visible");
    cy.contains("span", "Gold").should("be.visible");

    // Verifikasi member 3 - Bronze (tanpa email)
    cy.contains("td", "Bob Brown").should("be.visible");
    cy.contains("td", "-").should("be.visible"); // Email kosong
    cy.contains("span", "Bronze").should("be.visible");

    // Verifikasi total ada 3 members
    cy.get("tbody tr").should("have.length", 3);
  });

  // ----------------------------------------------------------
  // TEST 4: Level badges dengan warna yang benar
  // ----------------------------------------------------------
  it("Harus menampilkan badge level dengan styling yang benar", () => {
    // Mock API dengan berbagai level
    cy.intercept("GET", "**/api/members*", {
      body: {
        data: [
          {
            id: 1,
            name: "Bronze Member",
            nomor_telepon: "081111111111",
            email: "bronze@test.com",
            total_poin: 10,
            level: "Bronze",
          },
          {
            id: 2,
            name: "Silver Member",
            nomor_telepon: "081222222222",
            email: "silver@test.com",
            total_poin: 200,
            level: "Silver",
          },
          {
            id: 3,
            name: "Gold Member",
            nomor_telepon: "081333333333",
            email: "gold@test.com",
            total_poin: 1000,
            level: "Gold",
          },
        ],
        pagination: { totalPages: 1 },
      },
    });

    cy.reload();

    // Verifikasi Bronze badge
    cy.contains("tr", "Bronze Member").within(() => {
      cy.contains("span", "Bronze")
        .should("have.class", "bg-orange-100")
        .should("have.class", "text-orange-700");
    });

    // Verifikasi Silver badge
    cy.contains("tr", "Silver Member").within(() => {
      cy.contains("span", "Silver")
        .should("have.class", "bg-gray-200")
        .should("have.class", "text-gray-700");
    });

    // Verifikasi Gold badge
    cy.contains("tr", "Gold Member").within(() => {
      cy.contains("span", "Gold")
        .should("have.class", "bg-yellow-100")
        .should("have.class", "text-yellow-800");
    });
  });

  // ----------------------------------------------------------
  // TEST 5: CREATE - Buka modal tambah member
  // ----------------------------------------------------------
  it("Harus membuka modal form saat klik Tambah Member", () => {
    // Klik tombol Tambah Member
    cy.contains("button", "Tambah Member").click();

    // Verifikasi modal muncul
    cy.contains("h2", "Tambah Member").should("be.visible");

    // Verifikasi form fields
    cy.contains("label", "Nama").should("be.visible");
    cy.contains("label", "Nomor Telepon").should("be.visible");
    cy.contains("label", "Email").should("be.visible");
    cy.contains("label", "Alamat").should("be.visible");
    cy.contains("label", "Total Poin").should("be.visible");
    cy.contains("label", "Level").should("be.visible");

    // Verifikasi tombol
    cy.contains("button", "Batal").should("be.visible");
    cy.contains("button", "Simpan").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 6: CREATE - Tutup modal dengan tombol Batal
  // ----------------------------------------------------------
  it("Harus bisa menutup modal dengan tombol Batal", () => {
    // Buka modal
    cy.contains("button", "Tambah Member").click();

    // Verifikasi modal terbuka
    cy.contains("h2", "Tambah Member").should("be.visible");

    // Klik tombol Batal
    cy.contains("button", "Batal").click();

    // Verifikasi modal tertutup
    cy.contains("h2", "Tambah Member").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 7: CREATE - Form validation field wajib
  // ----------------------------------------------------------
  it("Harus mencegah submit jika field wajib kosong", () => {
    // Mock API
    cy.intercept("POST", "**/api/members", {
      statusCode: 201,
      body: { message: "Success" },
    }).as("createMember");

    cy.intercept("GET", "**/api/members*", {
      body: { data: [], pagination: { totalPages: 1 } },
    });

    // Buka modal
    cy.contains("button", "Tambah Member").click();

    // Coba submit tanpa mengisi form
    cy.contains("button", "Simpan").click();

    // Modal tidak tutup (form validation mencegah)
    cy.contains("h2", "Tambah Member").should("be.visible");

    // API tidak dipanggil
    cy.get("@createMember.all").should("have.length", 0);
  });

  // ----------------------------------------------------------
  // TEST 8: CREATE - Tambah member berhasil
  // ----------------------------------------------------------
  it("Harus bisa menambah member baru", () => {
    // Mock create API
    cy.intercept("POST", "**/api/members", {
      statusCode: 201,
      body: {
        message: "Member created successfully",
        data: {
          id: 1,
          nama: "New Member",
          nomor_telepon: "081999999999",
          email: "new@example.com",
          address: "Jl. Test No. 1",
          loyalty_points: 0,
          level: "Bronze",
        },
      },
    }).as("createMember");

    // Mock refresh members
    cy.intercept("GET", "**/api/members*", {
      body: {
        data: [
          {
            id: 1,
            name: "New Member",
            nomor_telepon: "081999999999",
            email: "new@example.com",
            total_poin: 0,
            level: "Bronze",
          },
        ],
        pagination: { totalPages: 1 },
      },
    });

    // Buka modal
    cy.contains("button", "Tambah Member").click();

    // Isi form
    cy.get('input[type="text"]').first().type("New Member");
    cy.get('input[type="text"]').eq(1).type("081999999999");
    cy.get('input[type="email"]').type("new@example.com");
    cy.get("textarea").type("Jl. Test No. 1");
    // Total poin & level sudah ada default value

    // Submit
    cy.contains("button", "Simpan").click();
    cy.wait("@createMember");

    // Verifikasi payload
    cy.get("@createMember")
      .its("request.body")
      .should("deep.include", {
        nama: "New Member",
        nomor_telepon: "081999999999",
        email: "new@example.com",
        address: "Jl. Test No. 1",
      });

    // Verifikasi modal tertutup
    cy.contains("h2", "Tambah Member").should("not.exist");

    // Verifikasi member muncul di tabel
    cy.contains("New Member").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 9: CREATE - Tambah member dengan level selain Bronze
  // ----------------------------------------------------------
  it("Harus bisa menambah member dengan level Gold", () => {
    // Mock API
    cy.intercept("POST", "**/api/members", {
      statusCode: 201,
      body: { message: "Success" },
    }).as("createMember");

    cy.intercept("GET", "**/api/members*", {
      body: { data: [], pagination: { totalPages: 1 } },
    });

    // Buka modal
    cy.contains("button", "Tambah Member").click();

    // Isi form dengan level Gold
    cy.get('input[type="text"]').first().type("Gold Member");
    cy.get('input[type="text"]').eq(1).type("081888888888");
    cy.get('input[type="number"]').clear().type("1000");
    cy.get("select").select("Gold");

    // Submit
    cy.contains("button", "Simpan").click();
    cy.wait("@createMember");

    // Verifikasi payload
    cy.get("@createMember")
      .its("request.body")
      .should("deep.include", {
        nama: "Gold Member",
        nomor_telepon: "081888888888",
        loyalty_points: 1000,
        level: "Gold",
      });
  });

  // ----------------------------------------------------------
  // TEST 10: UPDATE - Buka modal edit member
  // ----------------------------------------------------------
  it("Harus membuka modal edit saat klik tombol edit", () => {
    // Mock members
    cy.intercept("GET", "**/api/members*", {
      body: {
        data: [
          {
            id: 1,
            name: "Edit Test",
            nomor_telepon: "081777777777",
            email: "edit@test.com",
            address: "Jl. Edit",
            total_poin: 100,
            level: "Silver",
          },
        ],
        pagination: { totalPages: 1 },
      },
    });

    cy.reload();

    // Klik tombol edit
    cy.get('button[aria-label="Edit member"]').first().click();

    // Verifikasi modal edit muncul
    cy.contains("h2", "Edit Member").should("be.visible");

    // Verifikasi data ter-populate
    cy.get('input[type="text"]').first().should("have.value", "Edit Test");
    cy.get('input[type="text"]').eq(1).should("have.value", "081777777777");
    cy.get('input[type="email"]').should("have.value", "edit@test.com");
    cy.get("textarea").should("have.value", "Jl. Edit");
    cy.get('input[type="number"]').should("have.value", "100");
    cy.get("select").should("have.value", "Silver");
  });

  // ----------------------------------------------------------
  // TEST 11: UPDATE - Edit member berhasil
  // ----------------------------------------------------------
  it("Harus bisa mengupdate member yang ada", () => {
    // Mock members
    cy.intercept("GET", "**/api/members*", {
      body: {
        data: [
          {
            id: 1,
            name: "Old Name",
            nomor_telepon: "081666666666",
            email: "old@test.com",
            total_poin: 50,
            level: "Bronze",
          },
        ],
        pagination: { totalPages: 1 },
      },
    });

    // Mock update API
    cy.intercept("PUT", "**/api/members/1", {
      statusCode: 200,
      body: {
        message: "Member updated successfully",
      },
    }).as("updateMember");

    cy.reload();

    // Klik edit
    cy.get('button[aria-label="Edit member"]').first().click();

    // Ubah data
    cy.get('input[type="text"]').first().clear().type("Updated Name");
    cy.get('input[type="email"]').clear().type("updated@test.com");
    cy.get('input[type="number"]').clear().type("200");
    cy.get("select").select("Silver");

    // Submit
    cy.contains("button", "Simpan").click();
    cy.wait("@updateMember");

    // Verifikasi payload
    cy.get("@updateMember")
      .its("request.body")
      .should("deep.include", {
        nama: "Updated Name",
        email: "updated@test.com",
        loyalty_points: 200,
        level: "Silver",
      });

    // Verifikasi modal tertutup
    cy.contains("h2", "Edit Member").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 12: SEARCH - Filter members by search
  // ----------------------------------------------------------
  it("Harus bisa mencari member dengan search box", () => {
    // Mock initial members
    cy.intercept("GET", "**/api/members*", {
      body: {
        data: [
          { id: 1, name: "John Doe", nomor_telepon: "081111111111", total_poin: 100, level: "Bronze" },
          { id: 2, name: "Jane Smith", nomor_telepon: "081222222222", total_poin: 200, level: "Silver" },
        ],
        pagination: { totalPages: 1 },
      },
    });

    cy.reload();

    // Verifikasi ada 2 members
    cy.get("tbody tr").should("have.length", 2);

    // Mock search result
    cy.intercept("GET", "**/api/members*search=John*", {
      body: {
        data: [
          { id: 1, name: "John Doe", nomor_telepon: "081111111111", total_poin: 100, level: "Bronze" },
        ],
        pagination: { totalPages: 1 },
      },
    }).as("searchMembers");

    // Type di search box
    cy.get('input[placeholder="Cari member..."]').type("John");

    cy.wait("@searchMembers");

    // Verifikasi hanya ada 1 member
    cy.get("tbody tr").should("have.length", 1);
    cy.contains("John Doe").should("be.visible");
    cy.contains("Jane Smith").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 13: SEARCH - Reset page saat search
  // ----------------------------------------------------------
  it("Harus reset page ke 1 saat melakukan search", () => {
    // Mock API
    cy.intercept("GET", "**/api/members*page=2*", {
      body: {
        data: [{ id: 3, name: "Member Page 2", nomor_telepon: "081333333333", total_poin: 50, level: "Bronze" }],
        pagination: { totalPages: 2 },
      },
    });

    cy.intercept("GET", "**/api/members*page=1*search=test*", {
      body: {
        data: [{ id: 1, name: "Test Member", nomor_telepon: "081111111111", total_poin: 100, level: "Bronze" }],
        pagination: { totalPages: 1 },
      },
    }).as("searchWithReset");

    // Type di search - page harus reset ke 1
    cy.get('input[placeholder="Cari member..."]').type("test");
    cy.wait("@searchWithReset");
  });

  // ----------------------------------------------------------
  // TEST 14: PAGINATION - Navigate pages
  // ----------------------------------------------------------
  it("Harus bisa navigasi halaman dengan tombol Prev/Next", () => {
    // Mock page 1
    cy.intercept("GET", "**/api/members*page=1*", {
      body: {
        data: [{ id: 1, name: "Member Page 1", nomor_telepon: "081111111111", total_poin: 100, level: "Bronze" }],
        pagination: { totalPages: 3 },
      },
    });

    // Mock page 2
    cy.intercept("GET", "**/api/members*page=2*", {
      body: {
        data: [{ id: 2, name: "Member Page 2", nomor_telepon: "081222222222", total_poin: 200, level: "Silver" }],
        pagination: { totalPages: 3 },
      },
    }).as("getPage2");

    cy.reload();

    // Verifikasi di page 1
    cy.contains("Halaman 1 dari 3").should("be.visible");
    cy.contains("button", "Prev").should("be.disabled");

    // Klik Next
    cy.contains("button", "Next").click();
    cy.wait("@getPage2");

    // Verifikasi di page 2
    cy.contains("Halaman 2 dari 3").should("be.visible");
    cy.contains("Member Page 2").should("be.visible");
    cy.contains("button", "Prev").should("not.be.disabled");
  });

  // ----------------------------------------------------------
  // TEST 15: PAGINATION - Prev button disabled di page 1
  // ----------------------------------------------------------
  it("Harus disable tombol Prev di page 1", () => {
    cy.intercept("GET", "**/api/members*", {
      body: {
        data: [{ id: 1, name: "Member Test", nomor_telepon: "081111111111", total_poin: 100, level: "Bronze" }],
        pagination: { totalPages: 2 },
      },
    });

    cy.reload();

    cy.contains("button", "Prev").should("be.disabled");
  });

  // ----------------------------------------------------------
  // TEST 16: PAGINATION - Next button disabled di last page
  // ----------------------------------------------------------
  it("Harus disable tombol Next di halaman terakhir", () => {
    cy.intercept("GET", "**/api/members*", {
      body: {
        data: [{ id: 1, name: "Member Test", nomor_telepon: "081111111111", total_poin: 100, level: "Bronze" }],
        pagination: { totalPages: 1 },
      },
    });

    cy.reload();

    cy.contains("button", "Next").should("be.disabled");
  });

  // ----------------------------------------------------------
  // TEST 17: Loading state
  // ----------------------------------------------------------
  it("Harus menampilkan loading state saat fetch data", () => {
    cy.intercept("GET", "**/api/members*", (req) => {
      req.reply((res) => {
        res.setDelay(1000);
        res.send({
          body: { data: [], pagination: { totalPages: 1 } },
        });
      });
    }).as("getMembers");

    cy.reload();

    // Verifikasi loading text
    cy.contains("Loading...").should("be.visible");

    cy.wait("@getMembers");

    // Verifikasi loading hilang
    cy.contains("Loading...").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 18: Error state
  // ----------------------------------------------------------
  it("Harus menampilkan error state jika fetch gagal", () => {
    cy.intercept("GET", "**/api/members*", {
      statusCode: 500,
      body: {
        message: "Internal server error",
      },
    }).as("getMembersError");

    cy.reload();
    cy.wait("@getMembersError");

    // Verifikasi error message
    cy.contains("Gagal memuat members").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 19: Required attributes
  // ----------------------------------------------------------
  it("Harus memiliki attribute required pada field wajib di form", () => {
    cy.contains("button", "Tambah Member").click();

    // Nama & Nomor Telepon required
    cy.get('input[type="text"]').first().should("have.attr", "required");
    cy.get('input[type="text"]').eq(1).should("have.attr", "required");

    // Email, Alamat, Total Poin, Level tidak required (optional)
    cy.get('input[type="email"]').should("not.have.attr", "required");
    cy.get("textarea").should("not.have.attr", "required");
  });

  // ----------------------------------------------------------
  // TEST 20: FULL FLOW - Complete CRUD + Search + Pagination
  // ----------------------------------------------------------
  it("FULL FLOW: Create → Read → Update → Search → Pagination", () => {
    // 1. CREATE
    cy.intercept("POST", "**/api/members", {
      statusCode: 201,
      body: { message: "Success", data: { id: 1, nama: "Full Flow Member" } },
    }).as("createMember");

    cy.intercept("GET", "**/api/members*", {
      body: {
        data: [
          { id: 1, name: "Full Flow Member", nomor_telepon: "081999999999", email: "flow@test.com", total_poin: 100, level: "Bronze" },
        ],
        pagination: { totalPages: 1 },
      },
    }).as("getMembersAfterCreate");

    cy.contains("button", "Tambah Member").click();
    cy.get('input[type="text"]').first().type("Full Flow Member");
    cy.get('input[type="text"]').eq(1).type("081999999999");
    cy.get('input[type="email"]').type("flow@test.com");
    cy.contains("button", "Simpan").click();
    cy.wait("@createMember");

    // 2. READ
    cy.wait("@getMembersAfterCreate");
    cy.contains("Full Flow Member").should("be.visible");
    cy.contains("081999999999").should("be.visible");

    // 3. UPDATE
    cy.intercept("PUT", "**/api/members/1", {
      statusCode: 200,
      body: { message: "Updated" },
    }).as("updateMember");

    cy.get('button[aria-label="Edit member"]').first().click();
    cy.get('input[type="text"]').first().clear().type("Updated Member");
    cy.contains("button", "Simpan").click();
    cy.wait("@updateMember");

    // 4. SEARCH
    cy.intercept("GET", "**/api/members*search=Updated*", {
      body: {
        data: [{ id: 1, name: "Updated Member", nomor_telepon: "081999999999", total_poin: 100, level: "Bronze" }],
        pagination: { totalPages: 1 },
      },
    }).as("searchMember");

    cy.get('input[placeholder="Cari member..."]').type("Updated");
    cy.wait("@searchMember");
    cy.contains("Updated Member").should("be.visible");
  });
});
