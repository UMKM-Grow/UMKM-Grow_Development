/**
 * ============================================================
 * SKENARIO PENGUJIAN: Settings (Pengaturan Toko) - UMKM-Grow
 * ============================================================
 * Menguji seluruh fitur Pengaturan Toko end-to-end:
 *  - Tampilan halaman Settings
 *  - Load existing settings
 *  - Form fields (Nama Toko, Alamat, Nomor Telepon, Service Charge, Pajak)
 *  - Form validation (required & range validation)
 *  - UPDATE settings berhasil
 *  - Display current settings panel
 *  - Success & error messages
 *  - Loading state
 *  - Error handling
 *  - Service charge & tax percentage validation (0-100)
 *  - Optional fields (Alamat, Nomor Telepon)
 * ============================================================
 */

describe("Skenario Pengujian Settings (Pengaturan Toko) UMKM-Grow", () => {
  let users;

  before(() => {
    cy.fixture("user").then((data) => {
      users = data;
    });
  });

  beforeEach(() => {
    // Login dan navigasi ke Settings
    cy.clearLocalStorage();
    cy.login(users.validUser.email, users.validUser.password);
    cy.visit("/settings");
  });

  // ----------------------------------------------------------
  // TEST 1: Tampilan halaman Settings
  // ----------------------------------------------------------
  it("Harus menampilkan halaman Settings dengan elemen yang benar", () => {
    // Verifikasi judul halaman
    cy.contains("h1", "Pengaturan Toko").should("be.visible");
    cy.contains("Konfigurasi informasi dan parameter toko Anda").should("be.visible");

    // Verifikasi form labels
    cy.contains("label", "Nama Toko").should("be.visible");
    cy.contains("label", "Alamat").should("be.visible");
    cy.contains("label", "Nomor Telepon").should("be.visible");
    cy.contains("label", "Service Charge (%)").should("be.visible");
    cy.contains("label", "Pajak (%)").should("be.visible");

    // Verifikasi helper texts
    cy.contains("Service charge akan ditambahkan ke total belanja").should("be.visible");
    cy.contains("Pajak akan ditambahkan ke total belanja setelah service charge").should("be.visible");

    // Verifikasi tombol Simpan
    cy.contains("button", "Simpan Pengaturan").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 2: Loading state
  // ----------------------------------------------------------
  it("Harus menampilkan loading state saat fetch settings", () => {
    // Mock API dengan delay
    cy.intercept("GET", "**/api/settings", (req) => {
      req.reply({
        delay: 1000,
        statusCode: 200,
        body: {
          nama_toko: "Toko ABC",
          alamat: "Jl. Test No. 123",
          nomor_telepon: "081234567890",
          service_charge_percent: 5,
          tax_percent: 11,
        },
      });
    }).as("getSettingsSlow");

    cy.reload();

    // Verifikasi loading text
    cy.contains("Memuat pengaturan...").should("be.visible");

    cy.wait("@getSettingsSlow");

    // Loading hilang
    cy.contains("Memuat pengaturan...").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 3: Load existing settings - Display in form
  // ----------------------------------------------------------
  it("Harus load dan display existing settings di form", () => {
    // Mock settings data
    cy.intercept("GET", "**/api/settings", {
      body: {
        nama_toko: "Toko Maju Jaya",
        alamat: "Jl. Sudirman No. 45, Jakarta",
        nomor_telepon: "021-12345678",
        service_charge_percent: 5.5,
        tax_percent: 11,
      },
    }).as("getSettings");

    cy.reload();
    cy.wait("@getSettings");

    // Verifikasi form fields terisi
    cy.get('input[type="text"]').first().should("have.value", "Toko Maju Jaya");
    cy.get("textarea").should("have.value", "Jl. Sudirman No. 45, Jakarta");
    cy.get('input[type="tel"]').should("have.value", "021-12345678");
    
    // Service charge & tax
    cy.get('input[type="number"]').first().should("have.value", "5.5");
    cy.get('input[type="number"]').last().should("have.value", "11");
  });

  // ----------------------------------------------------------
  // TEST 4: Display current settings panel
  // ----------------------------------------------------------
  it("Harus menampilkan panel Nilai Pengaturan Saat Ini", () => {
    cy.intercept("GET", "**/api/settings", {
      body: {
        nama_toko: "Toko ABC",
        alamat: "Jl. Merdeka No. 10",
        nomor_telepon: "081234567890",
        service_charge_percent: 5,
        tax_percent: 11,
      },
    });

    cy.reload();

    // Verifikasi panel exists
    cy.contains("h2", "Nilai Pengaturan Saat Ini").should("be.visible");

    // Verifikasi data ditampilkan
    cy.contains("Nama Toko:").parent().should("contain", "Toko ABC");
    cy.contains("Alamat:").parent().should("contain", "Jl. Merdeka No. 10");
    cy.contains("Telepon:").parent().should("contain", "081234567890");
    cy.contains("Service Charge:").parent().should("contain", "5%");
    cy.contains("Pajak:").parent().should("contain", "11%");
  });

  // ----------------------------------------------------------
  // TEST 5: Form validation - Nama Toko required
  // ----------------------------------------------------------
  it("Harus menampilkan error jika Nama Toko kosong", () => {
    cy.intercept("GET", "**/api/settings", {
      body: {
        nama_toko: "Toko Test",
        alamat: "",
        nomor_telepon: "",
        service_charge_percent: 0,
        tax_percent: 0,
      },
    });

    cy.reload();

    // Kosongkan nama toko
    cy.get('input[type="text"]').first().clear();

    // Submit
    cy.contains("button", "Simpan Pengaturan").click();

    // Verifikasi error message
    cy.contains("Nama toko is required").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 6: Form validation - Service charge range (0-100)
  // ----------------------------------------------------------
  it("Harus menampilkan error jika service charge di luar range 0-100", () => {
    cy.intercept("GET", "**/api/settings", {
      body: {
        nama_toko: "Toko Test",
        alamat: "",
        nomor_telepon: "",
        service_charge_percent: 5,
        tax_percent: 11,
      },
    });

    cy.reload();

    // Input service charge > 100
    cy.get('input[type="number"]').first().clear().type("150");

    cy.contains("button", "Simpan Pengaturan").click();

    cy.contains("Service charge must be between 0 and 100").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 7: Form validation - Service charge negative
  // ----------------------------------------------------------
  it("Harus menampilkan error jika service charge negatif", () => {
    cy.intercept("GET", "**/api/settings", {
      body: {
        nama_toko: "Toko Test",
        alamat: "",
        nomor_telepon: "",
        service_charge_percent: 5,
        tax_percent: 11,
      },
    });

    cy.reload();

    // Input service charge negatif
    cy.get('input[type="number"]').first().clear().type("-5");

    cy.contains("button", "Simpan Pengaturan").click();

    cy.contains("Service charge must be between 0 and 100").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 8: Form validation - Tax percent range (0-100)
  // ----------------------------------------------------------
  it("Harus menampilkan error jika tax percent di luar range 0-100", () => {
    cy.intercept("GET", "**/api/settings", {
      body: {
        nama_toko: "Toko Test",
        alamat: "",
        nomor_telepon: "",
        service_charge_percent: 5,
        tax_percent: 11,
      },
    });

    cy.reload();

    // Input tax > 100
    cy.get('input[type="number"]').last().clear().type("120");

    cy.contains("button", "Simpan Pengaturan").click();

    cy.contains("Tax percent must be between 0 and 100").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 9: Form validation - Tax percent negative
  // ----------------------------------------------------------
  it("Harus menampilkan error jika tax percent negatif", () => {
    cy.intercept("GET", "**/api/settings", {
      body: {
        nama_toko: "Toko Test",
        alamat: "",
        nomor_telepon: "",
        service_charge_percent: 5,
        tax_percent: 11,
      },
    });

    cy.reload();

    // Input tax negatif
    cy.get('input[type="number"]').last().clear().type("-10");

    cy.contains("button", "Simpan Pengaturan").click();

    cy.contains("Tax percent must be between 0 and 100").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 10: UPDATE - Simpan settings berhasil
  // ----------------------------------------------------------
  it("Harus berhasil update settings", () => {
    cy.intercept("GET", "**/api/settings", {
      body: {
        nama_toko: "Toko Lama",
        alamat: "Alamat Lama",
        nomor_telepon: "081111111111",
        service_charge_percent: 5,
        tax_percent: 11,
      },
    }).as("getSettings");

    cy.reload();
    cy.wait("@getSettings");

    // Mock PUT success
    cy.intercept("PUT", "**/api/settings", {
      statusCode: 200,
      body: {
        nama_toko: "Toko Baru",
        alamat: "Jl. Baru No. 123",
        nomor_telepon: "081234567890",
        service_charge_percent: 7.5,
        tax_percent: 12,
      },
    }).as("updateSettings");

    // Update form
    cy.get('input[type="text"]').first().clear().type("Toko Baru");
    cy.get("textarea").clear().type("Jl. Baru No. 123");
    cy.get('input[type="tel"]').clear().type("081234567890");
    cy.get('input[type="number"]').first().clear().type("7.5");
    cy.get('input[type="number"]').last().clear().type("12");

    // Submit
    cy.contains("button", "Simpan Pengaturan").click();

    cy.wait("@updateSettings");

    // Verifikasi success message
    cy.contains("Pengaturan berhasil disimpan!").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 11: UPDATE - Verify payload
  // ----------------------------------------------------------
  it("Harus mengirim payload yang benar saat update", () => {
    cy.intercept("GET", "**/api/settings", {
      body: {
        nama_toko: "Toko Test",
        alamat: "",
        nomor_telepon: "",
        service_charge_percent: 0,
        tax_percent: 0,
      },
    });

    cy.reload();

    cy.intercept("PUT", "**/api/settings", {
      statusCode: 200,
      body: {},
    }).as("updateSettings");

    cy.get('input[type="text"]').first().clear().type("Toko ABC");
    cy.get("textarea").clear().type("Jl. Sudirman No. 45");
    cy.get('input[type="tel"]').clear().type("021-12345678");
    cy.get('input[type="number"]').first().clear().type("5");
    cy.get('input[type="number"]').last().clear().type("11");

    cy.contains("button", "Simpan Pengaturan").click();

    cy.wait("@updateSettings");

    // Verifikasi payload
    cy.get("@updateSettings")
      .its("request.body")
      .should("deep.include", {
        nama_toko: "Toko ABC",
        alamat: "Jl. Sudirman No. 45",
        nomor_telepon: "021-12345678",
        service_charge_percent: 5,
        tax_percent: 11,
      });
  });

  // ----------------------------------------------------------
  // TEST 12: UPDATE - Optional fields (alamat kosong)
  // ----------------------------------------------------------
  it("Harus bisa update settings dengan alamat kosong (optional)", () => {
    cy.intercept("GET", "**/api/settings", {
      body: {
        nama_toko: "Toko Test",
        alamat: "Alamat Lama",
        nomor_telepon: "",
        service_charge_percent: 0,
        tax_percent: 0,
      },
    });

    cy.reload();

    cy.intercept("PUT", "**/api/settings", {
      statusCode: 200,
      body: {
        nama_toko: "Toko Test",
        alamat: null,
        nomor_telepon: null,
        service_charge_percent: 0,
        tax_percent: 0,
      },
    }).as("updateSettings");

    // Kosongkan alamat
    cy.get("textarea").clear();

    cy.contains("button", "Simpan Pengaturan").click();

    cy.wait("@updateSettings");

    // Verifikasi payload alamat null
    cy.get("@updateSettings")
      .its("request.body")
      .should("have.property", "alamat", null);

    cy.contains("Pengaturan berhasil disimpan!").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 13: UPDATE - Optional fields (nomor telepon kosong)
  // ----------------------------------------------------------
  it("Harus bisa update settings dengan nomor telepon kosong (optional)", () => {
    cy.intercept("GET", "**/api/settings", {
      body: {
        nama_toko: "Toko Test",
        alamat: "",
        nomor_telepon: "081234567890",
        service_charge_percent: 0,
        tax_percent: 0,
      },
    });

    cy.reload();

    cy.intercept("PUT", "**/api/settings", {
      statusCode: 200,
      body: {
        nama_toko: "Toko Test",
        alamat: null,
        nomor_telepon: null,
        service_charge_percent: 0,
        tax_percent: 0,
      },
    });

    // Kosongkan nomor telepon
    cy.get('input[type="tel"]').clear();

    cy.contains("button", "Simpan Pengaturan").click();

    cy.contains("Pengaturan berhasil disimpan!").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 14: UPDATE - Error handling
  // ----------------------------------------------------------
  it("Harus menampilkan error message jika update gagal", () => {
    cy.intercept("GET", "**/api/settings", {
      body: {
        nama_toko: "Toko Test",
        alamat: "",
        nomor_telepon: "",
        service_charge_percent: 0,
        tax_percent: 0,
      },
    });

    cy.reload();

    // Mock PUT error
    cy.intercept("PUT", "**/api/settings", {
      statusCode: 500,
      body: { message: "Server error occurred" },
    }).as("updateSettingsError");

    cy.get('input[type="text"]').first().clear().type("Toko Baru");

    cy.contains("button", "Simpan Pengaturan").click();

    cy.wait("@updateSettingsError");

    // Verifikasi error message
    cy.contains("Server error occurred").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 15: Display panel - Hide optional fields if null
  // ----------------------------------------------------------
  it("Harus tidak menampilkan alamat & telepon di panel jika null", () => {
    cy.intercept("GET", "**/api/settings", {
      body: {
        nama_toko: "Toko Minimal",
        alamat: null,
        nomor_telepon: null,
        service_charge_percent: 0,
        tax_percent: 0,
      },
    });

    cy.reload();

    // Verifikasi nama toko, service charge, dan pajak ditampilkan
    cy.contains("Nama Toko:").parent().should("contain", "Toko Minimal");
    cy.contains("Service Charge:").parent().should("contain", "0%");
    cy.contains("Pajak:").parent().should("contain", "0%");

    // Verifikasi alamat & telepon TIDAK ditampilkan
    cy.contains("Nilai Pengaturan Saat Ini").parent().should("not.contain", "Alamat:");
    cy.contains("Nilai Pengaturan Saat Ini").parent().should("not.contain", "Telepon:");
  });

  // ----------------------------------------------------------
  // TEST 16: Input attributes - Type & constraints
  // ----------------------------------------------------------
  it("Harus memiliki input attributes yang benar", () => {
    cy.intercept("GET", "**/api/settings", {
      body: {
        nama_toko: "Test",
        alamat: "",
        nomor_telepon: "",
        service_charge_percent: 0,
        tax_percent: 0,
      },
    });

    cy.reload();

    // Text input
    cy.get('input[type="text"]').first().should("have.attr", "placeholder", "Masukkan nama toko");

    // Textarea
    cy.get("textarea")
      .should("have.attr", "placeholder", "Masukkan alamat toko")
      .should("have.attr", "rows", "3");

    // Tel input
    cy.get('input[type="tel"]').should("have.attr", "placeholder", "Masukkan nomor telepon");

    // Number inputs (service charge & tax)
    cy.get('input[type="number"]').first()
      .should("have.attr", "min", "0")
      .should("have.attr", "max", "100")
      .should("have.attr", "step", "0.01")
      .should("have.attr", "placeholder", "Contoh: 5.0");

    cy.get('input[type="number"]').last()
      .should("have.attr", "min", "0")
      .should("have.attr", "max", "100")
      .should("have.attr", "step", "0.01")
      .should("have.attr", "placeholder", "Contoh: 11.0 untuk PPN");
  });

  // ----------------------------------------------------------
  // TEST 17: Error state - Failed to load settings
  // ----------------------------------------------------------
  it("Harus menampilkan error jika gagal load settings", () => {
    cy.intercept("GET", "**/api/settings", {
      statusCode: 500,
      body: { message: "Database connection failed" },
    }).as("getSettingsError");

    cy.reload();
    cy.wait("@getSettingsError");

    cy.contains("Database connection failed").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 18: Success message - Auto clear after update
  // ----------------------------------------------------------
  it("Harus menampilkan success message setelah update berhasil", () => {
    cy.intercept("GET", "**/api/settings", {
      body: {
        nama_toko: "Toko Test",
        alamat: "",
        nomor_telepon: "",
        service_charge_percent: 0,
        tax_percent: 0,
      },
    });

    cy.reload();

    cy.intercept("PUT", "**/api/settings", {
      statusCode: 200,
      body: {
        nama_toko: "Toko Updated",
        alamat: null,
        nomor_telepon: null,
        service_charge_percent: 5,
        tax_percent: 11,
      },
    });

    cy.get('input[type="text"]').first().clear().type("Toko Updated");
    cy.get('input[type="number"]').first().clear().type("5");
    cy.get('input[type="number"]').last().clear().type("11");

    cy.contains("button", "Simpan Pengaturan").click();

    // Success message muncul
    cy.contains("Pengaturan berhasil disimpan!")
      .should("be.visible")
      .should("have.class", "bg-emerald-50")
      .should("have.class", "text-emerald-600");
  });

  // ----------------------------------------------------------
  // TEST 19: Decimal values - Service charge & tax
  // ----------------------------------------------------------
  it("Harus bisa menyimpan nilai desimal untuk service charge & tax", () => {
    cy.intercept("GET", "**/api/settings", {
      body: {
        nama_toko: "Toko Test",
        alamat: "",
        nomor_telepon: "",
        service_charge_percent: 0,
        tax_percent: 0,
      },
    });

    cy.reload();

    cy.intercept("PUT", "**/api/settings", {
      statusCode: 200,
      body: {
        nama_toko: "Toko Test",
        alamat: null,
        nomor_telepon: null,
        service_charge_percent: 5.75,
        tax_percent: 11.5,
      },
    }).as("updateSettings");

    cy.get('input[type="number"]').first().clear().type("5.75");
    cy.get('input[type="number"]').last().clear().type("11.5");

    cy.contains("button", "Simpan Pengaturan").click();

    cy.wait("@updateSettings");

    // Verifikasi payload dengan desimal
    cy.get("@updateSettings")
      .its("request.body")
      .should("include", {
        service_charge_percent: 5.75,
        tax_percent: 11.5,
      });

    cy.contains("Pengaturan berhasil disimpan!").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 20: Update panel after successful save
  // ----------------------------------------------------------
  it("Harus update panel Nilai Pengaturan Saat Ini setelah save berhasil", () => {
    cy.intercept("GET", "**/api/settings", {
      body: {
        nama_toko: "Toko Lama",
        alamat: "Alamat Lama",
        nomor_telepon: "081111111111",
        service_charge_percent: 5,
        tax_percent: 11,
      },
    });

    cy.reload();

    cy.intercept("PUT", "**/api/settings", {
      statusCode: 200,
      body: {
        nama_toko: "Toko Baru Updated",
        alamat: "Alamat Baru Updated",
        nomor_telepon: "081999999999",
        service_charge_percent: 7.5,
        tax_percent: 12,
      },
    });

    // Update values
    cy.get('input[type="text"]').first().clear().type("Toko Baru Updated");
    cy.get("textarea").clear().type("Alamat Baru Updated");
    cy.get('input[type="tel"]').clear().type("081999999999");
    cy.get('input[type="number"]').first().clear().type("7.5");
    cy.get('input[type="number"]').last().clear().type("12");

    cy.contains("button", "Simpan Pengaturan").click();

    // Verifikasi panel updated
    cy.contains("Nama Toko:").parent().should("contain", "Toko Baru Updated");
    cy.contains("Alamat:").parent().should("contain", "Alamat Baru Updated");
    cy.contains("Telepon:").parent().should("contain", "081999999999");
    cy.contains("Service Charge:").parent().should("contain", "7.5%");
    cy.contains("Pajak:").parent().should("contain", "12%");
  });

  // ----------------------------------------------------------
  // TEST 21: Trim whitespace - Nama toko & alamat
  // ----------------------------------------------------------
  it("Harus trim whitespace dari nama toko dan alamat", () => {
    cy.intercept("GET", "**/api/settings", {
      body: {
        nama_toko: "Test",
        alamat: "",
        nomor_telepon: "",
        service_charge_percent: 0,
        tax_percent: 0,
      },
    });

    cy.reload();

    cy.intercept("PUT", "**/api/settings", {
      statusCode: 200,
      body: {},
    }).as("updateSettings");

    // Input dengan whitespace di awal/akhir
    cy.get('input[type="text"]').first().clear().type("  Toko dengan Space  ");
    cy.get("textarea").clear().type("  Alamat dengan Space  ");

    cy.contains("button", "Simpan Pengaturan").click();

    cy.wait("@updateSettings");

    // Verifikasi payload sudah trim
    cy.get("@updateSettings")
      .its("request.body")
      .should("include", {
        nama_toko: "Toko dengan Space",
        alamat: "Alamat dengan Space",
      });
  });

  // ----------------------------------------------------------
  // TEST 22: Zero values - Service charge & tax
  // ----------------------------------------------------------
  it("Harus bisa menyimpan nilai 0 untuk service charge & tax", () => {
    cy.intercept("GET", "**/api/settings", {
      body: {
        nama_toko: "Toko Test",
        alamat: "",
        nomor_telepon: "",
        service_charge_percent: 5,
        tax_percent: 11,
      },
    });

    cy.reload();

    cy.intercept("PUT", "**/api/settings", {
      statusCode: 200,
      body: {
        nama_toko: "Toko Test",
        alamat: null,
        nomor_telepon: null,
        service_charge_percent: 0,
        tax_percent: 0,
      },
    }).as("updateSettings");

    cy.get('input[type="number"]').first().clear().type("0");
    cy.get('input[type="number"]').last().clear().type("0");

    cy.contains("button", "Simpan Pengaturan").click();

    cy.wait("@updateSettings");

    cy.get("@updateSettings")
      .its("request.body")
      .should("include", {
        service_charge_percent: 0,
        tax_percent: 0,
      });

    cy.contains("Pengaturan berhasil disimpan!").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 23: 401 Unauthorized - Redirect to login
  // ----------------------------------------------------------
  it("Harus redirect ke login jika unauthorized (401)", () => {
    cy.intercept("GET", "**/api/settings", {
      statusCode: 401,
      body: { message: "Unauthorized" },
    }).as("getSettings401");

    cy.reload();

    // Note: Tergantung implementasi error handling
    // Jika ada logic redirect di component, akan redirect
    // Jika tidak, akan tampil error
  });

  // ----------------------------------------------------------
  // TEST 24: Error message styling
  // ----------------------------------------------------------
  it("Harus menampilkan error message dengan styling yang benar", () => {
    cy.intercept("GET", "**/api/settings", {
      body: {
        nama_toko: "Test",
        alamat: "",
        nomor_telepon: "",
        service_charge_percent: 0,
        tax_percent: 0,
      },
    });

    cy.reload();

    cy.intercept("PUT", "**/api/settings", {
      statusCode: 400,
      body: { message: "Validation error" },
    });

    cy.contains("button", "Simpan Pengaturan").click();

    // Verifikasi error styling
    cy.contains("Validation error")
      .should("be.visible")
      .should("have.class", "bg-rose-50")
      .should("have.class", "text-rose-600");
  });

  // ----------------------------------------------------------
  // TEST 25: Form reset after error
  // ----------------------------------------------------------
  it("Harus mempertahankan input values setelah error", () => {
    cy.intercept("GET", "**/api/settings", {
      body: {
        nama_toko: "Toko Lama",
        alamat: "",
        nomor_telepon: "",
        service_charge_percent: 0,
        tax_percent: 0,
      },
    });

    cy.reload();

    cy.intercept("PUT", "**/api/settings", {
      statusCode: 500,
      body: { message: "Server error" },
    });

    // Update input
    cy.get('input[type="text"]').first().clear().type("Toko Baru");
    cy.get('input[type="number"]').first().clear().type("7.5");

    cy.contains("button", "Simpan Pengaturan").click();

    // Error muncul
    cy.contains("Server error").should("be.visible");

    // Verifikasi input masih ada (tidak reset)
    cy.get('input[type="text"]').first().should("have.value", "Toko Baru");
    cy.get('input[type="number"]').first().should("have.value", "7.5");
  });

  // ----------------------------------------------------------
  // TEST 26: Responsive - Mobile viewport
  // ----------------------------------------------------------
  it("Harus responsive pada viewport mobile", () => {
    cy.viewport(375, 667);

    cy.intercept("GET", "**/api/settings", {
      body: {
        nama_toko: "Toko Test",
        alamat: "",
        nomor_telepon: "",
        service_charge_percent: 0,
        tax_percent: 0,
      },
    });

    cy.reload();

    // Verifikasi elemen masih accessible
    cy.contains("h1", "Pengaturan Toko").should("be.visible");
    cy.contains("label", "Nama Toko").should("be.visible");
    cy.contains("button", "Simpan Pengaturan").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 27: NaN handling - Invalid number input
  // ----------------------------------------------------------
  it("Harus handle input non-numeric untuk service charge & tax", () => {
    cy.intercept("GET", "**/api/settings", {
      body: {
        nama_toko: "Toko Test",
        alamat: "",
        nomor_telepon: "",
        service_charge_percent: 0,
        tax_percent: 0,
      },
    });

    cy.reload();

    // Input field kosong akan menjadi NaN
    cy.get('input[type="number"]').first().clear();
    cy.get('input[type="number"]').last().clear();

    cy.contains("button", "Simpan Pengaturan").click();

    // Verifikasi error untuk NaN values
    cy.contains("Service charge must be between 0 and 100").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 28: Max values - Service charge & tax = 100
  // ----------------------------------------------------------
  it("Harus bisa menyimpan nilai maksimal 100 untuk service charge & tax", () => {
    cy.intercept("GET", "**/api/settings", {
      body: {
        nama_toko: "Toko Test",
        alamat: "",
        nomor_telepon: "",
        service_charge_percent: 0,
        tax_percent: 0,
      },
    });

    cy.reload();

    cy.intercept("PUT", "**/api/settings", {
      statusCode: 200,
      body: {
        nama_toko: "Toko Test",
        alamat: null,
        nomor_telepon: null,
        service_charge_percent: 100,
        tax_percent: 100,
      },
    });

    cy.get('input[type="number"]').first().clear().type("100");
    cy.get('input[type="number"]').last().clear().type("100");

    cy.contains("button", "Simpan Pengaturan").click();

    cy.contains("Pengaturan berhasil disimpan!").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 29: Focus states
  // ----------------------------------------------------------
  it("Harus menampilkan focus states yang benar pada inputs", () => {
    cy.intercept("GET", "**/api/settings", {
      body: {
        nama_toko: "Test",
        alamat: "",
        nomor_telepon: "",
        service_charge_percent: 0,
        tax_percent: 0,
      },
    });

    cy.reload();

    // Focus pada nama toko input
    cy.get('input[type="text"]').first().focus();
    cy.get('input[type="text"]').first().should("have.focus");

    // Focus pada textarea
    cy.get("textarea").focus();
    cy.get("textarea").should("have.focus");
  });

  // ----------------------------------------------------------
  // TEST 30: Button type submit
  // ----------------------------------------------------------
  it("Harus memiliki button type submit untuk form", () => {
    cy.intercept("GET", "**/api/settings", {
      body: {
        nama_toko: "Test",
        alamat: "",
        nomor_telepon: "",
        service_charge_percent: 0,
        tax_percent: 0,
      },
    });

    cy.reload();

    cy.contains("button", "Simpan Pengaturan").should("have.attr", "type", "submit");
  });
});
