const pokedexContainer = document.getElementById("pokedex");
const filterSelect = document.getElementById("filter");
const searchInput = document.getElementById("search");

let allPokemon = [];        // Pokémon loaded for the current generation(s)
let legendaryPokemon = new Set();
let fullyLoadedPokemon = {}; // Cache to avoid re-fetching Pokémon

/* --- Generation ranges (including ALL) --- */
const GEN_RANGES = {
  all: [1, 493],
  1: [1, 151],
  2: [152, 251],
  3: [252, 386],
  4: [387, 493]
};



/* --- Load legendary list --- */
async function loadLegendaryList() {
  const response = await fetch("https://pokeapi.co/api/v2/pokemon-species?limit=2000");
  const data = await response.json();

  for (let species of data.results) {
    const speciesData = await fetch(species.url).then(r => r.json());
    if (speciesData.is_legendary) {
      legendaryPokemon.add(speciesData.id);
    }
  }
}

/* --- Load Pokémon for a given range (cached to prevent unnecessary network calls) --- */
async function loadPokemonRange(start, end) {
  const requests = [];

  for (let i = start; i <= end; i++) {
    if (fullyLoadedPokemon[i]) {
      // already loaded, reuse from cache
      requests.push(fullyLoadedPokemon[i]);
    } else {
      const p = fetch(`https://pokeapi.co/api/v2/pokemon/${i}`)
        .then(res => res.json())
        .then(data => {
          fullyLoadedPokemon[i] = data; // cache it
          return data;
        });
      requests.push(p);
    }
  }

  allPokemon = await Promise.all(requests);
  applyFilters();
}

/* --- Display Pokémon Cards --- */
function displayPokemon(list) {
  pokedexContainer.innerHTML = "";

  list.forEach(pokemon => {
    const card = document.createElement("div");
    card.classList.add("pokemon-card");

    const types = pokemon.types
      .map(t => `<span class="type type-${t.type.name}">${t.type.name}</span>`)
      .join("");

    card.innerHTML = `
      <h3>#${pokemon.id} ${pokemon.name.toUpperCase()}</h3>
      <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
      <div class="types">${types}</div>
    `;

    pokedexContainer.appendChild(card);
  });
}

/* --- Apply search, legendary filter, etc. --- */
function applyFilters() {
  let filtered = [...allPokemon];

  // Search filter
  const term = searchInput.value.toLowerCase().trim();
  if (term) {
    filtered = filtered.filter(p => p.name.toLowerCase().includes(term));
  }

  // Legendary filter
  if (filterSelect.value === "legendary") {
    filtered = filtered.filter(p => legendaryPokemon.has(p.id));
  }

  displayPokemon(filtered);
}

/* --- Event Listeners --- */
searchInput.addEventListener("input", applyFilters);
filterSelect.addEventListener("change", applyFilters);


/* --- Generation dropdown clicks --- */
document.querySelectorAll(".dropdown-content a").forEach(btn => {
  btn.addEventListener("click", (event) => {
    event.preventDefault(); // prevent scrolling to top

    const gen = btn.dataset.gen;
    const [start, end] = GEN_RANGES[gen];

    loadPokemonRange(start, end);
  });
});

/* --- INIT --- */
(async function init() {
  await loadLegendaryList();
  loadPokemonRange(1, 151); // Default: Gen 1
})();
