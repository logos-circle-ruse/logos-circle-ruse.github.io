async function loadProjects() {
    const url = "https://raw.githubusercontent.com/logos-circle-ruse/data/refs/heads/main/website/projects.json";

    const res = await fetch(url);
    const data = await res.json();

    const container = document.getElementById('pie-chart-controls');
    
    data.map((item, index) => {
        const button = document.createElement('button');
        button.textContent = item.name;

        button.addEventListener('click', () => {
            document.querySelectorAll('#pie-chart-controls button').forEach(b => b.disabled = false);
            selectProject(item);
            button.disabled = true;
        });

        if(index === 0){
            selectProject(item);
            button.disabled = true;
        }
        container.appendChild(button);
    });
}

function selectProject(item) {
    const projectProgress = document.getElementById("project-progress");
    projectProgress.innerHTML = `${item.completed_pct.toFixed(2)}%`
    
    const projectMembers = document.getElementById("project-members");
    projectMembers.innerHTML = `${item.members}`

    const header = document.getElementById("selected-project");
    header.innerHTML = item.name;
    
    const description = document.getElementById("project-description");
    description.innerHTML = DOMPurify.sanitize(marked.parse(item.description || ""));

    const gradient = item.chart_colours
        .map(c => `${c.colour} ${c.start}% ${c.end}%`)
        .join(', ');
    
    const chart = document.querySelector('#pie-chart .chart-container');
    chart.style.background = `conic-gradient(${gradient})`;

    const legend = document.getElementById('pie-chart-legend');
    legend.innerHTML = "";

    item.chart_colours.forEach((c, index) => {
        const percent = c.end - c.start;

        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';

        const colorBox = document.createElement('div');
        colorBox.className = 'legend-color';
        colorBox.style.background = c.colour;

        const text = document.createTextNode(` ${c.tag} - ${percent}%`);

        legendItem.appendChild(colorBox);
        legendItem.appendChild(text);

        legend.appendChild(legendItem);
    });
}

loadProjects()