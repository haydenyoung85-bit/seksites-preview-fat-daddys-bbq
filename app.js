(function () {
  "use strict";

  var MENU = [
    { id: "dinners", name: "Dinners", items: [
      ["Two Meat", 17.49], ["Three Meat", 19.49], ["Brisket Dinner", 15.49], ["Rib Dinner", 13.49],
      ["Hotlink Dinner", 12.49], ["Smoked Bologna Dinner", 12.49], ["Pulled Pork Dinner", 11.49],
      ["Smoked Sausage", 11.49], ["Chicken Chunk Dinner", 10.99], ["Grilled Chicken Dinner", 10.99],
      ["Grilled Shrimp", 13.99], ["Coconut Shrimp", 11.99]
    ] },
    { id: "miner", name: "Miner Menu", note: "The miner names nod to Hartshorne's mining roots.", items: [
      ["Fat Daddy Burger", 22.99], ["The Jackie", 25.99], ["Miner Potato", 9.99]
    ] },
    { id: "appetizers", name: "Appetizers", items: [
      ["Pickle Chips", null], ["Miner Kegs", null], ["Shrimp Jammers", null], ["BBQ Nachos", null], ["Bone-In Wings", null]
    ] },
    { id: "steaks", name: "Steaks", items: [["Ribeye", null], ["NY Strip", null]] },
    { id: "burgers", name: "Burgers & More", items: [
      ["Bacon Burger", null], ["Onion Burger", null], ["Brisket Sandwich", null], ["Pulled Pork Salad", null]
    ] },
    { id: "desserts", name: "Desserts", items: [
      ["Banana Pudding", 3.99], ["Cheesecake", 3.99], ["Blackberry Cobbler", 3.99], ["Pecan Cobbler", 4.99], ["Hog Waller", 8.99]
    ] }
  ];

  var LISTS = [
    ["Sides", ["Coleslaw", "Pasta Salad", "Fresh Cut Fries", "Mac N Cheese", "Baked Beans", "Baked Potato", "Side Salad", "Sweet Potato Fries", "Potato Salad", "Kraut-Salad", "Sweet Corn"]],
    ["Premium Sides", ["Loaded Potato Salad", "Fried Okra", "Onion Rings", "Cowboy Beans", "Loaded Baked Potato"]],
    ["Drinks", ["Sweet Tea", "Unsweet Tea", "Lemonade", "Blue Raspberry Lemonade", "Cherry Limeade", "Pepsi products"]]
  ];

  // Open Wednesday(3) to Saturday(6), 11:00 to 21:00
  var OPEN_DAYS = [3, 4, 5, 6];
  var OPEN_MIN = 11 * 60, CLOSE_MIN = 21 * 60;
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function money(n) { return "$" + n.toFixed(2); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function fmtTime(min) {
    var h = Math.floor(min / 60), m = min % 60, ap = h >= 12 ? "pm" : "am";
    h = h % 12 || 12;
    return h + ":" + (m < 10 ? "0" : "") + m + ap;
  }

  /* ---------- Home menu ---------- */
  var menuRoot = document.getElementById("menu-grid");
  if (menuRoot) {
    MENU.forEach(function (cat) {
      var card = el("article", "card menu-card");
      card.appendChild(el("h3", null, cat.name));
      if (cat.note) card.appendChild(el("p", "muted small", cat.note));
      var ul = el("ul", "menu-list");
      cat.items.forEach(function (it) {
        var li = el("li");
        li.appendChild(el("span", null, it[0]));
        li.appendChild(el("span", "price", it[1] == null ? "" : money(it[1])));
        ul.appendChild(li);
      });
      card.appendChild(ul);
      menuRoot.appendChild(card);
    });
    var listRoot = document.getElementById("menu-lists");
    LISTS.forEach(function (l) {
      var card = el("article", "card menu-card");
      card.appendChild(el("h3", null, l[0]));
      card.appendChild(el("p", "chips-text", l[1].join(", ")));
      listRoot.appendChild(card);
    });
  }

  /* ---------- Demo ordering ---------- */
  var app = document.getElementById("order-app");
  if (!app) return;

  var qty = {};   // key -> {name, price, qty}
  var step = 1;
  var info = { day: "", time: "", name: "", phone: "" };

  var steps = [].slice.call(document.querySelectorAll(".step"));
  var tabs = [].slice.call(document.querySelectorAll(".stepper li"));
  var itemsRoot = document.getElementById("order-items");
  var totalEl = document.getElementById("order-total");
  var errEl1 = document.getElementById("err1");
  var errEl2 = document.getElementById("err2");

  function cartLines() {
    var out = [];
    Object.keys(qty).forEach(function (k) { if (qty[k].qty > 0) out.push(qty[k]); });
    return out;
  }
  function totals(lines) {
    var sum = 0, unknown = 0;
    lines.forEach(function (l) {
      if (l.price == null) unknown += l.qty; else sum += l.price * l.qty;
    });
    return { sum: sum, unknown: unknown };
  }
  function totalText(lines) {
    var t = totals(lines);
    var s = money(t.sum);
    if (t.unknown) s += " + price at pickup for " + t.unknown + (t.unknown === 1 ? " item" : " items");
    return s;
  }
  function updateTotal() { totalEl.textContent = totalText(cartLines()); }

  MENU.forEach(function (cat) {
    var sec = el("section", "order-cat");
    sec.appendChild(el("h3", null, cat.name));
    cat.items.forEach(function (it) {
      var key = cat.id + ":" + it[0];
      qty[key] = { name: it[0], price: it[1], qty: 0 };
      var row = el("div", "order-row");
      var label = el("div", "order-label");
      label.appendChild(el("span", "order-name", it[0]));
      label.appendChild(el("span", "order-price", it[1] == null ? "Price at pickup" : money(it[1])));
      row.appendChild(label);
      var ctl = el("div", "qty");
      var minus = el("button", "qbtn", "−");
      minus.type = "button";
      minus.setAttribute("aria-label", "Remove one " + it[0]);
      var val = el("output", "qval", "0");
      val.setAttribute("aria-live", "polite");
      var plus = el("button", "qbtn", "+");
      plus.type = "button";
      plus.setAttribute("aria-label", "Add one " + it[0]);
      function set(n) {
        qty[key].qty = Math.max(0, Math.min(20, n));
        val.textContent = qty[key].qty;
        row.classList.toggle("has-qty", qty[key].qty > 0);
        updateTotal();
        errEl1.textContent = "";
      }
      minus.addEventListener("click", function () { set(qty[key].qty - 1); });
      plus.addEventListener("click", function () { set(qty[key].qty + 1); });
      ctl.appendChild(minus); ctl.appendChild(val); ctl.appendChild(plus);
      row.appendChild(ctl);
      sec.appendChild(row);
    });
    itemsRoot.appendChild(sec);
  });

  /* Day and time */
  var daySel = document.getElementById("pickup-day");
  var timeSel = document.getElementById("pickup-time");
  var now = new Date();
  var firstOpen = null;
  for (var i = 0; i < 14; i++) {
    var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    var open = OPEN_DAYS.indexOf(d.getDay()) !== -1;
    var o = document.createElement("option");
    o.value = String(i);
    o.textContent = DAYS[d.getDay()] + ", " + MONTHS[d.getMonth()] + " " + d.getDate() + (open ? "" : " (closed)");
    o.disabled = !open;
    daySel.appendChild(o);
    if (open && firstOpen === null) firstOpen = i;
  }
  daySel.value = String(firstOpen);

  function fillTimes() {
    var offset = parseInt(daySel.value, 10);
    var nowMin = now.getHours() * 60 + now.getMinutes();
    var earliest = OPEN_MIN;
    if (offset === 0) earliest = Math.max(OPEN_MIN, Math.ceil((nowMin + 30) / 15) * 15);
    timeSel.innerHTML = "";
    var ph = document.createElement("option");
    ph.value = ""; ph.textContent = "Choose a time";
    timeSel.appendChild(ph);
    for (var m = earliest; m < CLOSE_MIN; m += 15) {
      var o = document.createElement("option");
      o.value = String(m); o.textContent = fmtTime(m);
      timeSel.appendChild(o);
    }
  }
  daySel.addEventListener("change", fillTimes);
  fillTimes();

  /* Steps */
  function show(n) {
    step = n;
    steps.forEach(function (s, idx) { s.hidden = idx !== n - 1; });
    tabs.forEach(function (t, idx) {
      t.classList.toggle("current", idx === n - 1);
      t.classList.toggle("done", idx < n - 1);
      if (idx === n - 1) t.setAttribute("aria-current", "step"); else t.removeAttribute("aria-current");
    });
    var h = steps[n - 1].querySelector("h2");
    h.setAttribute("tabindex", "-1");
    h.focus({ preventScroll: true });
    window.scrollTo({ top: app.offsetTop - 10, behavior: "smooth" });
  }

  function buildReview() {
    var lines = cartLines();
    var ul = document.getElementById("review-items");
    ul.innerHTML = "";
    lines.forEach(function (l) {
      var li = el("li");
      li.appendChild(el("span", null, l.qty + " × " + l.name));
      li.appendChild(el("span", null, l.price == null ? "Price at pickup" : money(l.price * l.qty)));
      ul.appendChild(li);
    });
    document.getElementById("review-total").textContent = totalText(lines);
    var dayLabel = daySel.options[daySel.selectedIndex].textContent;
    document.getElementById("review-when").textContent = dayLabel + " at " + fmtTime(parseInt(info.time, 10));
    document.getElementById("review-who").textContent = info.name + " · " + info.phone;
  }

  document.getElementById("to-step2").addEventListener("click", function () {
    if (!cartLines().length) { errEl1.textContent = "Add at least one item to continue."; return; }
    show(2);
  });
  document.getElementById("back-1").addEventListener("click", function () { show(1); });
  document.getElementById("back-2").addEventListener("click", function () { show(2); });

  document.getElementById("details-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = document.getElementById("cust-name").value.trim();
    var phone = document.getElementById("cust-phone").value.trim();
    if (!timeSel.value) { errEl2.textContent = "Choose a pickup time."; return; }
    if (!name) { errEl2.textContent = "Enter a name for the order."; return; }
    if (phone.replace(/\D/g, "").length < 10) { errEl2.textContent = "Enter a 10-digit phone number."; return; }
    errEl2.textContent = "";
    info.time = timeSel.value; info.name = name; info.phone = phone;
    buildReview();
    show(3);
  });

  document.getElementById("place-demo").addEventListener("click", function () {
    document.getElementById("confirm-summary").textContent =
      document.getElementById("review-when").textContent + " · " + document.getElementById("review-total").textContent;
    steps.forEach(function (s) { s.hidden = true; });
    document.querySelector(".stepper").hidden = true;
    var c = document.getElementById("confirmation");
    c.hidden = false;
    var h = c.querySelector("h2");
    h.setAttribute("tabindex", "-1");
    h.focus({ preventScroll: true });
    window.scrollTo({ top: app.offsetTop - 10, behavior: "smooth" });
  });

  document.getElementById("restart").addEventListener("click", function () {
    Object.keys(qty).forEach(function (k) { qty[k].qty = 0; });
    [].forEach.call(document.querySelectorAll(".qval"), function (o) { o.textContent = "0"; });
    [].forEach.call(document.querySelectorAll(".order-row"), function (r) { r.classList.remove("has-qty"); });
    document.getElementById("details-form").reset();
    daySel.value = String(firstOpen);
    fillTimes();
    updateTotal();
    document.getElementById("confirmation").hidden = true;
    document.querySelector(".stepper").hidden = false;
    show(1);
  });

  show(1);
  window.scrollTo(0, 0);
})();
