const categories = [
  "Todas",
  "Panaderia",
  "Belleza",
  "Gimnasio",
  "Colegios y escuelas",
  "Farmacias",
  "Clinicas",
  "Mascotas",
  "Supermercado",
  "Mecanicos",
  "Restaurantes",
  "Tecnologia",
];
const starterBusinesses = [
  {
    name: "Panaderia El Trigal",
    category: "Panaderia",
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
    name: "Clinica Salud Norte",
    category: "Clinicas",
    address: "Zona norte, Barquisimeto",
    phone: "0414-0000000",
    website: "",
  },
];

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
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
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

function sameCategory(a, b) {
  return normalize(a) === normalize(b);
}

function renderBusinesses() {
  const query = normalize(searchInput.value.trim());
  const businesses = loadBusinesses().filter((business) => {
    const matchesCategory = selectedCategory === "Todas" || sameCategory(business.category, selectedCategory);
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
    address.append(strongText("Direccion: "), business.address);

    const phone = document.createElement("p");
    phone.className = "business-detail";
    phone.append(strongText("Telefono: "), business.phone);

    card.append(pill, title, address, phone);

    if (business.website) {
      const link = document.createElement("a");
      link.className = "business-link";
      link.href = business.website.startsWith("http") ? business.website : `https://${business.website}`;
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
  if (!googleSheetCsvUrl) return;

  try {
    const response = await fetch(googleSheetCsvUrl);
    const csv = await response.text();
    sheetBusinesses = csvToBusinesses(csv);
    renderBusinesses();
  } catch (error) {
    console.error("No se pudo cargar Google Sheets", error);
    if (formMessage) formMessage.textContent = "No se pudo cargar la hoja de negocios.";
  }
}

function csvToBusinesses(csv) {
  const rows = parseCsv(csv);
  const headerRowIndex = rows.findIndex((row) => {
    const normalized = row.map((cell) => normalize(cell));
    return normalized.includes("nombre") && normalized.includes("categoria");
  });

  if (headerRowIndex === -1) return [];

  const headers = rows[headerRowIndex].map((header) => normalize(header));
  const businessRows = rows.slice(headerRowIndex + 1);

  return businessRows
    .map((row) => {
      const data = {};
      headers.forEach((header, index) => {
        data[header] = (row[index] || "").trim();
      });

      const approved = normalize(data.aprobado || "");
      return {
        name: data.nombre || "",
        category: data.categoria || "",
        address: data.direccion || "",
        phone: data.telefono || "",
        website: data["sitio web o red social"] || data.web || data.redes || "",
        approved,
      };
    })
    .filter((business) => {
      const isApproved = business.approved === "si" || business.approved === "aprobado";
