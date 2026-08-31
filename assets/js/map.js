const DATASETS = {
	food: {
		url: "https://raw.githubusercontent.com/logos-circle-ruse/data/refs/heads/main/website/interactive-ruse/food.json",
		groupBy: "category",
		tagColours: {
			breakfast: "#F0B69E",
			lunch: "#79A1E8",
			dinner: "#2a2f4a",
			drinks: "#95B77F",
			"café": "#a9746e",
			"fast food": "#e67e22",
			asian: "#c0392b",
			banitsa: "#BBB47D",
			brunch: "#DACFC5",
			burger: "#d35400",
			danube: "#3498db",
			dessert: "#B9CDAC",
			doner: "#8e44ad",
			fish: "#2980b9",
			meat: "#7f2f22",
			pastry: "#e8c39e",
			pizza: "#f39c12",
			tavern: "#8e5a3c",
			view: "#27ae60"
		}
	},
	sightseeing: {
		url: "https://raw.githubusercontent.com/logos-circle-ruse/data/refs/heads/main/website/interactive-ruse/sightseeing.json",
		groupBy: null,
		tagColours: {
			museum: "#79A1E8",
			history: "#2a2f4a",
			culture: "#a9746e",
			literature: "#8e44ad",
			architecture: "#95B77F",
			art: "#e67e22",
			nature: "#27ae60",
			ecology: "#2ecc71",
			"historical site": "#7f2f22",
			roman: "#c0392b",
			fortress: "#8e5a3c",
			monument: "#3498db",
			memorial: "#34495e",
			ethnography: "#BBB47D",
			transport: "#f39c12",
			commercial: "#d35400",
			school: "#e8c39e",
			"public building": "#5d6d7e",
			commerce: "#b9770e",
			bank: "#1abc9c",
			religious: "#9b59b6",
			industry: "#7f8c8d",
			insurance: "#2980b9",
			theater: "#c2185b"
		}
	}
};
const DEFAULT_COLOUR = "#79A1E8";

function markerIcon(colour) {
	return L.divIcon({
		className: "",
		html: `<span style="
			display:block;
			width:16px;
			height:16px;
			border-radius:50%;
			background:${colour};
			border:2px solid #fff;
			box-shadow:0 0 3px rgba(0,0,0,0.5);
		"></span>`,
		iconSize: [16, 16],
		iconAnchor: [8, 8],
		popupAnchor: [0, -8]
	});
}

// Generous bounding box around Ruse, Bulgaria — used to reject bad/mistyped
// coordinates (e.g. a data entry pointing at a different city) so a single
// outlier can't blow out the map's zoom/bounds for everyone else.
const RUSE_BOUNDS = { minLat: 43.6, maxLat: 44.1, minLon: 25.5, maxLon: 26.4 };

async function loadPlaces(url) {
	const res = await fetch(url);
	const data = await res.json();
	return data.filter(place =>
		place.latitude != null && place.longitude != null &&
		place.latitude >= RUSE_BOUNDS.minLat && place.latitude <= RUSE_BOUNDS.maxLat &&
		place.longitude >= RUSE_BOUNDS.minLon && place.longitude <= RUSE_BOUNDS.maxLon
	);
}

function buildPopup(place) {
	const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
	const tags = (place.tags || []).join(", ");

	return DOMPurify.sanitize(`
		<h3>${place.name}</h3>
		<a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="popup-maps-link">How to get there?</a>
		${place.short_description ? `<div class="popup-description">${place.short_description}</div>` : ""}
		${!place.short_description ? `<div class="popup-tags">${tags}</div>` : ""}
	`, { ADD_ATTR: ["target"] });
}

function buildViewToggle(map) {
	const buttons = document.querySelectorAll("#view-toggle button");
	const listEl = document.getElementById("map-list");
	const mapEl = document.getElementById("map-container");

	buttons.forEach(button => {
		button.addEventListener("click", () => {
			buttons.forEach(b => b.classList.remove("active"));
			button.classList.add("active");

			const view = button.dataset.view;
			listEl.classList.toggle("view-hidden", view !== "list");
			mapEl.classList.toggle("view-hidden", view !== "map");

			if (view === "map") {
				map.invalidateSize();
			}
		});
	});
}

function buildTagSearch(container, allTags, onChange) {
	const selectedTags = new Set();

	container.innerHTML = `
		<div id="tag-search-box">
			<input type="text" id="tag-search-input" placeholder="Search tags..." autocomplete="off" />
			<div id="tag-search-dropdown" class="view-hidden"></div>
		</div>
		<div id="tag-search-selected"></div>
	`;

	const input = container.querySelector("#tag-search-input");
	const dropdown = container.querySelector("#tag-search-dropdown");
	const selectedContainer = container.querySelector("#tag-search-selected");

	function renderSelected() {
		selectedContainer.innerHTML = "";
		selectedTags.forEach(tag => {
			const pill = document.createElement("button");
			pill.className = "tag-search-pill";
			pill.textContent = tag + " ×";
			pill.addEventListener("click", () => {
				selectedTags.delete(tag);
				renderSelected();
				onChange(selectedTags);
			});
			selectedContainer.appendChild(pill);
		});
	}

	function renderDropdown() {
		const query = input.value.trim().toLowerCase();
		const matches = allTags.filter(tag =>
			!selectedTags.has(tag) && tag.toLowerCase().includes(query)
		);

		if (matches.length === 0) {
			dropdown.classList.add("view-hidden");
			dropdown.innerHTML = "";
			return;
		}

		dropdown.innerHTML = "";
		matches.forEach(tag => {
			const option = document.createElement("div");
			option.className = "tag-search-option";
			option.textContent = tag;
			option.addEventListener("click", () => {
				selectedTags.add(tag);
				input.value = "";
				renderSelected();
				renderDropdown();
				onChange(selectedTags);
			});
			dropdown.appendChild(option);
		});
		dropdown.classList.remove("view-hidden");
	}

	input.addEventListener("focus", renderDropdown);
	input.addEventListener("input", renderDropdown);
	document.addEventListener("click", event => {
		if (!container.contains(event.target)) {
			dropdown.classList.add("view-hidden");
		}
	});
}

function toTitleCase(text) {
	return text.replace(/\w\S*/g, word => word[0].toUpperCase() + word.slice(1));
}

async function loadDataset(datasetName, map, layerGroup) {
	const config = DATASETS[datasetName];
	const tagColours = config.tagColours;
	const listContainer = document.getElementById("map-list");
	listContainer.innerHTML = `<p class="no-results">Loading…</p>`;

	const places = await loadPlaces(config.url);
	const allTags = new Set();
	const entriesByGroup = new Map();

	places.forEach(place => {
		const groupKeys = config.groupBy ? (place[config.groupBy] || []) : ["__all__"];
		const primaryKey = config.groupBy ? groupKeys[0] : (place.tags || [])[0];
		const colour = tagColours[primaryKey] || DEFAULT_COLOUR;

		const marker = L.marker([place.latitude, place.longitude], {
			icon: markerIcon(colour)
		}).bindPopup(buildPopup(place));

		groupKeys.forEach(key => {
			if (!entriesByGroup.has(key)) {
				entriesByGroup.set(key, []);
			}
			entriesByGroup.get(key).push({ place, marker });
		});

		(place.tags || []).forEach(tag => allTags.add(tag));
	});

	function buildTable(groupName, entries) {
		const groupColour = tagColours[groupName] || DEFAULT_COLOUR;
		const rows = entries
			.map(({ place }) => place)
			.sort((a, b) => a.name.localeCompare(b.name));

		return `
			${config.groupBy ? `<h3 style="color: white">${toTitleCase(groupName)}</h3>` : ""}
			<table>
				<thead>
					<tr><th>Name</th><th>Tags</th></tr>
				</thead>
				<tbody>
					${rows.map(place => {
						const rowColour = config.groupBy
							? groupColour
							: (tagColours[(place.tags || [])[0]] || DEFAULT_COLOUR);
						const tags = (place.tags || [])
							.map(tag => {
								const tagColour = tagColours[tag] || DEFAULT_COLOUR;
								return `<span class="tag-pill" style="background:${tagColour}">${tag}</span>`;
							})
							.join("");
						return `
							<tr>
								<td class="place-name" style="background:${rowColour}">${place.name}</td>
								<td><div class="tag-list">${tags}</div></td>
							</tr>
						`;
					}).join("")}
				</tbody>
			</table>
		`;
	}

	function matchesTags(place, selectedTags) {
		if (selectedTags.size === 0) return true;
		const placeTags = new Set(place.tags || []);
		return [...selectedTags].every(tag => placeTags.has(tag));
	}

	function applyFilter(selectedTags) {
		layerGroup.clearLayers();

		const groups = [...entriesByGroup.keys()].sort();

		const html = groups.map(group => {
			const entries = entriesByGroup.get(group)
				.filter(({ place }) => matchesTags(place, selectedTags));

			if (entries.length === 0) return "";

			entries.forEach(({ marker }) => layerGroup.addLayer(marker));
			return buildTable(group, entries);
		}).join("");

		listContainer.innerHTML = html
			? DOMPurify.sanitize(html)
			: `<p class="no-results">No places match the selected tags.</p>`;
	}

	applyFilter(new Set());

	const bounds = L.latLngBounds(places.map(p => [p.latitude, p.longitude]));
	map.fitBounds(bounds, { padding: [30, 30] });

	const sortedTags = [...allTags].sort();
	buildTagSearch(document.getElementById("map-filters"), sortedTags, applyFilter);
}

function buildDatasetToggle(map, layerGroup) {
	const buttons = document.querySelectorAll("#dataset-toggle button");

	buttons.forEach(button => {
		button.addEventListener("click", () => {
			if (button.classList.contains("active")) return;
			buttons.forEach(b => b.classList.remove("active"));
			button.classList.add("active");
			loadDataset(button.dataset.dataset, map, layerGroup);
		});
	});
}

async function initMap() {
	const map = L.map("map-container");

	L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		maxZoom: 19
	}).addTo(map);

	const layerGroup = L.layerGroup().addTo(map);

	buildDatasetToggle(map, layerGroup);
	await loadDataset("food", map, layerGroup);

	document.getElementById("map-container").classList.add("view-hidden");
	buildViewToggle(map);
}

document.addEventListener("DOMContentLoaded", initMap);
