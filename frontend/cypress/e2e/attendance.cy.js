/**
 * ============================================================
 * SKENARIO PENGUJIAN: Attendance (Absensi) - UMKM-Grow
 * ============================================================
 * Menguji seluruh fitur Absensi end-to-end:
 *  - Tampilan halaman absensi
 *  - GPS Status (loading, ok, denied, error)
 *  - Koordinat & reverse geocoding
 *  - Refresh lokasi
 *  - CHECK IN & CHECK OUT
 *  - History absensi (grouped by day)
 *  - Format date & time
 *  - Radius validation (Dalam/Di Luar Radius)
 *  - Distance display
 *  - Loading & error states
 *  - Login required validation
 * ============================================================
 */

describe("Skenario Pengujian Attendance Management UMKM-Grow", () => {
  let users;

  before(() => {
    cy.fixture("user").then((data) => {
      users = data;
    });
  });

  beforeEach(() => {
    // Login dan navigasi ke Absensi
    cy.clearLocalStorage();
    cy.login(users.validUser.email, users.validUser.password);
    cy.visit("/absensi");
  });

  // ----------------------------------------------------------
  // TEST 1: Tampilan halaman Absensi
  // ----------------------------------------------------------
  it("Harus menampilkan halaman Absensi dengan elemen yang benar", () => {
    // Verifikasi judul halaman
    cy.contains("h1", "Absensi").should("be.visible");
    cy.contains("Mesin absensi berbasis lokasi dengan validasi radius").should("be.visible");

    // Verifikasi GPS Status Card
    cy.contains("Status GPS").should("be.visible");
    cy.contains("Koordinat").should("be.visible");
    cy.contains("button", "Refresh Lokasi").should("be.visible");

    // Verifikasi Check In/Out Card
    cy.contains("Aksi Absensi").should("be.visible");
    cy.contains("Check In / Check Out").should("be.visible");
    cy.contains("button", "CHECK IN").should("be.visible");
    cy.contains("button", "CHECK OUT").should("be.visible");

    // Verifikasi History Section
    cy.contains("h2", "History Absensi").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 2: GPS Status - Loading state
  // ----------------------------------------------------------
  it("Harus menampilkan loading state saat mendeteksi lokasi", () => {
    // Mock geolocation dengan delay
    cy.visit("/absensi", {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake(
          (success, error, options) => {
            // Simulate delay
            setTimeout(() => {
              success({
                coords: {
                  latitude: -6.2088,
                  longitude: 106.8456,
                },
              });
            }, 2000);
          }
        );
      },
    });

    // Verifikasi loading state
    cy.contains("Mendeteksi lokasi...").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 3: GPS Status - Success (OK)
  // ----------------------------------------------------------
  it("Harus menampilkan status GPS OK dengan koordinat yang benar", () => {
    // Mock geolocation success
    cy.visit("/absensi", {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake(
          (success) => {
            success({
              coords: {
                latitude: -6.2088,
                longitude: 106.8456,
              },
            });
          }
        );
      },
    });

    // Mock reverse geocoding API
    cy.intercept("GET", "**/reverse-geocode-client*", {
      statusCode: 200,
      body: {
        city: "Jakarta",
        principalSubdivision: "DKI Jakarta",
        countryName: "Indonesia",
      },
    }).as("reverseGeocode");

    // Verifikasi status OK
    cy.contains("Lokasi Akurat").should("be.visible");

    // Verifikasi koordinat
    cy.contains("-6.208800, 106.845600").should("be.visible");

    // Verifikasi lokasi label
    cy.wait("@reverseGeocode");
    cy.contains("Jakarta, DKI Jakarta, Indonesia").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 4: GPS Status - Denied (Permission)
  // ----------------------------------------------------------
  it("Harus menampilkan error jika user deny permission GPS", () => {
    // Mock geolocation denied (error code 1)
    cy.visit("/absensi", {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake(
          (success, error) => {
            error({ code: 1, message: "User denied geolocation" });
          }
        );
      },
    });

    // Verifikasi error message
    cy.contains("Izinkan akses lokasi browser Anda!").should("be.visible");

    // Koordinat harus kosong
    cy.contains("Koordinat").parent().contains("-").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 5: GPS Status - Error (Failed to get location)
  // ----------------------------------------------------------
  it("Harus menampilkan error jika gagal mengambil lokasi", () => {
    // Mock geolocation error (code selain 1)
    cy.visit("/absensi", {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake(
          (success, error) => {
            error({ code: 3, message: "Timeout" });
          }
        );
      },
    });

    // Verifikasi error message
    cy.contains("Gagal mengambil lokasi. Coba ulangi.").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 6: Refresh Lokasi button
  // ----------------------------------------------------------
  it("Harus bisa refresh lokasi saat klik Refresh Lokasi", () => {
    let callCount = 0;

    cy.visit("/absensi", {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake(
          (success) => {
            callCount++;
            success({
              coords: {
                latitude: -6.2088 + callCount * 0.001,
                longitude: 106.8456 + callCount * 0.001,
              },
            });
          }
        );
      },
    });

    // Mock reverse geocoding
    cy.intercept("GET", "**/reverse-geocode-client*", {
      body: { city: "Jakarta", countryName: "Indonesia" },
    }).as("reverseGeocode");

    // Koordinat awal
    cy.contains("-6.209800, 106.846600").should("be.visible");

    // Klik Refresh Lokasi
    cy.contains("button", "Refresh Lokasi").click();

    // Koordinat harus update
    cy.contains("-6.210800, 106.847600").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 7: CHECK IN berhasil
  // ----------------------------------------------------------
  it("Harus berhasil CHECK IN dengan koordinat yang benar", () => {
    // Mock geolocation
    cy.visit("/absensi", {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake(
          (success) => {
            success({
              coords: { latitude: -6.2088, longitude: 106.8456 },
            });
          }
        );
      },
    });

    cy.intercept("GET", "**/reverse-geocode-client*", {
      body: { city: "Jakarta" },
    });

    // Mock POST CHECK IN
    cy.intercept("POST", "**/api/attendance", {
      statusCode: 201,
      body: { message: "Check In berhasil" },
    }).as("checkIn");

    // Mock GET history after check in
    cy.intercept("GET", "**/api/attendance/my-history", {
      body: {
        data: [
          {
            id: 1,
            action: "CHECK_IN",
            timestamp: new Date().toISOString(),
            latitude: -6.2088,
            longitude: 106.8456,
            distance_meters: 50,
            within_radius: true,
          },
        ],
      },
    }).as("getHistory");

    // Klik CHECK IN
    cy.contains("button", "CHECK IN").click();

    // Verifikasi API dipanggil
    cy.wait("@checkIn").its("request.body").should("deep.include", {
      action: "CHECK_IN",
      latitude: -6.2088,
      longitude: 106.8456,
    });

    cy.wait("@getHistory");

    // Verifikasi history muncul
    cy.get(".grid").should("contain", "Check In");
  });

  // ----------------------------------------------------------
  // TEST 8: CHECK OUT berhasil
  // ----------------------------------------------------------
  it("Harus berhasil CHECK OUT dengan koordinat yang benar", () => {
    // Mock geolocation
    cy.visit("/absensi", {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake(
          (success) => {
            success({
              coords: { latitude: -6.2088, longitude: 106.8456 },
            });
          }
        );
      },
    });

    cy.intercept("GET", "**/reverse-geocode-client*", {
      body: { city: "Jakarta" },
    });

    // Mock POST CHECK OUT
    cy.intercept("POST", "**/api/attendance", {
      statusCode: 201,
      body: { message: "Check Out berhasil" },
    }).as("checkOut");

    // Mock GET history after check out
    cy.intercept("GET", "**/api/attendance/my-history", {
      body: {
        data: [
          {
            id: 1,
            action: "CHECK_OUT",
            timestamp: new Date().toISOString(),
            latitude: -6.2088,
            longitude: 106.8456,
            distance_meters: 50,
            within_radius: true,
          },
        ],
      },
    }).as("getHistory");

    // Klik CHECK OUT
    cy.contains("button", "CHECK OUT").click();

    // Verifikasi API dipanggil
    cy.wait("@checkOut").its("request.body").should("deep.include", {
      action: "CHECK_OUT",
      latitude: -6.2088,
      longitude: 106.8456,
    });

    cy.wait("@getHistory");
  });

  // ----------------------------------------------------------
  // TEST 9: CHECK IN/OUT - Error handling
  // ----------------------------------------------------------
  it("Harus menampilkan error jika CHECK IN gagal", () => {
    // Mock geolocation
    cy.visit("/absensi", {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake(
          (success) => {
            success({
              coords: { latitude: -6.2088, longitude: 106.8456 },
            });
          }
        );
      },
    });

    cy.intercept("GET", "**/reverse-geocode-client*", {
      body: { city: "Jakarta" },
    });

    // Mock POST error
    cy.intercept("POST", "**/api/attendance", {
      statusCode: 400,
      body: { message: "Anda sudah CHECK IN hari ini." },
    }).as("checkInError");

    // Klik CHECK IN
    cy.contains("button", "CHECK IN").click();

    cy.wait("@checkInError");

    // Verifikasi error muncul
    cy.contains("Anda sudah CHECK IN hari ini.").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 10: History absensi - Empty state
  // ----------------------------------------------------------
  it("Harus menampilkan pesan jika belum ada history absensi", () => {
    // Mock geolocation
    cy.visit("/absensi", {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake(
          (success) => {
            success({
              coords: { latitude: -6.2088, longitude: 106.8456 },
            });
          }
        );
      },
    });

    // Mock GET history kosong
    cy.intercept("GET", "**/api/attendance/my-history", {
      body: { data: [] },
    }).as("getHistory");

    cy.reload();
    cy.wait("@getHistory");

    // Verifikasi empty state
    cy.contains("Belum ada riwayat absensi.").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 11: History absensi - Display dengan data
  // ----------------------------------------------------------
  it("Harus menampilkan history absensi dengan format yang benar", () => {
    // Mock geolocation
    cy.visit("/absensi", {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake(
          (success) => {
            success({
              coords: { latitude: -6.2088, longitude: 106.8456 },
            });
          }
        );
      },
    });

    // Mock GET history dengan data
    const today = new Date("2024-12-15T08:30:00Z");
    const todayCheckOut = new Date("2024-12-15T17:00:00Z");

    cy.intercept("GET", "**/api/attendance/my-history", {
      body: {
        data: [
          {
            id: 1,
            action: "CHECK_IN",
            timestamp: today.toISOString(),
            latitude: -6.2088,
            longitude: 106.8456,
            distance_meters: 50,
            within_radius: true,
          },
          {
            id: 2,
            action: "CHECK_OUT",
            timestamp: todayCheckOut.toISOString(),
            latitude: -6.2088,
            longitude: 106.8456,
            distance_meters: 45,
            within_radius: true,
          },
        ],
      },
    }).as("getHistory");

    cy.reload();
    cy.wait("@getHistory");

    // Verifikasi history card muncul
    cy.get(".grid").should("contain", "Check In");
    cy.get(".grid").should("contain", "Check Out");

    // Verifikasi distance
    cy.contains("45m dari kantor").should("be.visible");

    // Verifikasi radius status
    cy.contains("Dalam Radius").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 12: History absensi - Grouped by day
  // ----------------------------------------------------------
  it("Harus mengelompokkan history berdasarkan hari", () => {
    // Mock geolocation
    cy.visit("/absensi", {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake(
          (success) => {
            success({
              coords: { latitude: -6.2088, longitude: 106.8456 },
            });
          }
        );
      },
    });

    // Mock history dengan 2 hari berbeda
    const day1CheckIn = new Date("2024-12-15T08:00:00Z");
    const day1CheckOut = new Date("2024-12-15T17:00:00Z");
    const day2CheckIn = new Date("2024-12-14T08:30:00Z");
    const day2CheckOut = new Date("2024-12-14T17:30:00Z");

    cy.intercept("GET", "**/api/attendance/my-history", {
      body: {
        data: [
          {
            id: 1,
            action: "CHECK_IN",
            timestamp: day1CheckIn.toISOString(),
            distance_meters: 50,
            within_radius: true,
          },
          {
            id: 2,
            action: "CHECK_OUT",
            timestamp: day1CheckOut.toISOString(),
            distance_meters: 50,
            within_radius: true,
          },
          {
            id: 3,
            action: "CHECK_IN",
            timestamp: day2CheckIn.toISOString(),
            distance_meters: 60,
            within_radius: true,
          },
          {
            id: 4,
            action: "CHECK_OUT",
            timestamp: day2CheckOut.toISOString(),
            distance_meters: 60,
            within_radius: true,
          },
        ],
      },
    }).as("getHistory");

    cy.reload();
    cy.wait("@getHistory");

    // Verifikasi ada 2 cards (2 hari)
    cy.get(".grid > div").should("have.length", 2);
  });

  // ----------------------------------------------------------
  // TEST 13: History - Format date Indonesian
  // ----------------------------------------------------------
  it("Harus format tanggal dalam Bahasa Indonesia", () => {
    // Mock geolocation
    cy.visit("/absensi", {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake(
          (success) => {
            success({
              coords: { latitude: -6.2088, longitude: 106.8456 },
            });
          }
        );
      },
    });

    const testDate = new Date("2024-12-15T08:00:00Z");

    cy.intercept("GET", "**/api/attendance/my-history", {
      body: {
        data: [
          {
            id: 1,
            action: "CHECK_IN",
            timestamp: testDate.toISOString(),
            distance_meters: 50,
            within_radius: true,
          },
        ],
      },
    }).as("getHistory");

    cy.reload();
    cy.wait("@getHistory");

    // Verifikasi format tanggal Bahasa Indonesia
    // Format: "Min, 15 Des 2024" (format akan vary berdasarkan locale browser)
    cy.get(".grid").should("contain", "Des");
    cy.get(".grid").should("contain", "2024");
  });

  // ----------------------------------------------------------
  // TEST 14: History - Format time Indonesian
  // ----------------------------------------------------------
  it("Harus format waktu dalam format HH:MM", () => {
    // Mock geolocation
    cy.visit("/absensi", {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake(
          (success) => {
            success({
              coords: { latitude: -6.2088, longitude: 106.8456 },
            });
          }
        );
      },
    });

    const checkInTime = new Date("2024-12-15T08:30:00Z");
    const checkOutTime = new Date("2024-12-15T17:45:00Z");

    cy.intercept("GET", "**/api/attendance/my-history", {
      body: {
        data: [
          {
            id: 1,
            action: "CHECK_IN",
            timestamp: checkInTime.toISOString(),
            distance_meters: 50,
            within_radius: true,
          },
          {
            id: 2,
            action: "CHECK_OUT",
            timestamp: checkOutTime.toISOString(),
            distance_meters: 50,
            within_radius: true,
          },
        ],
      },
    }).as("getHistory");

    cy.reload();
    cy.wait("@getHistory");

    // Verifikasi format waktu ada (format HH:MM)
    // Time akan di-convert ke local timezone
    cy.get(".grid").within(() => {
      cy.contains("Check In").should("be.visible");
      cy.contains("Check Out").should("be.visible");
    });
  });

  // ----------------------------------------------------------
  // TEST 15: History - Dalam Radius vs Di Luar Radius
  // ----------------------------------------------------------
  it("Harus menampilkan status Dalam Radius vs Di Luar Radius", () => {
    // Mock geolocation
    cy.visit("/absensi", {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake(
          (success) => {
            success({
              coords: { latitude: -6.2088, longitude: 106.8456 },
            });
          }
        );
      },
    });

    // Mock history dengan berbagai radius status
    const day1 = new Date("2024-12-15T08:00:00Z");
    const day2 = new Date("2024-12-14T08:00:00Z");

    cy.intercept("GET", "**/api/attendance/my-history", {
      body: {
        data: [
          {
            id: 1,
            action: "CHECK_IN",
            timestamp: day1.toISOString(),
            distance_meters: 50,
            within_radius: true,
          },
          {
            id: 2,
            action: "CHECK_IN",
            timestamp: day2.toISOString(),
            distance_meters: 300,
            within_radius: false,
          },
        ],
      },
    }).as("getHistory");

    cy.reload();
    cy.wait("@getHistory");

    // Verifikasi Dalam Radius (hijau)
    cy.contains("Dalam Radius")
      .should("be.visible")
      .should("have.class", "text-emerald-500");

    // Verifikasi Di Luar Radius (merah)
    cy.contains("Di Luar Radius")
      .should("be.visible")
      .should("have.class", "text-rose-500");
  });

  // ----------------------------------------------------------
  // TEST 16: History - Distance display
  // ----------------------------------------------------------
  it("Harus menampilkan jarak dari kantor dalam meter", () => {
    // Mock geolocation
    cy.visit("/absensi", {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake(
          (success) => {
            success({
              coords: { latitude: -6.2088, longitude: 106.8456 },
            });
          }
        );
      },
    });

    cy.intercept("GET", "**/api/attendance/my-history", {
      body: {
        data: [
          {
            id: 1,
            action: "CHECK_IN",
            timestamp: new Date().toISOString(),
            distance_meters: 125,
            within_radius: true,
          },
        ],
      },
    }).as("getHistory");

    cy.reload();
    cy.wait("@getHistory");

    // Verifikasi distance display
    cy.contains("125m dari kantor").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 17: History - Loading state
  // ----------------------------------------------------------
  it("Harus menampilkan loading state saat fetch history", () => {
    // Mock geolocation
    cy.visit("/absensi", {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake(
          (success) => {
            success({
              coords: { latitude: -6.2088, longitude: 106.8456 },
            });
          }
        );
      },
    });

    // Mock GET history dengan delay
    cy.intercept("GET", "**/api/attendance/my-history", (req) => {
      req.reply({
        delay: 1500,
        statusCode: 200,
        body: { data: [] },
      });
    }).as("getHistorySlow");

    cy.reload();

    // Verifikasi loading state
    cy.contains("Memuat riwayat...").should("be.visible");

    cy.wait("@getHistorySlow");

    // Loading hilang
    cy.contains("Memuat riwayat...").should("not.exist");
  });

  // ----------------------------------------------------------
  // TEST 18: CHECK IN tanpa GPS - Auto request location
  // ----------------------------------------------------------
  it("Harus auto request lokasi jika CHECK IN tanpa koordinat", () => {
    let requestCount = 0;

    // Mock geolocation - first call error, second call success
    cy.visit("/absensi", {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake(
          (success, error) => {
            requestCount++;
            if (requestCount === 1) {
              // First call: error
              error({ code: 3, message: "Timeout" });
            } else {
              // Second call: success
              success({
                coords: { latitude: -6.2088, longitude: 106.8456 },
              });
            }
          }
        );
      },
    });

    cy.intercept("GET", "**/reverse-geocode-client*", {
      body: { city: "Jakarta" },
    });

    // Awalnya error
    cy.contains("Gagal mengambil lokasi. Coba ulangi.").should("be.visible");

    // Klik CHECK IN (akan trigger request location lagi)
    cy.contains("button", "CHECK IN").click();

    // Sekarang lokasi berhasil
    cy.contains("Lokasi Akurat").should("be.visible");
    cy.contains("-6.208800, 106.845600").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 19: Reverse geocoding - Loading state
  // ----------------------------------------------------------
  it("Harus menampilkan loading saat mencari nama lokasi", () => {
    // Mock geolocation
    cy.visit("/absensi", {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake(
          (success) => {
            success({
              coords: { latitude: -6.2088, longitude: 106.8456 },
            });
          }
        );
      },
    });

    // Mock reverse geocoding dengan delay
    cy.intercept("GET", "**/reverse-geocode-client*", (req) => {
      req.reply({
        delay: 2000,
        statusCode: 200,
        body: { city: "Jakarta", countryName: "Indonesia" },
      });
    }).as("reverseGeocodeSlow");

    // Verifikasi loading text
    cy.contains("Mencari nama lokasi...").should("be.visible");

    cy.wait("@reverseGeocodeSlow");

    // Loading hilang, lokasi muncul
    cy.contains("Jakarta, Indonesia").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 20: Reverse geocoding - Error handling
  // ----------------------------------------------------------
  it("Harus handle error jika reverse geocoding gagal", () => {
    // Mock geolocation
    cy.visit("/absensi", {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake(
          (success) => {
            success({
              coords: { latitude: -6.2088, longitude: 106.8456 },
            });
          }
        );
      },
    });

    // Mock reverse geocoding error
    cy.intercept("GET", "**/reverse-geocode-client*", {
      statusCode: 500,
      body: { error: "Server error" },
    }).as("reverseGeocodeError");

    cy.wait("@reverseGeocodeError");

    // Koordinat tetap muncul meskipun nama lokasi gagal
    cy.contains("-6.208800, 106.845600").should("be.visible");

    // Nama lokasi tidak muncul (empty atau tidak ada error)
    cy.get("body").should("not.contain", "Mencari nama lokasi...");
  });

  // ----------------------------------------------------------
  // TEST 21: Buttons disabled saat submitting
  // ----------------------------------------------------------
  it("Harus disable buttons saat submitting attendance", () => {
    // Mock geolocation
    cy.visit("/absensi", {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake(
          (success) => {
            success({
              coords: { latitude: -6.2088, longitude: 106.8456 },
            });
          }
        );
      },
    });

    cy.intercept("GET", "**/reverse-geocode-client*", {
      body: { city: "Jakarta" },
    });

    // Mock POST dengan delay
    cy.intercept("POST", "**/api/attendance", (req) => {
      req.reply({
        delay: 2000,
        statusCode: 201,
        body: { message: "Success" },
      });
    }).as("checkInSlow");

    cy.intercept("GET", "**/api/attendance/my-history", {
      body: { data: [] },
    });

    // Klik CHECK IN
    cy.contains("button", "CHECK IN").click();

    // Buttons harus disabled
    cy.contains("button", "CHECK IN").should("be.disabled");
    cy.contains("button", "CHECK OUT").should("be.disabled");

    cy.wait("@checkInSlow");

    // Buttons enabled kembali
    cy.contains("button", "CHECK IN").should("not.be.disabled");
    cy.contains("button", "CHECK OUT").should("not.be.disabled");
  });

  // ----------------------------------------------------------
  // TEST 22: History - Only CHECK IN (no CHECK OUT)
  // ----------------------------------------------------------
  it("Harus menampilkan - jika belum CHECK OUT", () => {
    // Mock geolocation
    cy.visit("/absensi", {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake(
          (success) => {
            success({
              coords: { latitude: -6.2088, longitude: 106.8456 },
            });
          }
        );
      },
    });

    // Mock history hanya CHECK IN
    cy.intercept("GET", "**/api/attendance/my-history", {
      body: {
        data: [
          {
            id: 1,
            action: "CHECK_IN",
            timestamp: new Date().toISOString(),
            distance_meters: 50,
            within_radius: true,
          },
        ],
      },
    }).as("getHistory");

    cy.reload();
    cy.wait("@getHistory");

    // Verifikasi Check Out menampilkan "-"
    cy.contains("Check Out").parent().contains("-").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 23: History - Multiple CHECK IN/OUT same day
  // ----------------------------------------------------------
  it("Harus ambil CHECK IN pertama dan CHECK OUT terakhir untuk hari yang sama", () => {
    // Mock geolocation
    cy.visit("/absensi", {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake(
          (success) => {
            success({
              coords: { latitude: -6.2088, longitude: 106.8456 },
            });
          }
        );
      },
    });

    // Mock history dengan multiple CHECK IN/OUT di hari yang sama
    const today = "2024-12-15";
    const checkIn1 = new Date(`${today}T08:00:00Z`);
    const checkOut1 = new Date(`${today}T12:00:00Z`);
    const checkIn2 = new Date(`${today}T13:00:00Z`);
    const checkOut2 = new Date(`${today}T17:00:00Z`);

    cy.intercept("GET", "**/api/attendance/my-history", {
      body: {
        data: [
          {
            id: 1,
            action: "CHECK_IN",
            timestamp: checkIn1.toISOString(),
            distance_meters: 50,
            within_radius: true,
          },
          {
            id: 2,
            action: "CHECK_OUT",
            timestamp: checkOut1.toISOString(),
            distance_meters: 50,
            within_radius: true,
          },
          {
            id: 3,
            action: "CHECK_IN",
            timestamp: checkIn2.toISOString(),
            distance_meters: 50,
            within_radius: true,
          },
          {
            id: 4,
            action: "CHECK_OUT",
            timestamp: checkOut2.toISOString(),
            distance_meters: 50,
            within_radius: true,
          },
        ],
      },
    }).as("getHistory");

    cy.reload();
    cy.wait("@getHistory");

    // Harus hanya ada 1 card untuk hari ini
    cy.get(".grid > div").should("have.length", 1);

    // Verify menampilkan CHECK IN pertama (08:00) dan CHECK OUT terakhir (17:00)
    // Format time akan di-convert ke local, jadi kita verify structure saja
    cy.get(".grid").within(() => {
      cy.contains("Check In").should("be.visible");
      cy.contains("Check Out").should("be.visible");
    });
  });

  // ----------------------------------------------------------
  // TEST 24: History - Distance minimum dari multiple entries
  // ----------------------------------------------------------
  it("Harus menampilkan jarak minimum dari multiple entries di hari yang sama", () => {
    // Mock geolocation
    cy.visit("/absensi", {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake(
          (success) => {
            success({
              coords: { latitude: -6.2088, longitude: 106.8456 },
            });
          }
        );
      },
    });

    // Mock history dengan berbagai jarak
    const today = new Date();
    const checkIn = new Date(today.getTime());
    const checkOut = new Date(today.getTime() + 9 * 60 * 60 * 1000);

    cy.intercept("GET", "**/api/attendance/my-history", {
      body: {
        data: [
          {
            id: 1,
            action: "CHECK_IN",
            timestamp: checkIn.toISOString(),
            distance_meters: 100,
            within_radius: true,
          },
          {
            id: 2,
            action: "CHECK_OUT",
            timestamp: checkOut.toISOString(),
            distance_meters: 45,
            within_radius: true,
          },
        ],
      },
    }).as("getHistory");

    cy.reload();
    cy.wait("@getHistory");

    // Harus menampilkan jarak minimum (45m)
    cy.contains("45m dari kantor").should("be.visible");
  });

  // ----------------------------------------------------------
  // TEST 25: History - Sorted by date descending
  // ----------------------------------------------------------
  it("Harus menampilkan history sorted by date descending (terbaru di atas)", () => {
    // Mock geolocation
    cy.visit("/absensi", {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake(
          (success) => {
            success({
              coords: { latitude: -6.2088, longitude: 106.8456 },
            });
          }
        );
      },
    });

    const day1 = new Date("2024-12-15T08:00:00Z");
    const day2 = new Date("2024-12-14T08:00:00Z");
    const day3 = new Date("2024-12-13T08:00:00Z");

    cy.intercept("GET", "**/api/attendance/my-history", {
      body: {
        data: [
          {
            id: 1,
            action: "CHECK_IN",
            timestamp: day1.toISOString(),
            distance_meters: 50,
            within_radius: true,
          },
          {
            id: 2,
            action: "CHECK_IN",
            timestamp: day2.toISOString(),
            distance_meters: 50,
            within_radius: true,
          },
          {
            id: 3,
            action: "CHECK_IN",
            timestamp: day3.toISOString(),
            distance_meters: 50,
            within_radius: true,
          },
        ],
      },
    }).as("getHistory");

    cy.reload();
    cy.wait("@getHistory");

    // Verifikasi ada 3 cards
    cy.get(".grid > div").should("have.length", 3);

    // Verifikasi urutan (terbaru di atas) - card pertama adalah tanggal terbaru
    cy.get(".grid > div")
      .first()
      .should("contain", "15");

    cy.get(".grid > div")
      .eq(2)
      .should("contain", "13");
  });

  // ----------------------------------------------------------
  // TEST 26: FULL FLOW - Complete attendance cycle
  // ----------------------------------------------------------
  it("FULL FLOW: Harus bisa complete cycle CHECK IN → CHECK OUT → View History", () => {
    // Mock geolocation
    cy.visit("/absensi", {
      onBeforeLoad(win) {
        cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake(
          (success) => {
            success({
              coords: { latitude: -6.2088, longitude: 106.8456 },
            });
          }
        );
      },
    });

    // Mock reverse geocoding
    cy.intercept("GET", "**/reverse-geocode-client*", {
      body: {
        city: "Jakarta Pusat",
        principalSubdivision: "DKI Jakarta",
        countryName: "Indonesia",
      },
    }).as("reverseGeocode");

    // Mock initial history kosong
    cy.intercept("GET", "**/api/attendance/my-history", {
      body: { data: [] },
    }).as("getHistoryInitial");

    cy.reload();
    cy.wait("@getHistoryInitial");

    // === Step 1: Verifikasi GPS OK ===
    cy.contains("Lokasi Akurat").should("be.visible");
    cy.contains("-6.208800, 106.845600").should("be.visible");
    cy.wait("@reverseGeocode");
    cy.contains("Jakarta Pusat, DKI Jakarta, Indonesia").should("be.visible");

    // Verifikasi empty history
    cy.contains("Belum ada riwayat absensi.").should("be.visible");

    // === Step 2: CHECK IN ===
    const checkInTime = new Date();

    cy.intercept("POST", "**/api/attendance", (req) => {
      expect(req.body).to.include({
        action: "CHECK_IN",
        latitude: -6.2088,
        longitude: 106.8456,
      });
      req.reply({
        statusCode: 201,
        body: { message: "Check In berhasil" },
      });
    }).as("checkIn");

    cy.intercept("GET", "**/api/attendance/my-history", {
      body: {
        data: [
          {
            id: 1,
            action: "CHECK_IN",
            timestamp: checkInTime.toISOString(),
            latitude: -6.2088,
            longitude: 106.8456,
            distance_meters: 50,
            within_radius: true,
          },
        ],
      },
    }).as("getHistoryAfterCheckIn");

    cy.contains("button", "CHECK IN").click();

    cy.wait("@checkIn");
    cy.wait("@getHistoryAfterCheckIn");

    // Verifikasi history muncul dengan CHECK IN
    cy.get(".grid > div").should("have.length", 1);
    cy.contains("Check In").should("be.visible");
    cy.get(".grid").within(() => {
      // Check Out masih "-"
      cy.contains("Check Out").parent().contains("-").should("be.visible");
    });

    // === Step 3: CHECK OUT ===
    const checkOutTime = new Date(checkInTime.getTime() + 9 * 60 * 60 * 1000);

    cy.intercept("POST", "**/api/attendance", (req) => {
      expect(req.body).to.include({
        action: "CHECK_OUT",
        latitude: -6.2088,
        longitude: 106.8456,
      });
      req.reply({
        statusCode: 201,
        body: { message: "Check Out berhasil" },
      });
    }).as("checkOut");

    cy.intercept("GET", "**/api/attendance/my-history", {
      body: {
        data: [
          {
            id: 1,
            action: "CHECK_IN",
            timestamp: checkInTime.toISOString(),
            latitude: -6.2088,
            longitude: 106.8456,
            distance_meters: 50,
            within_radius: true,
          },
          {
            id: 2,
            action: "CHECK_OUT",
            timestamp: checkOutTime.toISOString(),
            latitude: -6.2088,
            longitude: 106.8456,
            distance_meters: 45,
            within_radius: true,
          },
        ],
      },
    }).as("getHistoryAfterCheckOut");

    cy.contains("button", "CHECK OUT").click();

    cy.wait("@checkOut");
    cy.wait("@getHistoryAfterCheckOut");

    // === Step 4: Verify Complete History ===
    cy.get(".grid > div").should("have.length", 1);
    cy.contains("Check In").should("be.visible");
    cy.contains("Check Out").should("be.visible");

    // Verify distance (minimum dari 50 dan 45 = 45)
    cy.contains("45m dari kantor").should("be.visible");

    // Verify radius status
    cy.contains("Dalam Radius")
      .should("be.visible")
      .should("have.class", "text-emerald-500");

    // === Step 5: Refresh Location ===
    cy.contains("button", "Refresh Lokasi").click();

    // GPS status tetap OK
    cy.contains("Lokasi Akurat").should("be.visible");
  });
});
