const pokedexContainer = document.getElementById("pokedex");
const filterSelect = document.getElementById("filter");
const searchInput = document.getElementById("search"); // All of these define a js variable that reference HTML-elements

let allPokemon = [];        // Currently loaded Pokémon, in this case first-gen Pokémon are loaded first upon running
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


/* Load legendary list; lists Pokémon under the category "legendary" */
async function loadLegendaryList() {
  const response = await fetch("https://pokeapi.co/api/v2/pokemon-species?limit=2000"); //This endpoint is used to fetch data about all Pokémon
  const data = await response.json(); //async function to keep functions from running simultaneously

  for (let species of data.results) {
    const speciesData = await fetch(species.url).then(r => r.json());
    if (speciesData.is_legendary) { // If-conditions for if the boolean "is_legendary" = true
      legendaryPokemon.add(speciesData.id); //If the conditions are met then the Pokémon is categorized as "legendary"
    }
  }
}

/* Load Pokémon for a given range (cached to prevent unnecessary fetching) */
async function loadPokemonRange(start, end) {
  const requests = []; //Defines the requested data as a variable for any given range; for example the defined generations in "GEN_RANGE"

  for (let i = start; i <= end; i++) { //For-loop for loading Pokémon
    if (fullyLoadedPokemon[i]) {
      requests.push(fullyLoadedPokemon[i]); //If there are already loaded Pokémon in the cache then it will simply use that and stop here
    } else {
      const p = fetch(`https://pokeapi.co/api/v2/pokemon/${i}`) //The variable p is new data that has to be fetched from the API
        .then(res => res.json()) //If the Pokémon in the requested range have not been loaded then they will be fetched from the API
        .then(data => {
          fullyLoadedPokemon[i] = data; // To prevent this loop from running every time it also caches these new loaded Pokémon.
          return data;
        });
      requests.push(p); // The new fetched Pokémon pushed instead or in addition to the previously loaded Pokémon depending on the requested range.
    }
  }

  allPokemon = await Promise.all(requests);
  /* The new data included in "allPokemon" is not redefined until the function above is completed */
  applyFilters(); // Calls on the function of applying filters; this has been defined in row 83
}

/* Function for displaying Pokémon cards */
function displayPokemon(list) { //This function takes the fetched data and creates a visible html-component
  pokedexContainer.innerHTML = ""; 

  list.forEach(pokemon => { //Loop that performs this action for every element (Pokémon) on the list
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

/* Event Listeners related to the two filter-systems */
searchInput.addEventListener("input", applyFilters); // When a search term is written in the search input, filters are applied
filterSelect.addEventListener("change", applyFilters); // When an option is changes in the filter (legendary or all Pokémon), the filter is applied accordingly


/* Defines the behaviour of the dropdown-menu */
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
