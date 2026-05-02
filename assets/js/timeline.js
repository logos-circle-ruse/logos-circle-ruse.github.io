async function loadTimeline() {
  try {
    
    const res = await fetch("https://raw.githubusercontent.com/logos-circle-ruse/data/refs/heads/main/website/events.json");
    const data = await res.json();

    renderTimeline(data.updates);
  } catch (err) {
    console.error(err);
  }
}

function renderTimeline(updates) {
  const container = document.getElementById("timeline");

  const itemsHTML = updates.map((item, index) => {
    const formattedDate = new Date(item.date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
    
    var urlText = "Научи повече"
    var url = item.url
    if (!url){
        url = `http://luma.com/event/${item.luma_event_id}`
        urlText = "Регистрирай се"
    }

    return `
      <li>
        <div class="timeline-time">
            ${formattedDate}
        </div>
        <div class="timeline-description"></div>

        ${DOMPurify.sanitize(marked.parse(item.description || ""))}

        <p>
          <a href="${url}" target="_blank">
            ${urlText}!
          </a>
        </p>
      </li>
    `;
  }).join("");

  container.innerHTML = `
    <div class="timeline-container">
      <div class="timeline-wrapper">
        <h1 style="font-size: 2rem">Стани част от промяната!</h1>
        <ul class="timeline-sessions">
          ${itemsHTML}
        </ul>
      </div>
    </div>
  `;
}

loadTimeline();