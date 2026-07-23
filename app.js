const supabaseUrl = "https://byqklrrjnvafflrrkuac.supabase.co";
const supabaseKey = "sb_publishable_jXP_byfYeAAa1kLBHwURWg_S__9PLob";
const db = window.supabase.createClient(supabaseUrl, supabaseKey);

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

let selectedCategory = "Todas";
let businessesFromDatabase = [];

const tabs = document.querySelector("#categoryTabs");
const grid = document.querySelector("#businessGrid");
const count = document.querySelector("#resultCount");
const emptyState = document.querySelector("#emptyState");
const searchInput = document.querySelector("#searchInput");
const clearSearch = document.querySelector("#clearSearch");
const form = document.querySelector("#businessForm");
const categorySelect = document.querySelector("#category");
const formMessage = document.querySelector("#formMessage");

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function loadBusinesses() {
  return businessesFromDatabase.length ? businessesFromDatabase : starterBusinesses;
}

async function loadBusinessesFromSupabase() {
  formMessage.textContent = "Cargando negocios...";

  const { data, error } = await db
    .from("businesses")
    .select("id, name, category, address, phone, website, approved, created_at")
    .eq("approved", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("No se pudo cargar Supabase", error);
    formMessage.textContent = "No se pudo cargar Supabase. Revisa que la tabla businesses este expuesta en Data API.";
    renderBusinesses();
    return;
  }

  businessesFromDatabase = data || [];
  formMessage.textContent = "";
  renderBusinesses();
}

async function saveBusiness(business) {
  const { error } = await db.from("businesses").insert([
    {
      name: business.name,
      category: business.category,
      address: business.address,
      phone: business.phone,
      website: business.website,
      approved: false,
    },
  ]);

  if (error) {
    console.error("No se pudo registrar el negocio", error);
    throw error;
  }
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
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Elige una categoria";
  categorySelect.appendChild(placeholder);

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

function strongText(text) {
  const strong = document.createElement("strong");
  strong.textContent = text;
  return strong;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const business = {
    name: data.get("name").trim(),
    category: data.get("category"),
    address: data.get("address").trim(),
    phone: data.get("phone").trim(),
    website: data.get("website").trim(),
  };

  formMessage.textContent = "Enviando negocio...";

  try {
    await saveBusiness(business);
    selectedCategory = business.category;
    form.reset();
    formMessage.textContent = "Negocio enviado. Aparecera cuando lo apruebes en Supabase.";
    renderCategories();
    renderBusinesses();
    document.querySelector("#directorio").scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    formMessage.textContent = "No se pudo enviar. Revisa Supabase y vuelve a intentar.";
  }
});

searchInput.addEventListener("input", renderBusinesses);
clearSearch.addEventListener("click", () => {
  searchInput.value = "";
  renderBusinesses();
  searchInput.focus();
});

renderCategories();
renderBusinesses();
loadBusinessesFromSupabase();
