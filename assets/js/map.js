const CATEGORY_COLOURS = {
	breakfast: "#F0B69E",
	lunch: "#79A1E8",
	dinner: "#2a2f4a",
	drinks: "#95B77F",
	"café": "#a9746e",
	"fast food": "#e67e22"
};

const TAG_COLOURS = {
	...CATEGORY_COLOURS,
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

async function loadPlaces() {
	const res = await fetch("https://raw.githubusercontent.com/logos-circle-ruse/data/refs/heads/main/website/interactive-ruse/food.json");
	const data = await res.json();
	return data.filter(place => place.latitude != null && place.longitude != null);
}

function buildPopup(place) {
	const tags = (place.tags || []).join(", ");
	const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
	return DOMPurify.sanitize(`
		<h3>${place.name}</h3>
		<a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="popup-maps-link">How to get there?</a>
		<div class="popup-tags">${tags}</div>
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

async function initMap() {
	const map = L.map("map-container");

	L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		maxZoom: 19
	}).addTo(map);

	const places = await loadPlaces();
	const entriesByCategory = new Map();
	const allTags = new Set();

	places.forEach(place => {
		const categories = place.category || [];
		const primaryCategory = categories[0];
		const colour = CATEGORY_COLOURS[primaryCategory] || DEFAULT_COLOUR;
		const marker = L.marker([place.latitude, place.longitude], {
			icon: markerIcon(colour)
		}).bindPopup(buildPopup(place));

		categories.forEach(category => {
			if (!entriesByCategory.has(category)) {
				entriesByCategory.set(category, []);
			}
			entriesByCategory.get(category).push({ place, marker });
		});

		(place.tags || []).forEach(tag => allTags.add(tag));
	});

	const layerGroup = L.layerGroup().addTo(map);
	const listContainer = document.getElementById("map-list");

	function toTitleCase(text) {
		return text.replace(/\w\S*/g, word => word[0].toUpperCase() + word.slice(1));
	}

	function buildTable(categoryName, entries) {
		const colour = CATEGORY_COLOURS[categoryName] || DEFAULT_COLOUR;
		const rows = entries
			.map(({ place }) => place)
			.sort((a, b) => a.name.localeCompare(b.name));

		return `
			<h3 style="color: white">${toTitleCase(categoryName)}</h3>
			<table>
				<thead>
					<tr><th>Name</th><th>Tags</th></tr>
				</thead>
				<tbody>
					${rows.map(place => {
						const tags = (place.tags || [])
							.map(tag => {
								const tagColour = TAG_COLOURS[tag] || DEFAULT_COLOUR;
								return `<span class="tag-pill" style="background:${tagColour}">${tag}</span>`;
							})
							.join("");
						return `
							<tr>
								<td class="place-name" style="background:${colour}">${place.name}</td>
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

		const categories = [...entriesByCategory.keys()].sort();

		const html = categories.map(cat => {
			const entries = entriesByCategory.get(cat)
				.filter(({ place }) => matchesTags(place, selectedTags));

			if (entries.length === 0) return "";

			entries.forEach(({ marker }) => layerGroup.addLayer(marker));
			return buildTable(cat, entries);
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

	document.getElementById("map-container").classList.add("view-hidden");
	buildViewToggle(map);
}

document.addEventListener("DOMContentLoaded", initMap);
