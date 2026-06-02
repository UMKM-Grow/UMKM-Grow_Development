/**
 * ============================================================
 * SKENARIO PENGUJIAN: Branches Management - UMKM-Grow
 * ============================================================
 * Menguji seluruh fitur Manajemen Cabang end-to-end:
 *  - Tampilan halaman cabang
 *  - CRUD Cabang (Create, Read, Update, Delete)
 *  - Form validation (field wajib)
 *  - Load users untuk manager dropdown
 *  - Manager assignment (optional)
 *  - Edit mode & cancel edit
 *  - Delete confirmation
 *  - Empty state handling
 *  - Success/error messages
 * ============================================================
 */

describe("Skenario Pengujian Branches Management UMKM-Grow", () => {
  let users;

  before(() => {
    cy.fixture("user").then((data) => {
      users = data;
    });
  });

  beforeEach(() => {
    // Login dan navigasi ke Branches
    cy.clearLocalStorage();
    cy.login(users.validUser.email, users.validUser.password);
    cy.visit("/admin/branches");
  });

  // ----------------------------------------------------------
  // TEST 1: Tampilan halaman Branches
  // ----------------------------------------------------------
  it("Harus menampilkan halaman Manajemen Cabang dengan elemen yang benar", () => {
    // Verifikasi judul halaman
    cy.contains("h1", "Manajemen Cabang").should("be.visible");
    cy.contains("Tambahkan cabang baru dan atur lokasi").should("be.visible");

    // Verifikasi form tambah cabang
    cy.contains("h2", "Tambah Cabang Baru").should("be.visible");

    // Verifikasi form fields
    cy.contains("label", "Nama Cabang").should("be.visible");
    cy.contains("label", "Lokasi").should("be.visible");
    cy.contains("label", "Manajer Cabang").should("be.visible");

    // Verifikasi field optional
    cy.contains("span", "(Opsional)").should("be.visible");

    // Verifikasi tombol submit
    cy.contains("button", "Simpan Cabang").should("be.visible");

    // Verifikasi section daftar cabang
    cy.contains("h2", "Daftar Cabang").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 2: Load users untuk manager dropdown
  // ----------------------------------------------------------
  it("Harus memuat list users untuk dropdown manajer", () => {
    // Mock users API
    cy.intercept("GET", "**/api/branches/users", {
      body: [
        { id: 1, name: "John Doe", email: "john@example.com" },
        { id: 2, name: "Jane Smith", email: "jane@example.com" },
        { id: 3, name: "Bob Manager", email: "bob@example.com" },
      ],
    }).as("getUsers");

    cy.reload();
    cy.wait("@getUsers");

    // Buka dropdown manager
    cy.get('select[name="manager_id"]').within(() => {
      cy.contains("option", "-- Pilih Manajer --").should("exist");
      cy.contains("option", "John Doe (john@example.com)").should("exist");
      cy.contains("option", "Jane Smith (jane@example.com)").should("exist");
      cy.contains("option", "Bob Manager (bob@example.com)").should("exist");
    });
  });

  // ----------------------------------------------------------
  // TEST 3: Empty state - Belum ada cabang
  // ----------------------------------------------------------
  it("Harus menampilkan pesan jika belum ada cabang terdaftar", () => {
    // Mock branches kosong
    cy.intercept("GET", "**/api/branches", {
      body: [],
    });

    cy.reload();

    // Verifikasi pesan empty state
    cy.contains("Belum ada cabang terdaftar.").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 4: Tampilkan list cabang yang ada
  // ----------------------------------------------------------
  it("Harus menampilkan daftar cabang dengan informasi lengkap", () => {
    // Mock branches dengan data
    cy.intercept("GET", "**/api/branches", {
      body: [
        {
          id_cabang: 1,
          nama_cabang: "Cabang Jakarta",
          lokasi: "Jl. Merdeka No. 123",
          manager_id: 1,
        },
        {
          id_cabang: 2,
          nama_cabang: "Cabang Bandung",
          lokasi: "Jl. Asia Afrika No. 45",
          manager_id: null,
        },
        {
          id_cabang: 3,
          nama_cabang: "Cabang Surabaya",
          lokasi: null,
          manager_id: 2,
        },
      ],
    });

    cy.reload();

    // Verifikasi cabang 1
    cy.contains("Cabang Jakarta").should("be.visible");
    cy.contains("Jl. Merdeka No. 123").should("be.visible");
    cy.contains("Manager ID: 1").should("be.visible");

    // Verifikasi cabang 2 (tanpa manager)
    cy.contains("Cabang Bandung").should("be.visible");
    cy.contains("Jl. Asia Afrika No. 45").should("be.visible");

    // Verifikasi cabang 3 (lokasi kosong)
    cy.contains("Cabang Surabaya").should("be.visible");
    cy.contains("Lokasi belum diisi").should("be.visible");
    cy.contains("Manager ID: 2").should("be.visible");

    // Verifikasi total ada 3 cabang
    cy.get(".space-y-3 > div").should("have.length", 3);
  });

  // ----------------------------------------------------------
  // TEST 5: CREATE - Form validation field wajib
  // ----------------------------------------------------------
  it("Harus mencegah submit jika field wajib kosong", () => {
    // Verifikasi tombol disabled jika form kosong
    cy.contains("button", "Simpan Cabang").should("be.disabled");

    // Isi hanya nama cabang
    cy.get('input[name="nama_cabang"]').type("Cabang Test");
    cy.contains("button", "Simpan Cabang").should("be.disabled");

    // Isi lokasi juga
    cy.get('textarea[name="lokasi"]').type("Jl. Test No. 1");
    cy.contains("button", "Simpan Cabang").should("not.be.disabled");
  });

  // ----------------------------------------------------------
  // TEST 6: CREATE - Tambah cabang tanpa manager
  // ----------------------------------------------------------
  it("Harus bisa menambah cabang baru tanpa manajer", () => {
    // Mock create API
    cy.intercept("POST", "**/api/branches", {
      statusCode: 201,
      body: {
        message: "Branch created successfully",
        data: {
          id_cabang: 1,
          nama_cabang: "Cabang Baru",
          lokasi: "Jl. Baru No. 100",
          manager_id: null,
        },
      },
    }).as("createBranch");

    // Mock refresh branches
    cy.intercept("GET", "**/api/branches", {
      body: [
        {
          id_cabang: 1,
          nama_cabang: "Cabang Baru",
          lokasi: "Jl. Baru No. 100",
          manager_id: null,
        },
      ],
    });

    // Stub window.alert
    cy.window().then((win) => {
      cy.stub(win, "alert").as("alert");
    });

    // Isi form
    cy.get('input[name="nama_cabang"]').type("Cabang Baru");
    cy.get('textarea[name="lokasi"]').type("Jl. Baru No. 100");
    // Tidak pilih manager

    // Submit
    cy.contains("button", "Simpan Cabang").click();
    cy.wait("@createBranch");

    // Verifikasi payload
    cy.get("@createBranch")
      .its("request.body")
      .should("deep.equal", {
        nama_cabang: "Cabang Baru",
        lokasi: "Jl. Baru No. 100",
        manager_id: null,
      });

    // Verifikasi alert sukses
    cy.get("@alert").should("have.been.calledWith", "Cabang berhasil ditambahkan!");

    // Verifikasi form ter-reset
    cy.get('input[name="nama_cabang"]').should("have.value", "");
    cy.get('textarea[name="lokasi"]').should("have.value", "");
    cy.get('select[name="manager_id"]').should("have.value", "");
  });

  // ----------------------------------------------------------
  // TEST 7: CREATE - Tambah cabang dengan manager
  // ----------------------------------------------------------
  it("Harus bisa menambah cabang dengan manajer", () => {
    // Mock users
    cy.intercept("GET", "**/api/branches/users", {
      body: [
        { id: 1, name: "John Manager", email: "john@example.com" },
        { id: 2, name: "Jane Manager", email: "jane@example.com" },
      ],
    });

    // Mock create API
    cy.intercept("POST", "**/api/branches", {
      statusCode: 201,
      body: {
        message: "Branch created successfully",
        data: {
          id_cabang: 1,
          nama_cabang: "Cabang dengan Manager",
          lokasi: "Jl. Manager No. 50",
          manager_id: 1,
        },
      },
    }).as("createBranch");

    cy.intercept("GET", "**/api/branches", { body: [] });

    cy.reload();

    // Stub alert
    cy.window().then((win) => {
      cy.stub(win, "alert").as("alert");
    });

    // Isi form dengan manager
    cy.get('input[name="nama_cabang"]').type("Cabang dengan Manager");
    cy.get('textarea[name="lokasi"]').type("Jl. Manager No. 50");
    cy.get('select[name="manager_id"]').select("1");

    // Submit
    cy.contains("button", "Simpan Cabang").click();
    cy.wait("@createBranch");

    // Verifikasi payload
    cy.get("@createBranch")
      .its("request.body")
      .should("deep.equal", {
        nama_cabang: "Cabang dengan Manager",
        lokasi: "Jl. Manager No. 50",
        manager_id: 1,
      });

    // Verifikasi alert sukses
    cy.get("@alert").should("have.been.calledWith", "Cabang berhasil ditambahkan!");
  });

  // ----------------------------------------------------------
  // TEST 8: CREATE - Error handling
  // ----------------------------------------------------------
  it("Harus menampilkan error jika gagal menambah cabang", () => {
    // Mock create API error
    cy.intercept("POST", "**/api/branches", {
      statusCode: 400,
      body: {
        error: "Branch name already exists",
      },
    }).as("createBranchError");

    // Stub alert
    cy.window().then((win) => {
      cy.stub(win, "alert").as("alert");
    });

    // Isi form
    cy.get('input[name="nama_cabang"]').type("Cabang Duplicate");
    cy.get('textarea[name="lokasi"]').type("Jl. Duplicate");

    // Submit
    cy.contains("button", "Simpan Cabang").click();
    cy.wait("@createBranchError");

    // Verifikasi alert error
    cy.get("@alert").should(
      "have.been.calledWith",
      "Gagal menyimpan cabang: Branch name already exists"
    );
  });

  // ----------------------------------------------------------
  // TEST 9: UPDATE - Buka mode edit cabang
  // ----------------------------------------------------------
  it("Harus membuka mode edit saat klik tombol edit", () => {
    // Mock branches
    cy.intercept("GET", "**/api/branches", {
      body: [
        {
          id_cabang: 1,
          nama_cabang: "Cabang Jakarta",
          lokasi: "Jl. Merdeka No. 123",
          manager_id: 1,
        },
      ],
    });

    // Mock users
    cy.intercept("GET", "**/api/branches/users", {
      body: [{ id: 1, name: "John Manager", email: "john@example.com" }],
    });

    cy.reload();

    // Klik tombol edit
    cy.get('button[aria-label="Edit cabang"]').click();

    // Verifikasi judul form berubah
    cy.contains("h2", "Edit Cabang").should("be.visible");

    // Verifikasi data ter-populate
    cy.get('input[name="nama_cabang"]').should("have.value", "Cabang Jakarta");
    cy.get('textarea[name="lokasi"]').should("have.value", "Jl. Merdeka No. 123");
    cy.get('select[name="manager_id"]').should("have.value", "1");

    // Verifikasi tombol berubah
    cy.contains("button", "Update Cabang").should("be.visible");
    cy.contains("button", "Batal").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 10: UPDATE - Edit cabang berhasil
  // ----------------------------------------------------------
  it("Harus bisa mengupdate cabang yang ada", () => {
    // Mock branches
    cy.intercept("GET", "**/api/branches", {
      body: [
        {
          id_cabang: 1,
          nama_cabang: "Cabang Lama",
          lokasi: "Jl. Lama No. 1",
          manager_id: null,
        },
      ],
    });

    // Mock update API
    cy.intercept("PUT", "**/api/branches/1", {
      statusCode: 200,
      body: {
        message: "Branch updated successfully",
      },
    }).as("updateBranch");

    cy.reload();

    // Stub alert
    cy.window().then((win) => {
      cy.stub(win, "alert").as("alert");
    });

    // Klik edit
    cy.get('button[aria-label="Edit cabang"]').click();

    // Ubah data
    cy.get('input[name="nama_cabang"]').clear().type("Cabang Baru Diperbarui");
    cy.get('textarea[name="lokasi"]').clear().type("Jl. Baru No. 999");

    // Submit
    cy.contains("button", "Update Cabang").click();
    cy.wait("@updateBranch");

    // Verifikasi payload
    cy.get("@updateBranch")
      .its("request.body")
      .should("deep.include", {
        nama_cabang: "Cabang Baru Diperbarui",
        lokasi: "Jl. Baru No. 999",
      });

    // Verifikasi alert sukses
    cy.get("@alert").should("have.been.calledWith", "Cabang berhasil diperbarui!");

    // Verifikasi form ter-reset dan kembali ke mode create
    cy.contains("h2", "Tambah Cabang Baru").should("be.visible");
    cy.get('input[name="nama_cabang"]').should("have.value", "");
    cy.get('textarea[name="lokasi"]').should("have.value", "");
  });

  // ----------------------------------------------------------
  // TEST 11: UPDATE - Cancel edit mode
  // ----------------------------------------------------------
  it("Harus bisa membatalkan edit dan kembali ke mode create", () => {
    // Mock branches
    cy.intercept("GET", "**/api/branches", {
      body: [
        {
          id_cabang: 1,
          nama_cabang: "Cabang Jakarta",
          lokasi: "Jl. Merdeka No. 123",
          manager_id: null,
        },
      ],
    });

    cy.reload();

    // Klik edit
    cy.get('button[aria-label="Edit cabang"]').click();

    // Verifikasi mode edit aktif
    cy.contains("h2", "Edit Cabang").should("be.visible");
    cy.contains("button", "Batal").should("be.visible");

    // Ubah nilai form
    cy.get('input[name="nama_cabang"]').clear().type("Perubahan Test");

    // Klik batal
    cy.contains("button", "Batal").click();

    // Verifikasi kembali ke mode create
    cy.contains("h2", "Tambah Cabang Baru").should("be.visible");
    cy.contains("button", "Batal").should("not.exist");

    // Verifikasi form ter-reset
    cy.get('input[name="nama_cabang"]').should("have.value", "");
    cy.get('textarea[name="lokasi"]').should("have.value", "");
  });

  // ----------------------------------------------------------
  // TEST 12: DELETE - Hapus cabang dengan confirmation
  // ----------------------------------------------------------
  it("Harus bisa menghapus cabang setelah konfirmasi", () => {
    // Mock branches
    cy.intercept("GET", "**/api/branches", {
      body: [
        {
          id_cabang: 1,
          nama_cabang: "Cabang Akan Dihapus",
          lokasi: "Jl. Delete",
          manager_id: null,
        },
      ],
    });

    // Mock delete API
    cy.intercept("DELETE", "**/api/branches/1", {
      statusCode: 200,
      body: {
        message: "Branch deleted successfully",
      },
    }).as("deleteBranch");

    // Mock branches kosong setelah delete
    cy.intercept("GET", "**/api/branches", {
      body: [],
    }).as("getBranchesAfterDelete");

    cy.reload();

    // Stub confirm & alert
    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);
      cy.stub(win, "alert").as("alert");
    });

    // Klik tombol hapus
    cy.get('button[aria-label="Hapus cabang"]').click();

    cy.wait("@deleteBranch");

    // Verifikasi alert sukses
    cy.get("@alert").should("have.been.calledWith", "Cabang berhasil dihapus!");
  });

  // ----------------------------------------------------------
  // TEST 13: DELETE - Cancel deletion
  // ----------------------------------------------------------
  it("Harus membatalkan hapus jika user klik Cancel", () => {
    // Mock branches
    cy.intercept("GET", "**/api/branches", {
      body: [
        {
          id_cabang: 1,
          nama_cabang: "Cabang Test",
          lokasi: "Jl. Test",
          manager_id: null,
        },
      ],
    });

    // Mock delete API (seharusnya tidak dipanggil)
    cy.intercept("DELETE", "**/api/branches/1", {
      statusCode: 200,
    }).as("deleteBranch");

    cy.reload();

    // Stub confirm to return false (cancel)
    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(false);
    });

    // Klik tombol hapus
    cy.get('button[aria-label="Hapus cabang"]').click();

    // Verifikasi API delete TIDAK dipanggil
    cy.get("@deleteBranch.all").should("have.length", 0);

    // Cabang masih ada
    cy.contains("Cabang Test").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 14: DELETE - Error handling
  // ----------------------------------------------------------
  it("Harus menampilkan error jika gagal menghapus cabang", () => {
    // Mock branches
    cy.intercept("GET", "**/api/branches", {
      body: [
        {
          id_cabang: 1,
          nama_cabang: "Cabang Test",
          lokasi: "Jl. Test",
          manager_id: null,
        },
      ],
    });

    // Mock delete API error
    cy.intercept("DELETE", "**/api/branches/1", {
      statusCode: 400,
      body: {
        error: "Cannot delete branch with active transactions",
      },
    }).as("deleteBranchError");

    cy.reload();

    // Stub confirm & alert
    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);
      cy.stub(win, "alert").as("alert");
    });

    // Klik tombol hapus
    cy.get('button[aria-label="Hapus cabang"]').click();
    cy.wait("@deleteBranchError");

    // Verifikasi alert error
    cy.get("@alert").should(
      "have.been.calledWith",
      "Gagal menghapus cabang: Cannot delete branch with active transactions"
    );
  });

  // ----------------------------------------------------------
  // TEST 15: Loading state saat submit
  // ----------------------------------------------------------
  it("Harus menampilkan loading state saat menyimpan cabang", () => {
    // Mock API dengan delay
    cy.intercept("POST", "**/api/branches", (req) => {
      req.reply((res) => {
        res.setDelay(2000);
        res.send({
          statusCode: 201,
          body: { message: "Success" },
        });
      });
    }).as("createBranch");

    cy.intercept("GET", "**/api/branches", { body: [] });

    // Stub alert
    cy.window().then((win) => {
      cy.stub(win, "alert").as("alert");
    });

    // Isi form
    cy.get('input[name="nama_cabang"]').type("Cabang Loading Test");
    cy.get('textarea[name="lokasi"]').type("Jl. Loading");

    // Submit
    cy.contains("button", "Simpan Cabang").click();

    // Verifikasi loading text
    cy.contains("button", "Menyimpan...").should("be.visible");
    cy.contains("button", "Menyimpan...").should("be.disabled");

    cy.wait("@createBranch");

    // Verifikasi loading hilang
    cy.contains("button", "Simpan Cabang").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 16: Required attributes
  // ----------------------------------------------------------
  it("Harus memiliki attribute required pada field wajib", () => {
    // Verifikasi required attributes
    cy.get('input[name="nama_cabang"]').should("have.attr", "required");
    cy.get('textarea[name="lokasi"]').should("have.attr", "required");

    // Manager tidak required (optional)
    cy.get('select[name="manager_id"]').should("not.have.attr", "required");
  });

  // ----------------------------------------------------------
  // TEST 17: Placeholder text
  // ----------------------------------------------------------
  it("Harus menampilkan placeholder yang membantu user", () => {
    cy.get('input[name="nama_cabang"]')
      .should("have.attr", "placeholder")
      .and("include", "Cabang Jakarta");

    cy.get('textarea[name="lokasi"]')
      .should("have.attr", "placeholder")
      .and("include", "Jl. Merdeka");
  });

  // ----------------------------------------------------------
  // TEST 18: Manager ID display in branch list
  // ----------------------------------------------------------
  it("Harus menampilkan manager ID di daftar cabang jika ada", () => {
    // Mock branches dengan dan tanpa manager
    cy.intercept("GET", "**/api/branches", {
      body: [
        {
          id_cabang: 1,
          nama_cabang: "Dengan Manager",
          lokasi: "Jl. Test",
          manager_id: 5,
        },
        {
          id_cabang: 2,
          nama_cabang: "Tanpa Manager",
          lokasi: "Jl. Test 2",
          manager_id: null,
        },
      ],
    });

    cy.reload();

    // Verifikasi cabang dengan manager menampilkan manager ID
    cy.contains("Dengan Manager").parent().within(() => {
      cy.contains("Manager ID: 5").should("be.visible");
    });

    // Verifikasi cabang tanpa manager tidak menampilkan manager ID
    cy.contains("Tanpa Manager").parent().within(() => {
      cy.contains("Manager ID").should("not.exist");
    });
  });

  // ----------------------------------------------------------
  // TEST 19: Edit & Delete buttons pada setiap cabang
  // ----------------------------------------------------------
  it("Harus menampilkan tombol Edit dan Hapus pada setiap cabang", () => {
    // Mock branches
    cy.intercept("GET", "**/api/branches", {
      body: [
        {
          id_cabang: 1,
          nama_cabang: "Cabang Test",
          lokasi: "Jl. Test",
          manager_id: null,
        },
      ],
    });

    cy.reload();

    // Verifikasi tombol edit ada
    cy.get('button[aria-label="Edit cabang"]').should("be.visible");

    // Verifikasi tombol hapus ada
    cy.get('button[aria-label="Hapus cabang"]').should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 20: FULL FLOW - Complete CRUD cycle
  // ----------------------------------------------------------
  it("FULL FLOW: Create → Read → Update → Delete cabang", () => {
    // Mock users
    cy.intercept("GET", "**/api/branches/users", {
      body: [
        { id: 1, name: "Manager One", email: "manager1@example.com" },
        { id: 2, name: "Manager Two", email: "manager2@example.com" },
      ],
    });

    // 1. Initial state - no branches
    cy.intercept("GET", "**/api/branches", {
      body: [],
    }).as("getBranchesEmpty");

    cy.reload();
    cy.wait("@getBranchesEmpty");

    // Verifikasi empty state
    cy.contains("Belum ada cabang terdaftar.").should("be.visible");

    // 2. CREATE - Add new branch
    cy.intercept("POST", "**/api/branches", {
      statusCode: 201,
      body: {
        message: "Branch created",
        data: {
          id_cabang: 1,
          nama_cabang: "Cabang Full Flow",
          lokasi: "Jl. Full Flow No. 123",
          manager_id: 1,
        },
      },
    }).as("createBranch");

    // Mock after create
    cy.intercept("GET", "**/api/branches", {
      body: [
        {
          id_cabang: 1,
          nama_cabang: "Cabang Full Flow",
          lokasi: "Jl. Full Flow No. 123",
          manager_id: 1,
        },
      ],
    }).as("getBranchesAfterCreate");

    // Stub alert
    cy.window().then((win) => {
      cy.stub(win, "alert").as("alert");
    });

    // Fill form and submit
    cy.get('input[name="nama_cabang"]').type("Cabang Full Flow");
    cy.get('textarea[name="lokasi"]').type("Jl. Full Flow No. 123");
    cy.get('select[name="manager_id"]').select("1");

    cy.contains("button", "Simpan Cabang").click();
    cy.wait("@createBranch");

    // 3. READ - Verify branch appears
    cy.wait("@getBranchesAfterCreate");
    cy.contains("Cabang Full Flow").should("be.visible");
    cy.contains("Jl. Full Flow No. 123").should("be.visible");
    cy.contains("Manager ID: 1").should("be.visible");

    // 4. UPDATE - Edit branch
    cy.intercept("PUT", "**/api/branches/1", {
      statusCode: 200,
      body: { message: "Branch updated" },
    }).as("updateBranch");

    // Mock after update
    cy.intercept("GET", "**/api/branches", {
      body: [
        {
          id_cabang: 1,
          nama_cabang: "Cabang Updated",
          lokasi: "Jl. Updated No. 999",
          manager_id: 2,
        },
      ],
    });

    // Click edit
    cy.get('button[aria-label="Edit cabang"]').click();

    // Verify edit mode
    cy.contains("h2", "Edit Cabang").should("be.visible");

    // Update data
    cy.get('input[name="nama_cabang"]').clear().type("Cabang Updated");
    cy.get('textarea[name="lokasi"]').clear().type("Jl. Updated No. 999");
    cy.get('select[name="manager_id"]').select("2");

    cy.contains("button", "Update Cabang").click();
    cy.wait("@updateBranch");

    // Verify success alert
    cy.get("@alert").should("have.been.calledWith", "Cabang berhasil diperbarui!");

    // 5. DELETE - Remove branch
    cy.intercept("DELETE", "**/api/branches/1", {
      statusCode: 200,
      body: { message: "Branch deleted" },
    }).as("deleteBranch");

    // Mock after delete
    cy.intercept("GET", "**/api/branches", {
      body: [],
    }).as("getBranchesAfterDelete");

    // Stub confirm for delete
    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);
    });

    // Click delete
    cy.get('button[aria-label="Hapus cabang"]').click();
    cy.wait("@deleteBranch");

    // Verify success alert
    cy.get("@alert").should("have.been.calledWith", "Cabang berhasil dihapus!");

    // Verify empty state returns
    cy.wait("@getBranchesAfterDelete");
    cy.contains("Belum ada cabang terdaftar.").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 21: Multiple branches display
  // ----------------------------------------------------------
  it("Harus menampilkan multiple cabang dengan styling yang benar", () => {
    // Mock multiple branches
    cy.intercept("GET", "**/api/branches", {
      body: [
        {
          id_cabang: 1,
          nama_cabang: "Cabang A",
          lokasi: "Lokasi A",
          manager_id: 1,
        },
        {
          id_cabang: 2,
          nama_cabang: "Cabang B",
          lokasi: "Lokasi B",
          manager_id: 2,
        },
        {
          id_cabang: 3,
          nama_cabang: "Cabang C",
          lokasi: "Lokasi C",
          manager_id: null,
        },
        {
          id_cabang: 4,
          nama_cabang: "Cabang D",
          lokasi: "Lokasi D",
          manager_id: 3,
        },
      ],
    });

    cy.reload();

    // Verifikasi ada 4 cabang
    cy.get(".space-y-3 > div").should("have.length", 4);

    // Verifikasi semua cabang terlihat
    cy.contains("Cabang A").should("be.visible");
    cy.contains("Cabang B").should("be.visible");
    cy.contains("Cabang C").should("be.visible");
    cy.contains("Cabang D").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 22: Form disabled state logic
  // ----------------------------------------------------------
  it("Harus disable tombol submit jika saving atau field wajib kosong", () => {
    // Initial state - button disabled (form kosong)
    cy.contains("button", "Simpan Cabang").should("be.disabled");

    // Isi nama cabang saja
    cy.get('input[name="nama_cabang"]').type("Test");
    cy.contains("button", "Simpan Cabang").should("be.disabled");

    // Isi lokasi juga
    cy.get('textarea[name="lokasi"]').type("Test Lokasi");
    cy.contains("button", "Simpan Cabang").should("not.be.disabled");

    // Clear nama cabang - button disabled lagi
    cy.get('input[name="nama_cabang"]').clear();
    cy.contains("button", "Simpan Cabang").should("be.disabled");
  });

  // ----------------------------------------------------------
  // TEST 23: Network error handling
  // ----------------------------------------------------------
  it("Harus menampilkan error jika terjadi network error", () => {
    // Mock network error
    cy.intercept("POST", "**/api/branches", {
      forceNetworkError: true,
    }).as("createBranchError");

    // Stub alert
    cy.window().then((win) => {
      cy.stub(win, "alert").as("alert");
    });

    // Isi form
    cy.get('input[name="nama_cabang"]').type("Cabang Network Error");
    cy.get('textarea[name="lokasi"]').type("Jl. Error");

    // Submit
    cy.contains("button", "Simpan Cabang").click();

    // Verifikasi alert error muncul
    cy.get("@alert").should("have.been.called");
    cy.get("@alert").its("firstCall.args.0").should("include", "Gagal menyimpan cabang");
  });

  // ----------------------------------------------------------
  // TEST 24: Update dengan manager_id null
  // ----------------------------------------------------------
  it("Harus bisa update cabang dan set manager menjadi null", () => {
    // Mock branches dengan manager
    cy.intercept("GET", "**/api/branches", {
      body: [
        {
          id_cabang: 1,
          nama_cabang: "Cabang Test",
          lokasi: "Jl. Test",
          manager_id: 1,
        },
      ],
    });

    // Mock users
    cy.intercept("GET", "**/api/branches/users", {
      body: [{ id: 1, name: "Manager Test", email: "test@example.com" }],
    });

    // Mock update API
    cy.intercept("PUT", "**/api/branches/1", {
      statusCode: 200,
      body: { message: "Updated" },
    }).as("updateBranch");

    cy.reload();

    // Stub alert
    cy.window().then((win) => {
      cy.stub(win, "alert").as("alert");
    });

    // Click edit
    cy.get('button[aria-label="Edit cabang"]').click();

    // Verifikasi manager ter-select
    cy.get('select[name="manager_id"]').should("have.value", "1");

    // Reset manager ke empty
    cy.get('select[name="manager_id"]').select("");

    // Submit
    cy.contains("button", "Update Cabang").click();
    cy.wait("@updateBranch");

    // Verifikasi payload manager_id = null
    cy.get("@updateBranch")
      .its("request.body")
      .should("have.property", "manager_id", null);
  });

  // ----------------------------------------------------------
  // TEST 25: Lokasi kosong fallback text
  // ----------------------------------------------------------
  it("Harus menampilkan fallback text jika lokasi kosong", () => {
    // Mock branch tanpa lokasi
    cy.intercept("GET", "**/api/branches", {
      body: [
        {
          id_cabang: 1,
          nama_cabang: "Cabang Tanpa Lokasi",
          lokasi: null,
          manager_id: null,
        },
      ],
    });

    cy.reload();

    // Verifikasi fallback text muncul
    cy.contains("Cabang Tanpa Lokasi").parent().within(() => {
      cy.contains("Lokasi belum diisi").should("be.visible");
    });
  });
});
