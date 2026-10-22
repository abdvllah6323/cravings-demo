/* Cravins: menu data.
   Pure data, no markup. catalogue.js reads this; the cart and checkout (later
   phases) will read the same objects, so prices live here and nowhere else.

   Prices are whole naira. `image: null` means "Photo pending": the card shows
   a clearly marked placeholder until a real photo is supplied.
*/
(function () {
  "use strict";

  var IMG = "assets/images/";

  var categories = [
    { id: "ice-cream", name: "Ice Cream", image: IMG + "categories/ice-cream.webp", icon: "cone",
      imageAlt: "An ice cream cone resting on a scoop with chocolate drizzle, in a branded cup." },
    { id: "milkshakes", name: "Milkshakes", image: IMG + "categories/milkshakes.webp", icon: "shake",
      imageAlt: "Three milkshakes topped with whipped cream: vanilla, chocolate and strawberry." },
    { id: "shawarma", name: "Shawarma", image: IMG + "categories/shawarma.webp", icon: "wrap",
      imageAlt: "Two beef shawarma wraps cut in half on a wooden board." },
    { id: "pastries-snacks", name: "Pastries and Snacks", image: IMG + "products/doughnut.webp", icon: "pastry",
      imageAlt: "A tray of filled doughnuts dusted with sugar." },
    { id: "cakes-desserts", name: "Cakes and Desserts", image: IMG + "categories/cakes-desserts.webp", icon: "cake",
      imageAlt: "Slices of red velvet and chocolate cake on plates beside a cup of ice cream." },
    { id: "drinks", name: "Drinks", image: IMG + "categories/drinks.webp", icon: "bottle",
      imageAlt: "Bottles of Fanta in several flavours in a fridge." }
  ];

  /* Ice cream flavours. `branches: "all"` is the hook for branch-specific
     availability later: replace it with a list of branch ids when needed. */
  function flavour(id, name, alt) {
    return { id: id, name: name, image: IMG + "flavours/" + id + ".webp", imageAlt: alt || name + " ice cream in the display counter.", branches: "all" };
  }
  var flavours = [
    flavour("biscottino", "Biscottino"),
    flavour("red-velvet-cake", "Red Velvet Cake"),
    flavour("cappuccino", "Cappuccino"),
    flavour("mint-chocolate-chip", "Mint Chocolate Chip"),
    flavour("bubble-gum", "Bubble Gum"),
    flavour("dulce-de-leche", "Dulce de Leche"),
    flavour("chocolate", "Chocolate"),
    flavour("cookies-and-cream", "Cookies and Cream"),
    flavour("unicorn", "Unicorn", "Unicorn ice cream in blue and pink swirls decorated with unicorn wafers."),
    flavour("caramel", "Caramel"),
    flavour("coconut", "Coconut"),
    flavour("pistachio", "Pistachio")
  ];

  /* One flavour per order line; the customer then chooses 1 to 4 scoops. */
  var scoopOptions = [
    { count: 1, price: 1000 },
    { count: 2, price: 2000 },
    { count: 3, price: 3000 },
    { count: 4, price: 4000 }
  ];

  /* Add-ons attach to an ice cream line (one each per line). */
  var addOns = [
    { id: "waffle-bowl", name: "Waffle Bowl", price: 400 },
    { id: "toppings", name: "Toppings", price: 350 }
  ];

  function item(id, name, category, price, image, imageAlt) {
    return { id: id, name: name, category: category, price: price, image: image || null, imageAlt: imageAlt || "" };
  }

  var products = [
    /* Ice cream is a single configurable product (flavour + scoops + add-ons). */
    { id: "ice-cream", name: "Ice Cream", category: "ice-cream", type: "ice-cream-builder" },

    item("classic-milkshake", "Classic Milkshake", "milkshakes", 5200),
    item("magic-madness", "Magic Madness", "milkshakes", 5600),
    item("triple-magic", "Triple Magic", "milkshakes", 6000),

    item("beef-shawarma", "Beef Shawarma", "shawarma", 3500),
    item("chicken-shawarma", "Chicken Shawarma", "shawarma", 3800),
    item("sausage", "Sausage", "shawarma", 450),

    item("meat-pie", "Meat Pie", "pastries-snacks", 900),
    item("popcorn", "Popcorn", "pastries-snacks", 950),
    item("samosa", "Samosa", "pastries-snacks", 350),
    item("doughnut", "Doughnut", "pastries-snacks", 1300, IMG + "products/doughnut.webp",
      "A tray of golden filled doughnuts dusted with sugar."),

    item("chocolate-slice-cake", "Chocolate Slice Cake", "cakes-desserts", 2700, IMG + "products/chocolate-slice-cake.webp",
      "A slice of chocolate cake on a colourful plate, topped with two scoops of ice cream."),
    item("red-velvet-cake", "Red Velvet Cake", "cakes-desserts", 2700, IMG + "products/red-velvet-cake.webp",
      "A thick slice of two-layer red velvet cake."),
    item("vanilla-cake", "Vanilla Cake", "cakes-desserts", 2700),
    item("bento-cake", "Bento Cake", "cakes-desserts", 4100, IMG + "products/bento-cake.webp",
      "A small round bento cake with a smiley face in a takeaway box."),
    item("red-velvet-muffin", "Red Velvet Muffin", "cakes-desserts", 1300),
    item("oreo-muffin", "Oreo Muffin", "cakes-desserts", 1300),
    item("banana-loaf", "Banana Loaf", "cakes-desserts", 3600),
    item("full-cake-single", "Full Cake Single Layer", "cakes-desserts", 15200),
    item("full-cake-double", "Full Cake Double Layer", "cakes-desserts", 26500),

    item("water", "Water", "drinks", 350),
    item("coke", "Coke", "drinks", 600),
    item("sprite", "Sprite", "drinks", 600),
    item("fanta", "Fanta", "drinks", 600),
    item("schweppes", "Schweppes", "drinks", 700),
    item("malt", "Malt", "drinks", 800),
    item("energy-drink", "Energy Drink", "drinks", 800),
    item("smoov", "Smoov", "drinks", 500)
  ];

  /* Demo photos: stock/library images used until the business supplies its own.
     Items listed here get stock photos; replace a file in
     assets/images/products/ (same name) to swap one. */
  var demoPhotos = {
    "classic-milkshake": "A tall glass of vanilla milkshake topped with whipped cream and sprinkles, with a green striped straw.",
    "magic-madness": "A takeaway cup of pink milkshake with red sauce drizzled down the inside, held in one hand.",
    "triple-magic": "Three milkshakes topped with whipped cream: vanilla, chocolate and strawberry.",
    "beef-shawarma": "Two beef shawarma wraps cut in half on a wooden board with salad and fries.",
    "chicken-shawarma": "A chicken shawarma wrap cut open on a wooden board.",
    "sausage": "Grilled sausages with charred marks lined up on a barbecue grill.",
    "meat-pie": "Golden meat pies, one broken open to show the meat and potato filling.",
    "popcorn": "A glass bowl of popcorn with kernels scattered around it.",
    "samosa": "Fried samosas on a wooden board with green chilli and pomegranate seeds.",
    "vanilla-cake": "A tall slice of vanilla layer cake with whipped cream frosting.",
    "red-velvet-muffin": "Red velvet muffins with white chocolate chips in paper wrappers.",
    "oreo-muffin": "Cookies and cream muffins studded with chocolate cookie pieces.",
    "banana-loaf": "Slices of banana loaf with ripe bananas beside them.",
    "full-cake-single": "A single-layer round cake with cream piping.",
    "full-cake-double": "A two-layer white cake decorated with piped cream and fresh strawberries.",
    "water": "A bottle of drinking water.",
    "coke": "Rows of Coca-Cola bottles on a shelf.",
    "sprite": "Two cans of Sprite on a glass table.",
    "fanta": "Cans of Fanta Orange stacked together.",
    "schweppes": "Cans of Schweppes soda.",
    "malt": "A can of Maltina malt drink on a patterned cloth.",
    "energy-drink": "A pile of energy drink cans.",
    "smoov": "A bottle of Smoov Chapman drink."
  };
  products.forEach(function (p) {
    if (!p.image && demoPhotos[p.id]) {
      p.image = IMG + "products/" + p.id + ".webp";
      p.imageAlt = demoPhotos[p.id];
    }
  });

  window.CRAVINS_DATA = {
    categories: categories,
    flavours: flavours,
    scoopOptions: scoopOptions,
    addOns: addOns,
    products: products
  };
})();
