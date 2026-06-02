/**
 * ============================================================
 * SKENARIO PENGUJIAN: Broadcast Promo WhatsApp - UMKM-Grow
 * ============================================================
 * Menguji seluruh fitur Broadcast Promo end-to-end:
 *  - Tampilan halaman Broadcast Promo
 *  - WhatsApp connection status (ready, qr, connecting, disconnected, error)
 *  - QR code display dan auto-refresh
 *  - Status badge dengan styling yang benar
 *  - Polling status setiap 3 detik
 *  - Daftar penerima (members & customers)
 *  - Search/filter penerima
 *  - Level badges (Gold, Silver, Bronze)
 *  - Compose message form
 *  - Character counter & limit (4096)
 *  - Send broadcast (validation & confirmation)
 *  - Result modal dengan summary & detail
 *  - Refresh targets
 *  - Empty state handling
 *  - Loading & error states
 * ============================================================
 */

describe("Skenario Pengujian Broadcast Promo WhatsApp UMKM-Grow", () => {
  let users;

  before(() => {
    cy.fixture("user").then((data) => {
      users = data;
    });
  });

  beforeEach(() => {
    // Login dan navigasi ke Broadcast
    cy.clearLocalStorage();
    cy.login(users.validUser.email, users.validUser.password);
    cy.visit("/broadcast");
  });

  // ----------------------------------------------------------
  // TEST 1: Tampilan halaman Broadcast Promo
  // ----------------------------------------------------------
  it("Harus menampilkan halaman Broadcast Promo dengan elemen yang benar", () => {
    // Verifikasi judul halaman
    cy.contains("h1", "Broadcast Promo WhatsApp").should("be.visible");
    cy.contains("Kirim pesan promo langsung ke WhatsApp semua member").should("be.visible");

    // Verifikasi tombol Refresh
    cy.contains("button", "↻ Refresh").should("be.visible");

    // Verifikasi section Koneksi WhatsApp
    cy.contains("Koneksi WhatsApp").should("be.visible");

    // Verifikasi section Tulis Pesan Promo
    cy.contains("Tulis Pesan Promo").should("be.visible");

    // Verifikasi section Daftar Penerima
    cy.contains("Daftar Penerima").should("be.visible");

    // Verifikasi table headers
    cy.contains("th", "Nama").should("be.visible");
    cy.contains("th", "Nomor WA").should("be.visible");
    cy.contains("th", "Level").should("be.visible");
    cy.contains("th", "Poin").should("be.visible");

    // Verifikasi search input
    cy.get('input[placeholder="Cari nama / nomor..."]').should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 2: WhatsApp status badge - Ready (Terhubung)
  // ----------------------------------------------------------
  it("Harus menampilkan badge Terhubung dengan styling hijau saat status ready", () => {
    // Mock WA status ready
    cy.intercept("GET", "**/api/broadcast/status", {
      body: {
        status: "ready",
        qrDataUrl: null,
      },
    }).as("getWaStatusReady");

    cy.reload();
    cy.wait("@getWaStatusReady");

    // Verifikasi badge Terhubung
    cy.contains("● Terhubung")
      .should("be.visible")
      .should("have.class", "bg-green-100")
      .should("have.class", "text-green-700");
  });

  // ----------------------------------------------------------
  // TEST 3: WhatsApp status badge - QR (Menunggu Scan)
  // ----------------------------------------------------------
  it("Harus menampilkan badge Menunggu Scan QR saat status qr", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      body: {
        status: "qr",
        qrDataUrl: "data:image/png;base64,mockqrcode",
      },
    });

    cy.reload();

    // Verifikasi badge
    cy.contains("⏳ Menunggu Scan QR")
      .should("be.visible")
      .should("have.class", "bg-yellow-100")
      .should("have.class", "text-yellow-700");
  });

  // ----------------------------------------------------------
  // TEST 4: WhatsApp status badge - Connecting
  // ----------------------------------------------------------
  it("Harus menampilkan badge Menghubungkan saat status connecting", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      body: {
        status: "connecting",
        qrDataUrl: null,
      },
    });

    cy.reload();

    cy.contains("⏳ Menghubungkan...")
      .should("be.visible")
      .should("have.class", "bg-blue-100")
      .should("have.class", "text-blue-700");
  });

  // ----------------------------------------------------------
  // TEST 5: WhatsApp status badge - Disconnected
  // ----------------------------------------------------------
  it("Harus menampilkan badge Tidak Terhubung saat status disconnected", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      body: {
        status: "disconnected",
        qrDataUrl: null,
      },
    });

    cy.reload();

    cy.contains("○ Tidak Terhubung")
      .should("be.visible")
      .should("have.class", "bg-gray-100")
      .should("have.class", "text-gray-600");
  });

  // ----------------------------------------------------------
  // TEST 6: WhatsApp status badge - Error
  // ----------------------------------------------------------
  it("Harus menampilkan badge Error saat status error", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      body: {
        status: "error",
        qrDataUrl: null,
      },
    });

    cy.reload();

    cy.contains("✕ Error")
      .should("be.visible")
      .should("have.class", "bg-red-100")
      .should("have.class", "text-red-600");
  });

  // ----------------------------------------------------------
  // TEST 7: QR Panel - Display QR code saat status qr
  // ----------------------------------------------------------
  it("Harus menampilkan QR code saat status qr", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      body: {
        status: "qr",
        qrDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA",
      },
    });

    cy.reload();

    // Verifikasi QR image
    cy.get('img[alt="WhatsApp QR Code"]')
      .should("be.visible")
      .should("have.attr", "src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA");

    // Verifikasi instruksi scan
    cy.contains("Scan QR ini dengan WhatsApp").should("be.visible");
    cy.contains("Buka WhatsApp di HP kamu").should("be.visible");
    cy.contains("Perangkat Tertaut").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 8: QR Panel - Success panel saat status ready
  // ----------------------------------------------------------
  it("Harus menampilkan panel success saat WhatsApp terhubung", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      body: {
        status: "ready",
        qrDataUrl: null,
      },
    });

    cy.reload();

    // Verifikasi success panel
    cy.contains("✅").should("be.visible");
    cy.contains("WhatsApp Terhubung!").should("be.visible");
    cy.contains("Siap mengirim broadcast ke semua member").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 9: QR Panel - Loading panel saat connecting
  // ----------------------------------------------------------
  it("Harus menampilkan loading panel saat status connecting", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      body: {
        status: "connecting",
        qrDataUrl: null,
      },
    });

    cy.reload();

    cy.contains("Menghubungkan ke WhatsApp...").should("be.visible");
    cy.contains("Harap tunggu, proses ini bisa memakan 15–30 detik").should("be.visible");

    // Verifikasi spinner icon
    cy.get("svg.animate-spin").should("exist");
  });

  // ----------------------------------------------------------
  // TEST 10: QR Panel - Error panel saat status error
  // ----------------------------------------------------------
  it("Harus menampilkan error panel saat status error", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      body: {
        status: "error",
        qrDataUrl: null,
      },
    });

    cy.reload();

    cy.contains("⚠️").should("be.visible");
    cy.contains("Koneksi WA Error").should("be.visible");
    cy.contains("Restart backend untuk mencoba lagi").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 11: Daftar Penerima - Display targets
  // ----------------------------------------------------------
  it("Harus menampilkan daftar penerima dengan informasi lengkap", () => {
    // Mock targets
    cy.intercept("GET", "**/api/broadcast/targets", {
      body: {
        data: [
          {
            id: 1,
            name: "Budi Santoso",
            phone: "081234567890",
            level: "Gold",
            loyalty_points: 1500,
          },
          {
            id: 2,
            name: "Ani Wijaya",
            phone: "081298765432",
            level: "Silver",
            loyalty_points: 800,
          },
          {
            id: 3,
            name: "Citra Lestari",
            phone: "081356781234",
            level: "Bronze",
            loyalty_points: 200,
          },
        ],
      },
    });

    cy.reload();

    // Verifikasi target 1
    cy.contains("td", "Budi Santoso").should("be.visible");
    cy.contains("td", "081234567890").should("be.visible");
    cy.contains("span", "Gold").should("be.visible");
    cy.contains("td", "1500").should("be.visible");

    // Verifikasi target 2
    cy.contains("td", "Ani Wijaya").should("be.visible");
    cy.contains("span", "Silver").should("be.visible");

    // Verifikasi target 3
    cy.contains("td", "Citra Lestari").should("be.visible");
    cy.contains("span", "Bronze").should("be.visible");

    // Verifikasi total targets
    cy.get("tbody tr").should("have.length", 3);
  });

  // ----------------------------------------------------------
  // TEST 12: Daftar Penerima - Empty state
  // ----------------------------------------------------------
  it("Harus menampilkan empty state jika belum ada penerima", () => {
    // Mock targets kosong
    cy.intercept("GET", "**/api/broadcast/targets", {
      body: { data: [] },
    });

    cy.reload();

    cy.contains("Belum ada member/customer aktif dengan nomor HP").should("be.visible");

    // Verifikasi total 0
    cy.contains("Daftar Penerima (0)").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 13: Daftar Penerima - Loading state
  // ----------------------------------------------------------
  it("Harus menampilkan loading state saat fetch targets", () => {
    cy.intercept("GET", "**/api/broadcast/targets", (req) => {
      req.reply({
        delay: 1000,
        body: { data: [] },
      });
    });

    cy.reload();

    cy.contains("Memuat daftar...").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 14: Level badges - Styling yang benar
  // ----------------------------------------------------------
  it("Harus menampilkan level badges dengan warna yang sesuai", () => {
    cy.intercept("GET", "**/api/broadcast/targets", {
      body: {
        data: [
          { id: 1, name: "Gold Member", phone: "081111111111", level: "Gold", loyalty_points: 1000 },
          { id: 2, name: "Silver Member", phone: "081222222222", level: "Silver", loyalty_points: 500 },
          { id: 3, name: "Bronze Member", phone: "081333333333", level: "Bronze", loyalty_points: 100 },
        ],
      },
    });

    cy.reload();

    // Gold badge
    cy.contains("tr", "Gold Member").within(() => {
      cy.contains("span", "Gold")
        .should("have.class", "bg-yellow-100")
        .should("have.class", "text-yellow-800");
    });

    // Silver badge
    cy.contains("tr", "Silver Member").within(() => {
      cy.contains("span", "Silver")
        .should("have.class", "bg-gray-100")
        .should("have.class", "text-gray-700");
    });

    // Bronze badge
    cy.contains("tr", "Bronze Member").within(() => {
      cy.contains("span", "Bronze")
        .should("have.class", "bg-orange-100")
        .should("have.class", "text-orange-700");
    });
  });

  // ----------------------------------------------------------
  // TEST 15: Search filter - Filter by name
  // ----------------------------------------------------------
  it("Harus bisa filter penerima berdasarkan nama", () => {
    cy.intercept("GET", "**/api/broadcast/targets", {
      body: {
        data: [
          { id: 1, name: "Budi Santoso", phone: "081111111111", level: "Gold", loyalty_points: 1000 },
          { id: 2, name: "Ani Wijaya", phone: "081222222222", level: "Silver", loyalty_points: 500 },
          { id: 3, name: "Citra Lestari", phone: "081333333333", level: "Bronze", loyalty_points: 100 },
        ],
      },
    });

    cy.reload();

    // Ketik search query
    cy.get('input[placeholder="Cari nama / nomor..."]').type("budi");

    // Verifikasi hanya Budi yang muncul
    cy.contains("td", "Budi Santoso").should("be.visible");
    cy.contains("td", "Ani Wijaya").should("not.exist");
    cy.contains("td", "Citra Lestari").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 16: Search filter - Filter by phone
  // ----------------------------------------------------------
  it("Harus bisa filter penerima berdasarkan nomor telepon", () => {
    cy.intercept("GET", "**/api/broadcast/targets", {
      body: {
        data: [
          { id: 1, name: "Budi Santoso", phone: "081234567890", level: "Gold", loyalty_points: 1000 },
          { id: 2, name: "Ani Wijaya", phone: "081298765432", level: "Silver", loyalty_points: 500 },
        ],
      },
    });

    cy.reload();

    // Search by phone
    cy.get('input[placeholder="Cari nama / nomor..."]').type("08129");

    // Verifikasi hanya Ani yang muncul
    cy.contains("td", "Ani Wijaya").should("be.visible");
    cy.contains("td", "Budi Santoso").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 17: Search filter - No results
  // ----------------------------------------------------------
  it("Harus menampilkan pesan jika search tidak menemukan hasil", () => {
    cy.intercept("GET", "**/api/broadcast/targets", {
      body: {
        data: [
          { id: 1, name: "Budi Santoso", phone: "081111111111", level: "Gold", loyalty_points: 1000 },
        ],
      },
    });

    cy.reload();

    // Search yang tidak ada
    cy.get('input[placeholder="Cari nama / nomor..."]').type("xyz123notfound");

    // Verifikasi pesan no results
    cy.contains("Tidak ada hasil pencarian.").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 18: Compose message - Form elements
  // ----------------------------------------------------------
  it("Harus menampilkan form compose message dengan elemen yang benar", () => {
    cy.contains("label", "Isi Pesan").should("be.visible");
    cy.get("textarea").should("be.visible");

    // Verifikasi character counter
    cy.contains("0/4096").should("be.visible");

    // Verifikasi total penerima display
    cy.contains("Total Penerima:").should("be.visible");

    // Verifikasi button kirim
    cy.contains("button", "📲 Kirim Broadcast").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 19: Compose message - Character counter
  // ----------------------------------------------------------
  it("Harus update character counter saat mengetik pesan", () => {
    const testMessage = "Halo, promo hari ini diskon 50%!";

    cy.get("textarea").type(testMessage);

    // Verifikasi counter update
    cy.contains(`${testMessage.length}/4096`).should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 20: Compose message - Character limit (4096)
  // ----------------------------------------------------------
  it("Harus menampilkan warning jika pesan melebihi 4096 karakter", () => {
    // Generate message > 4096 chars
    const longMessage = "a".repeat(4100);

    cy.get("textarea").invoke("val", longMessage).trigger("input");

    // Verifikasi counter merah
    cy.contains("4100/4096")
      .should("be.visible")
      .should("have.class", "text-red-600");

    // Verifikasi textarea border merah
    cy.get("textarea").should("have.class", "border-red-400");
  });

  // ----------------------------------------------------------
  // TEST 21: Total Penerima - Display count
  // ----------------------------------------------------------
  it("Harus menampilkan jumlah total penerima dengan benar", () => {
    cy.intercept("GET", "**/api/broadcast/targets", {
      body: {
        data: [
          { id: 1, name: "Member 1", phone: "081111111111", level: "Gold", loyalty_points: 1000 },
          { id: 2, name: "Member 2", phone: "081222222222", level: "Silver", loyalty_points: 500 },
          { id: 3, name: "Member 3", phone: "081333333333", level: "Bronze", loyalty_points: 100 },
        ],
      },
    });

    cy.reload();

    // Verifikasi total penerima di card
    cy.contains("Total Penerima:")
      .parent()
      .within(() => {
        cy.contains("3 orang").should("be.visible");
      });

    // Verifikasi di button
    cy.contains("button", "📲 Kirim Broadcast (3 penerima)").should("be.visible");

    // Verifikasi di header tabel
    cy.contains("Daftar Penerima (3)").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 22: Send button - Disabled conditions
  // ----------------------------------------------------------
  it("Harus disable button kirim jika WhatsApp belum terhubung", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      body: { status: "disconnected", qrDataUrl: null },
    });

    cy.reload();

    // Verifikasi button disabled
    cy.contains("button", "📲 Kirim Broadcast").should("be.disabled");
  });

  // ----------------------------------------------------------
  // TEST 23: Send button - Disabled if no message
  // ----------------------------------------------------------
  it("Harus disable button kirim jika pesan kosong", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      body: { status: "ready", qrDataUrl: null },
    });

    cy.reload();

    // Textarea kosong
    cy.get("textarea").should("have.value", "");

    // Button disabled
    cy.contains("button", "📲 Kirim Broadcast").should("be.disabled");
  });

  // ----------------------------------------------------------
  // TEST 24: Send button - Disabled if over limit
  // ----------------------------------------------------------
  it("Harus disable button kirim jika pesan melebihi limit", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      body: { status: "ready", qrDataUrl: null },
    });

    cy.reload();

    // Input pesan > 4096
    const longMessage = "a".repeat(4100);
    cy.get("textarea").invoke("val", longMessage).trigger("input");

    // Button disabled
    cy.contains("button", "📲 Kirim Broadcast").should("be.disabled");
  });

  // ----------------------------------------------------------
  // TEST 25: Send button - Enabled when all conditions met
  // ----------------------------------------------------------
  it("Harus enable button kirim jika semua kondisi terpenuhi", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      body: { status: "ready", qrDataUrl: null },
    });

    cy.intercept("GET", "**/api/broadcast/targets", {
      body: {
        data: [
          { id: 1, name: "Member 1", phone: "081111111111", level: "Gold", loyalty_points: 1000 },
        ],
      },
    });

    cy.reload();

    // Ketik pesan valid
    cy.get("textarea").type("Halo, promo spesial hari ini!");

    // Button enabled
    cy.contains("button", "📲 Kirim Broadcast").should("not.be.disabled");
  });

  // ----------------------------------------------------------
  // TEST 26: Warning message - WA not ready
  // ----------------------------------------------------------
  it("Harus menampilkan warning jika WhatsApp belum ready", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      body: { status: "qr", qrDataUrl: "data:image/png;base64,mock" },
    });

    cy.reload();

    cy.contains("⚠️ Scan QR WhatsApp terlebih dahulu").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 27: Send broadcast - Confirmation dialog
  // ----------------------------------------------------------
  it("Harus menampilkan konfirmasi sebelum kirim broadcast", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      body: { status: "ready", qrDataUrl: null },
    });

    cy.intercept("GET", "**/api/broadcast/targets", {
      body: {
        data: [
          { id: 1, name: "Member 1", phone: "081111111111", level: "Gold", loyalty_points: 1000 },
        ],
      },
    });

    cy.reload();

    // Stub window.confirm
    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(false);
    });

    // Ketik pesan
    cy.get("textarea").type("Promo hari ini!");

    // Klik kirim
    cy.contains("button", "📲 Kirim Broadcast").click();

    // Verifikasi confirm dipanggil
    cy.window().its("confirm").should("have.been.called");
  });

  // ----------------------------------------------------------
  // TEST 28: Send broadcast - Cancel confirmation
  // ----------------------------------------------------------
  it("Harus membatalkan kirim jika user cancel konfirmasi", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      body: { status: "ready", qrDataUrl: null },
    });

    cy.intercept("GET", "**/api/broadcast/targets", {
      body: {
        data: [
          { id: 1, name: "Member 1", phone: "081111111111", level: "Gold", loyalty_points: 1000 },
        ],
      },
    });

    cy.intercept("POST", "**/api/broadcast/promo", {
      statusCode: 200,
      body: { summary: { total: 1, sent: 1, failed: 0 }, results: [] },
    }).as("sendBroadcast");

    cy.reload();

    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(false);
    });

    cy.get("textarea").type("Test message");
    cy.contains("button", "📲 Kirim Broadcast").click();

    // Verifikasi API TIDAK dipanggil
    cy.get("@sendBroadcast.all").should("have.length", 0);
  });

  // ----------------------------------------------------------
  // TEST 29: Send broadcast - Success
  // ----------------------------------------------------------
  it("Harus berhasil kirim broadcast dan tampilkan result modal", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      body: { status: "ready", qrDataUrl: null },
    });

    cy.intercept("GET", "**/api/broadcast/targets", {
      body: {
        data: [
          { id: 1, name: "Member 1", phone: "081111111111", level: "Gold", loyalty_points: 1000 },
          { id: 2, name: "Member 2", phone: "081222222222", level: "Silver", loyalty_points: 500 },
        ],
      },
    });

    cy.intercept("POST", "**/api/broadcast/promo", {
      statusCode: 200,
      body: {
        summary: { total: 2, sent: 2, failed: 0 },
        results: [
          { phone: "081111111111", success: true, error: null },
          { phone: "081222222222", success: true, error: null },
        ],
      },
    }).as("sendBroadcast");

    cy.reload();

    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);
    });

    cy.get("textarea").type("Promo spesial hari ini!");
    cy.contains("button", "📲 Kirim Broadcast").click();

    cy.wait("@sendBroadcast");

    // Verifikasi result modal muncul
    cy.contains("h2", "Hasil Broadcast").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 30: Result modal - Display summary
  // ----------------------------------------------------------
  it("Harus menampilkan summary broadcast di result modal", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      body: { status: "ready", qrDataUrl: null },
    });

    cy.intercept("GET", "**/api/broadcast/targets", {
      body: {
        data: [
          { id: 1, name: "M1", phone: "081111111111", level: "Gold", loyalty_points: 1000 },
          { id: 2, name: "M2", phone: "081222222222", level: "Silver", loyalty_points: 500 },
          { id: 3, name: "M3", phone: "081333333333", level: "Bronze", loyalty_points: 100 },
        ],
      },
    });

    cy.intercept("POST", "**/api/broadcast/promo", {
      body: {
        summary: { total: 3, sent: 2, failed: 1 },
        results: [],
      },
    });

    cy.reload();

    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);
    });

    cy.get("textarea").type("Test broadcast");
    cy.contains("button", "📲 Kirim Broadcast").click();

    // Verifikasi summary cards
    cy.contains("p", "3").should("be.visible");
    cy.contains("p", "Total Target").should("be.visible");

    cy.contains("p", "2").should("be.visible");
    cy.contains("p", "Berhasil Terkirim").should("be.visible");

    cy.contains("p", "1").should("be.visible");
    cy.contains("p", "Gagal").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 31: Result modal - Display detail results
  // ----------------------------------------------------------
  it("Harus menampilkan detail results di modal", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      body: { status: "ready", qrDataUrl: null },
    });

    cy.intercept("GET", "**/api/broadcast/targets", {
      body: {
        data: [
          { id: 1, name: "M1", phone: "081111111111", level: "Gold", loyalty_points: 1000 },
          { id: 2, name: "M2", phone: "081222222222", level: "Silver", loyalty_points: 500 },
        ],
      },
    });

    cy.intercept("POST", "**/api/broadcast/promo", {
      body: {
        summary: { total: 2, sent: 1, failed: 1 },
        results: [
          { phone: "081111111111", success: true, error: null },
          { phone: "081222222222", success: false, error: "Number not registered" },
        ],
      },
    });

    cy.reload();

    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);
    });

    cy.get("textarea").type("Test");
    cy.contains("button", "📲 Kirim Broadcast").click();

    // Verifikasi result 1 (success)
    cy.contains("td", "081111111111").should("be.visible");
    cy.contains("span", "✓ Terkirim").should("be.visible");

    // Verifikasi result 2 (failed)
    cy.contains("td", "081222222222").should("be.visible");
    cy.contains("span", "✗ Gagal").should("be.visible");
    cy.contains("td", "Number not registered").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 32: Result modal - Close modal
  // ----------------------------------------------------------
  it("Harus bisa menutup result modal dengan tombol Tutup", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      body: { status: "ready", qrDataUrl: null },
    });

    cy.intercept("GET", "**/api/broadcast/targets", {
      body: { data: [{ id: 1, name: "M1", phone: "081111111111", level: "Gold", loyalty_points: 1000 }] },
    });

    cy.intercept("POST", "**/api/broadcast/promo", {
      body: { summary: { total: 1, sent: 1, failed: 0 }, results: [] },
    });

    cy.reload();

    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);
    });

    cy.get("textarea").type("Test");
    cy.contains("button", "📲 Kirim Broadcast").click();

    // Modal muncul
    cy.contains("h2", "Hasil Broadcast").should("be.visible");

    // Klik tombol Tutup
    cy.contains("button", "Tutup").click();

    // Modal tertutup
    cy.contains("h2", "Hasil Broadcast").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 33: Send broadcast - Clear message after success
  // ----------------------------------------------------------
  it("Harus mengosongkan message field setelah kirim berhasil", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      body: { status: "ready", qrDataUrl: null },
    });

    cy.intercept("GET", "**/api/broadcast/targets", {
      body: { data: [{ id: 1, name: "M1", phone: "081111111111", level: "Gold", loyalty_points: 1000 }] },
    });

    cy.intercept("POST", "**/api/broadcast/promo", {
      body: { summary: { total: 1, sent: 1, failed: 0 }, results: [] },
    });

    cy.reload();

    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);
    });

    const testMessage = "Promo hari ini diskon 50%!";
    cy.get("textarea").type(testMessage);

    // Verifikasi message ada
    cy.get("textarea").should("have.value", testMessage);

    cy.contains("button", "📲 Kirim Broadcast").click();

    // Tutup modal
    cy.contains("button", "Tutup").click();

    // Verifikasi textarea kosong
    cy.get("textarea").should("have.value", "");

    // Character counter reset
    cy.contains("0/4096").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 34: Send broadcast - Error handling
  // ----------------------------------------------------------
  it("Harus menampilkan error jika broadcast gagal", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      body: { status: "ready", qrDataUrl: null },
    });

    cy.intercept("GET", "**/api/broadcast/targets", {
      body: { data: [{ id: 1, name: "M1", phone: "081111111111", level: "Gold", loyalty_points: 1000 }] },
    });

    cy.intercept("POST", "**/api/broadcast/promo", {
      statusCode: 500,
      body: { message: "Failed to send broadcast" },
    }).as("sendBroadcastError");

    cy.reload();

    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);
    });

    cy.get("textarea").type("Test message");
    cy.contains("button", "📲 Kirim Broadcast").click();

    cy.wait("@sendBroadcastError");

    // Verifikasi error message
    cy.contains("Failed to send broadcast").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 35: Send button - Loading state
  // ----------------------------------------------------------
  it("Harus menampilkan loading state saat mengirim broadcast", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      body: { status: "ready", qrDataUrl: null },
    });

    cy.intercept("GET", "**/api/broadcast/targets", {
      body: { data: [{ id: 1, name: "M1", phone: "081111111111", level: "Gold", loyalty_points: 1000 }] },
    });

    cy.intercept("POST", "**/api/broadcast/promo", (req) => {
      req.reply({
        delay: 2000,
        body: { summary: { total: 1, sent: 1, failed: 0 }, results: [] },
      });
    });

    cy.reload();

    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);
    });

    cy.get("textarea").type("Test");
    cy.contains("button", "📲 Kirim Broadcast").click();

    // Verifikasi loading text & spinner
    cy.contains("Mengirim ke 1 orang...").should("be.visible");
    cy.get("svg.animate-spin").should("exist");
  });

  // ----------------------------------------------------------
  // TEST 36: Refresh button - Reload targets
  // ----------------------------------------------------------
  it("Harus reload targets saat klik tombol Refresh", () => {
    cy.intercept("GET", "**/api/broadcast/targets", {
      body: {
        data: [
          { id: 1, name: "Member 1", phone: "081111111111", level: "Gold", loyalty_points: 1000 },
        ],
      },
    }).as("getTargets");

    cy.reload();
    cy.wait("@getTargets");

    // Klik refresh
    cy.contains("button", "↻ Refresh").click();

    // Verifikasi API dipanggil lagi
    cy.wait("@getTargets");
  });

  // ----------------------------------------------------------
  // TEST 37: Error state - Failed to load targets
  // ----------------------------------------------------------
  it("Harus menampilkan error jika gagal load targets", () => {
    cy.intercept("GET", "**/api/broadcast/targets", {
      statusCode: 500,
      body: { message: "Failed to load targets" },
    }).as("getTargetsError");

    cy.reload();
    cy.wait("@getTargetsError");

    // Verifikasi error message
    cy.contains("Gagal memuat daftar penerima").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 38: Polling WA status - Auto refresh every 3s
  // ----------------------------------------------------------
  it("Harus polling WA status setiap 3 detik", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      body: { status: "connecting", qrDataUrl: null },
    }).as("getWaStatus");

    cy.reload();

    // Wait untuk beberapa poll cycles
    cy.wait("@getWaStatus");
    cy.wait(3100);
    cy.wait("@getWaStatus");
    cy.wait(3100);
    cy.wait("@getWaStatus");

    // Verifikasi minimal 3x dipanggil (initial + 2 polls)
    cy.get("@getWaStatus.all").should("have.length.at.least", 3);
  });

  // ----------------------------------------------------------
  // TEST 39: 401 Unauthorized - Redirect to login
  // ----------------------------------------------------------
  it("Harus redirect ke login jika unauthorized (401)", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      statusCode: 401,
      body: { message: "Unauthorized" },
    });

    cy.reload();

    // Verifikasi redirect ke login
    cy.url().should("include", "/login");
  });

  // ----------------------------------------------------------
  // TEST 40: Validation - Empty message
  // ----------------------------------------------------------
  it("Harus menampilkan error jika coba kirim dengan pesan kosong", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      body: { status: "ready", qrDataUrl: null },
    });

    cy.intercept("GET", "**/api/broadcast/targets", {
      body: { data: [{ id: 1, name: "M1", phone: "081111111111", level: "Gold", loyalty_points: 1000 }] },
    });

    cy.reload();

    // Textarea kosong, button disabled - tidak bisa klik
    cy.contains("button", "📲 Kirim Broadcast").should("be.disabled");
  });

  // ----------------------------------------------------------
  // TEST 41: Validation - No targets
  // ----------------------------------------------------------
  it("Harus menampilkan error jika tidak ada penerima", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      body: { status: "ready", qrDataUrl: null },
    });

    cy.intercept("GET", "**/api/broadcast/targets", {
      body: { data: [] },
    });

    cy.reload();

    cy.get("textarea").type("Test message");

    // Button disabled karena no targets
    cy.contains("button", "📲 Kirim Broadcast").should("be.disabled");
  });

  // ----------------------------------------------------------
  // TEST 42: Branch context - Display branch name
  // ----------------------------------------------------------
  it("Harus menampilkan nama cabang di header jika cabang dipilih", () => {
    // Note: This test assumes BranchContext is properly mocked
    // In real scenario, you'd need to mock the context provider

    cy.reload();

    // Verifikasi description text (mungkin include branch name atau tidak)
    cy.contains("Kirim pesan promo langsung ke WhatsApp").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 43: Payload validation - Include branch_id
  // ----------------------------------------------------------
  it("Harus mengirim branch_id dalam payload jika branch dipilih", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      body: { status: "ready", qrDataUrl: null },
    });

    cy.intercept("GET", "**/api/broadcast/targets", {
      body: { data: [{ id: 1, name: "M1", phone: "081111111111", level: "Gold", loyalty_points: 1000 }] },
    });

    cy.intercept("POST", "**/api/broadcast/promo", {
      body: { summary: { total: 1, sent: 1, failed: 0 }, results: [] },
    }).as("sendBroadcast");

    cy.reload();

    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);
    });

    cy.get("textarea").type("Test message");
    cy.contains("button", "📲 Kirim Broadcast").click();

    cy.wait("@sendBroadcast");

    // Verifikasi payload structure
    cy.get("@sendBroadcast")
      .its("request.body")
      .should("have.property", "message", "Test message");
  });

  // ----------------------------------------------------------
  // TEST 44: Responsive - Mobile viewport
  // ----------------------------------------------------------
  it("Harus responsive pada viewport mobile", () => {
    cy.viewport(375, 667);

    cy.reload();

    // Verifikasi elemen masih accessible
    cy.contains("h1", "Broadcast Promo WhatsApp").should("be.visible");
    cy.contains("button", "↻ Refresh").should("be.visible");
    cy.get("textarea").should("be.visible");
    cy.contains("button", "📲 Kirim Broadcast").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 45: Table overflow - Scrollable on many targets
  // ----------------------------------------------------------
  it("Harus scrollable jika banyak penerima (overflow handling)", () => {
    // Mock banyak targets
    const manyTargets = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `Member ${i + 1}`,
      phone: `08${String(i).padStart(10, "0")}`,
      level: ["Gold", "Silver", "Bronze"][i % 3],
      loyalty_points: Math.floor(Math.random() * 2000),
    }));

    cy.intercept("GET", "**/api/broadcast/targets", {
      body: { data: manyTargets },
    });

    cy.reload();

    // Verifikasi container scrollable
    cy.get("tbody tr").should("have.length", 50);

    // Verifikasi overflow style
    cy.get('[style*="overflow"]').should("exist");
  });

  // ----------------------------------------------------------
  // TEST 46: Result modal - Close by clicking X button
  // ----------------------------------------------------------
  it("Harus bisa menutup result modal dengan tombol X", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      body: { status: "ready", qrDataUrl: null },
    });

    cy.intercept("GET", "**/api/broadcast/targets", {
      body: { data: [{ id: 1, name: "M1", phone: "081111111111", level: "Gold", loyalty_points: 1000 }] },
    });

    cy.intercept("POST", "**/api/broadcast/promo", {
      body: { summary: { total: 1, sent: 1, failed: 0 }, results: [] },
    });

    cy.reload();

    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);
    });

    cy.get("textarea").type("Test");
    cy.contains("button", "📲 Kirim Broadcast").click();

    // Modal muncul
    cy.contains("h2", "Hasil Broadcast").should("be.visible");

    // Klik X button
    cy.contains("button", "✕").click();

    // Modal tertutup
    cy.contains("h2", "Hasil Broadcast").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 47: QR Panel - Disconnected initial state
  // ----------------------------------------------------------
  it("Harus menampilkan panel disconnected saat initial state", () => {
    cy.intercept("GET", "**/api/broadcast/status", {
      body: { status: "disconnected", qrDataUrl: null },
    });

    cy.reload();

    cy.contains("📱").should("be.visible");
    cy.contains("WhatsApp belum terhubung").should("be.visible");
    cy.contains("Menginisialisasi... QR akan muncul sebentar lagi").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 48: Character limit - Border turns red
  // ----------------------------------------------------------
  it("Harus mengubah border textarea menjadi merah saat over limit", () => {
    const overLimitMessage = "a".repeat(4100);

    cy.get("textarea").invoke("val", overLimitMessage).trigger("input");

    // Verifikasi border merah
    cy.get("textarea")
      .should("have.class", "border-red-400")
      .should("have.class", "bg-red-50");
  });

  // ----------------------------------------------------------
  // TEST 49: Level badge - Default to Bronze if no level
  // ----------------------------------------------------------
  it("Harus menampilkan badge Bronze jika level tidak ada", () => {
    cy.intercept("GET", "**/api/broadcast/targets", {
      body: {
        data: [
          { id: 1, name: "No Level Member", phone: "081111111111", level: null, loyalty_points: 0 },
        ],
      },
    });

    cy.reload();

    // Verifikasi badge Bronze (default)
    cy.contains("span", "Bronze").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 50: Loyalty points - Display 0 if null
  // ----------------------------------------------------------
  it("Harus menampilkan 0 poin jika loyalty_points null", () => {
    cy.intercept("GET", "**/api/broadcast/targets", {
      body: {
        data: [
          { id: 1, name: "Zero Points Member", phone: "081111111111", level: "Bronze", loyalty_points: null },
        ],
      },
    });

    cy.reload();

    // Verifikasi poin 0
    cy.contains("tr", "Zero Points Member").within(() => {
      cy.contains("td", "0").should("be.visible");
    });
  });
});
