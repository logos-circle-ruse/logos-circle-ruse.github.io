async function loadLumaEvent() {
  try {
    const res = await fetch("https://raw.githubusercontent.com/logos-circle-ruse/data/refs/heads/main/website/main.json");
    const data = await res.json();

    const latest = data.updates[0];
    if (!latest) return;

    const eventDate = new Date(latest.date);
    const today = new Date();
    
    const btn = document.getElementById("luma-btn");
    btn.setAttribute("class", "button primary");
    
    if (eventDate < today){
      btn.innerHTML = "Виж Дейности"
      btn.setAttribute("href", `events.html`);
    }
    else{
      btn.innerHTML = "Следващо Събитие"
      btn.setAttribute("href", `https://luma.com/event/${latest.luma_event_id}`);
      btn.setAttribute("target", "_blank");
    }  
  } catch (err) {
    console.error(err);
  }
}

loadLumaEvent();