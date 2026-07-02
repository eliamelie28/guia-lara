const categories = [
  "Todas",
  "Panadería",
  "Belleza",
  "Gimnasio",
  "Colegios y escuelas",
  "Farmacias",
  "Clínicas",
  "Mascotas",
  "Supermercado",
  "Mecánicos",
  "Restaurantes",
  "Tecnología",
];

const starterBusinesses = [
  {
    name: "Panadería El Trigal",
    category: "Panadería",
    address: "Carrera 19, Barquisimeto",
    phone: "0412-0000000",
    website: "",
  },
  {
    name: "Farmacia Centro Lara",
    category: "Farmacias",
    address: "Av. Vargas, Barquisimeto",
    phone: "0251-0000000",
    website: "",
  },
  {
    name: "Clínica Salud Norte",
    category: "Clínicas",
    address: "Zona norte, Barquisimeto",
    phone: "0414-0000000",
    website: "",
  },
  {
    name: "Bella Studio",
    category: "Belleza",
    address: "Este de Barquisimeto",
    phone: "0424-0000000",
    website: "https://instagram.com/",
  },
  {
    name: "Taller Rápido 3000",
    category: "Mecánicos",
    address: "Av. Libertador, Barquisimeto",
    phone: "0416-0000000",
    website: "",
  },
  {
    name: "Mascotas del Sol",
    category: "Mascotas",
    address: "Cabudare - Barquisimeto",
    phone: "0412-1111111",
    website: "",
  },
];

// Cuando tengas tu Google Sheet publicada como CSV, pega el enlace entre las comillas.
// Ejemplo: const googleSheetCsvUrl = "https://docs.google.com/spreadsheets/d/e/.../pub?output=csv";
const googleSheetCsvUrl = "https://docs.google.com/spreadsheets/d/1YJTh8yEMYVsVLzgMyOmR8NMpvYO136b2JotNy_2dlrQ/gviz/tq?tqx=out:csv";
const storageKey = "guia-lara-businesses";
let selectedCategory = "Todas";
let sheetBusinesses = [];

const tabs = document.querySelector("#categoryTabs");
const grid = document.querySelector("#businessGrid");
const count = document.querySelector("#resultCount");
const emptyState = document.querySelector("#emptyState");
const searchInput = document.querySelector("#searchInput");
const clearSearch = document.querySelector("#clearSearch");
const form = document.querySelector("#businessForm");
const categorySelect = document.querySelector("#category");
const formMessage = document.querySelector("#formMessage");

function loadBusinesses() {
  const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
  return [...sheetBusinesses, ...starterBusinesses, ...saved];
}

function saveBusiness(business) {
  const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
  saved.unshift(business);
  localStorage.setItem(storageKey, JSON.stringify(saved));
}

function normalize(value) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function renderCategories() {
  tabs.innerHTML = "";
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = category;
    button.className = category === selectedCategory ? "active" : "";
    button.addEventListener("click", () => {
      selectedCategory = category;
      renderCategories();
      renderBusinesses();
    });
    tabs.appendChild(button);
  });

  categorySelect.innerHTML = "";
  categories
    .filter((category) => category !== "Todas")
    .forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categorySelect.appendChild(option);
    });
}

function businessMatchesSearch(business, query) {
  const text = `${business.name} ${business.category} ${business.address} ${business.phone} ${business.website}`;
  return normalize(text).includes(query);
}

function renderBusinesses() {
  const query = normalize(searchInput.value.trim());
  const businesses = loadBusinesses().filter((business) => {
    const matchesCategory = selectedCategory === "Todas" || business.category === selectedCategory;
    return matchesCategory && businessMatchesSearch(business, query);
  });

  grid.innerHTML = "";
  businesses.forEach((business) => {
    const card = document.createElement("article");
    card.className = "business-card";

    const pill = document.createElement("span");
    pill.className = "category-pill";
    pill.textContent = business.category;

    const title = document.createElement("h3");
    title.textContent = business.name;

    const address = document.createElement("p");
    address.className = "business-detail";
    address.append(strongText("Dirección: "), business.address);

    const phone = document.createElement("p");
    phone.className = "business-detail";
    phone.append(strongText("Teléfono: "), business.phone);

    card.append(pill, title, address, phone);

    if (business.website) {
      const link = document.createElement("a");
      link.className = "business-link";
      link.href = business.website;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Ver sitio o red social";
      card.appendChild(link);
    } else {
      const website = document.createElement("p");
      website.className = "business-detail";
      website.append(strongText("Web: "), "No registrada");
      card.appendChild(website);
    }

    grid.appendChild(card);
  });

  count.textContent = `${businesses.length} negocio${businesses.length === 1 ? "" : "s"}`;
  emptyState.classList.toggle("show", businesses.length === 0);
}

async function loadSheetBusinesses() {
  if (!googleSheetCsvUrl) {
    return;
  }

  try {
    const response = await fetch(googleSheetCsvUrl);
    const csv = await response.text();
    sheetBusinesses = csvToBusinesses(csv);
    renderBusinesses();
  } catch (error) {
    console.error("No se pudo cargar Google Sheets", error);
    formMessage.textContent = "No se pudo cargar la hoja de negocios.";
  }
}

function csvToBusinesses(csv) {
  const rows = parseCsv(csv);
  const headers = rows.shift().map((header) => normalize(header.trim()));

  return rows
    .map((row) => {
      const data = {};
      headers.forEach((header, index) => {
        data[header] = (row[index] || "").trim();
      });

      const approved = normalize(data.aprobado || "");
      return {
        name: data.nombre || "",
        category: data.categoria || data["categoria "] || "",
        address: data.direccion || "",
        phone: data.telefono || "",
        website: data["sitio web o red social"] || data.web || data.redes || "",
        approved,
      };
    })
    .filter((business) => {
      const isApproved = business.approved === "si" || business.approved === "aprobado";
      return isApproved && business.name && business.category && business.address && business.phone;
    });
}

function parseCsv(csv) {
  const rows = [];
  let row = [];
  let value = "";
  let insideQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === '"' && insideQuotes && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (value || row.length) {
        row.push(value);
        rows.push(row);
        row = [];
        value = "";
      }
      if (char === "\r" && next === "\n") {
        index += 1;
      }
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

function strongText(text) {
  const strong = document.createElement("strong");
  strong.textContent = text;
  return strong;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const business = {
    name: data.get("name").trim(),
    category: data.get("category"),
    address: data.get("address").trim(),
    phone: data.get("phone").trim(),
    website: data.get("website").trim(),
  };

  if (business.website && !business.website.startsWith("http")) {
    business.website = `https://${business.website}`;
  }

  saveBusiness(business);
  selectedCategory = business.category;
  form.reset();
  formMessage.textContent = "Negocio registrado en esta computadora.";
  renderCategories();
  renderBusinesses();
  document.querySelector("#directorio").scrollIntoView({ behavior: "smooth" });
});

searchInput.addEventListener("input", renderBusinesses);
clearSearch.addEventListener("click", () => {
  searchInput.value = "";
  renderBusinesses();
  searchInput.focus();
});

renderCategories();
renderBusinesses();
loadSheetBusinesses();
