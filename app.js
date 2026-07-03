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
      if (char === "\r" && next === "\n") index += 1;
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

  saveBusiness(business);
  selectedCategory = business.category;
  form.reset();
  formMessage.textContent = "Negocio registrado en esta computadora. Para que salga en todos lados, agregalo a Google Sheets y pon aprobado = si.";
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
