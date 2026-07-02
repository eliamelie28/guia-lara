
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

