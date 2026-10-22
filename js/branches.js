/* Cravins: branch data.
   Pure data. Checkout reads it now; the Locations section (Phase 5) will read
   the same list. `whatsapp` is international digits with no "+" (wa.me format).
   `verified` is false where the number has not been confirmed with the business.
   `mapsUrl` is empty on purpose: this is a demo, so there are no map links. */
(function () {
  "use strict";

  function branch(id, name, city, state, address, hours, phone, verified, note) {
    var digits = phone.replace(/\D/g, "");
    return {
      id: id,
      name: name,
      city: city,
      state: state,
      address: address,
      phone: phone,
      whatsapp: digits.charAt(0) === "0" ? "234" + digits.slice(1) : digits,
      mapsUrl: "",
      openingHours: hours,
      verified: verified,
      note: note || ""
    };
  }

  var HQ = "0704 014 4117";

  window.CRAVINS_BRANCHES = [
    branch("maiduguri-hq", "Maiduguri HQ (Zara Plaza)", "Maiduguri", "Borno",
      "Beside Lagos Bridge, Lagos Street", "10:30am - 9:30pm", HQ, true),
    branch("maiduguri-kawu", "Maiduguri (Kawu Plaza)", "Maiduguri", "Borno",
      "Opposite Today's Stores, Lagos Street", "12noon - 9pm", HQ, false,
      "Uses the Maiduguri HQ number."),
    branch("maiduguri-ifam", "Maiduguri (Ifam Plaza)", "Maiduguri", "Borno",
      "Pompomari by-pass", "11am - 9:30pm", "0912 885 2674", false),

    branch("yola-jimeta", "Yola (Jimeta)", "Yola", "Adamawa",
      "No. 2 Bekaji Road, beside Bekaji Roundabout", "10:00am - 9:30pm", "0802 822 6842", true),
    branch("yola-town", "Yola (Town)", "Yola", "Adamawa",
      "Beside Kudura Pharmacy, FMC, Yola Bypass", "12noon - 9pm", "0701 344 7373", false),

    branch("gombe-dantiti", "Gombe (Dantiti Plaza)", "Gombe", "Gombe",
      "Beside A.Y.M Shafa Fuel Station, Tunfure, Akko", "11:30am - 10:00pm", "0916 427 7073", true),
    branch("gombe-alhajiyel", "Gombe (Alhajiyel Plaza)", "Gombe", "Gombe",
      "Beside City Star Restaurant, EFCC Junction, GRA", "12:00noon - 10:00pm", "0916 427 7073", true),

    branch("bauchi-double-4", "Bauchi (Double 4)", "Bauchi", "Bauchi",
      "International Conference Centre, opposite Bauchi Club, Old GRA", "11am - 10:00pm", "0703 161 2661", true),
    branch("bauchi-promise", "Bauchi (Promise Plaza)", "Bauchi", "Bauchi",
      "Opposite Old Dass Park, Isa Yuguda Guest House", "12noon - 9:30pm", "0703 161 2661", true),

    branch("damaturu", "Damaturu", "Damaturu", "Yobe",
      "Opposite Federal Polytechnic, beside Glo office, Maiduguri Road", "11:30am - 9:30pm", "0704 322 7966", true),
    branch("jos", "Jos (Ana'an Plaza)", "Jos", "Plateau",
      "Opposite Old Gov't House Junction, Barkin Ladi Road, Rayfield", "11am - 8pm", "0816 725 2684", true),
    branch("biu", "Biu (Salaam Plaza)", "Biu", "Borno",
      "Opposite Abba Liman House, Gombe Road", "11:30am - 9pm", "0904 004 7652", false),
    branch("potiskum", "Potiskum", "Potiskum", "Yobe",
      "By St. Peter's Anglican Church, beside Govt Secondary School", "11am - 9:30pm", "0704 412 5464", false)
  ];
})();
