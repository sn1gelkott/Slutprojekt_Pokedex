const pokedexContainer = document.getElementById("pokedex");
const filterSelect = document.getElementById("filter");
const searchInput = document.getElementById("search"); // All of these define a js variable that reference HTML-elements

let allPokemon = [];        // Pokémon loaded for the current generation(s); in this case first-gen Pokémon are loaded first
let legendaryPokemon = new Set();
let fullyLoadedPokemon = {}; // Cache to avoid re-fetching Pokémon

/* --- Defines the generation ranges for each button corresponding to the Pokémon generation--- */
const GEN_RANGES = {
  all: [1, 493], /* All pokémon 1-493.*/
  1: [1, 151],
  2: [152, 251],
  3: [252, 386],
  4: [387, 493]
};
/* Each number on the left-hand side is the generation of Pokémon and the range of Pokémon that fit into each category*/

// Please note that when fetched from the API each number corresponds to each Pokémon.
// This is also accurate to the number in the actual Pokédex in the games.


/* Load legendary list; lists pokémon under the category "legendary"*/
async function loadLegendaryList() {
  const response = await fetch("https://pokeapi.co/api/v2/pokemon-species?limit=2000"); //This endpoint is used to fetch data about all Pokémon
  const data = await response.json(); //async function to keep functions from running simultaneously

  for (let species of data.results) {
    const speciesData = await fetch(species.url).then(r => r.json());
    if (speciesData.is_legendary) { //If-conditions for if the boolean "is_legendary" = true
      legendaryPokemon.add(speciesData.id); //If the conditions are met then the Pokémon is categorized as "legendary"
    }
  }
}

/* Load Pokémon for a given range, the ranges are defined in "GEN_RANGE" (cached to prevent unnecessary network calls) */
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

/* Display Pokémon Cards */
function displayPokemon(list) {
  pokedexContainer.innerHTML = ""; //This function adds the fetched data create visible html-component

  list.forEach(pokemon => {
    const card = document.createElement("div");
    card.classList.add("pokemon-card"); //A div-element is created and named "pokemon-card"

    const types = pokemon.types
      .map(t => `<span class="type type-${t.type.name}">${t.type.name}</span>`)
      .join("");

    card.innerHTML = `
      <h3>#${pokemon.id} ${pokemon.name.toUpperCase()}</h3>
      <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
      <div class="types">${types}</div>
    `; /* This defines the different attributes fetched from the API which will then be applied to the 'empty' HTML-elements.
    In this case the ID, the name and the Pokémon type.*/

    pokedexContainer.appendChild(card); //This applies all the fetched data to the 'empty' cards.
  });
}

/* Apply search, legendary filter, etc. */
function applyFilters() {
  let filtered = [...allPokemon]; //The variable "filtered" is defined for all loaded Pokémon

  // Search filter using string-terms
  const term = searchInput.value.toLowerCase().trim();
  /* Defines the term as an input and changes it to lowercase. This is to match it with the data from the endpoint as it is written in lowercase.
  The trim function also gets rid of whitespaces, making it possible to get a search-result even with spaces in the search query. */
  if (term) {
    filtered = filtered.filter(p => p.name.toLowerCase().includes(term));
  }  /* Boolean, if the term = true (meaning there is a search term at all) then it will check if the term matches the fetched data "name" */

  // Legendary filter
  if (filterSelect.value === "legendary") {
    filtered = filtered.filter(p => legendaryPokemon.has(p.id));
  } //Boolean: if the HTML-element option "legendary" is selected then it will filter for Pokémon that have been labeled "legendary".

  displayPokemon(filtered);
} //This function is the same as before but instead displays the resulting "filtered" Pokémon for both instances (legendary or search term)

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
