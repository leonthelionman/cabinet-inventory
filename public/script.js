let drawerData = {};
let currentDrawerId = null;
let slotCounts = {};

fetch('/api/data')
  .then(res => res.json())
  .then(data => {
    drawerData = data.drawerData || {};
    slotCounts = data.slotCounts || {};
    createGrid('Unit 1', 1, 'grid-1');
    createGrid('Unit 2', 2, 'grid-2');
    updateFillBars();
  });

function saveData() {
  fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ drawerData, slotCounts })
  }).catch(err => console.error('Failed to save:', err));
}

function createGrid(unitName, unitNum, gridId) {
  const grid = document.getElementById(gridId);
  for (let i = 1; i <= 100; i++) {
    const drawer = document.createElement("div");
    drawer.className = "drawer";
    drawer.id = `unit${unitNum}-drawer-${String(i).padStart(3, '0')}`;
    drawer.onclick = () => openModal(drawer.id, unitName, i);

    const label = document.createElement("div");
    label.className = "drawer-label";
    label.textContent = i;
    drawer.appendChild(label);

    grid.appendChild(drawer);
  }
}

function openModal(id, unitName, num) {
  currentDrawerId = id;
  document.getElementById("modalTitle").textContent = `${unitName}, Drawer-${String(num).padStart(3, '0')}`;
  const container = document.getElementById("drawerContents");
  container.innerHTML = "";

  if (!drawerData[id]) drawerData[id] = Array(6).fill(null);
  if (!slotCounts[id]) slotCounts[id] = 6;

  const slotSelect = document.createElement("select");
  for (let i = 1; i <= 6; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `${i} slots`;
    if (i === slotCounts[id]) opt.selected = true;
    slotSelect.appendChild(opt);
  }
  slotSelect.onchange = () => {
    slotCounts[id] = parseInt(slotSelect.value);
    saveData();
    openModal(id, unitName, num);
  };
  container.appendChild(slotSelect);

  for (let i = 5; i >= 6 - slotCounts[id]; i--) {
    const visualSlot = 6 - i;
    const slotDiv = document.createElement("div");
    slotDiv.classList.add("slot");
    slotDiv.innerHTML = "";

    const existing = drawerData[id][i];
    if (existing && existing.part && existing.link) {
      const link = document.createElement("a");
      link.href = existing.link;
      link.target = "_blank";
      link.textContent = existing.part;
      link.className = "part-link";

      const editBtn = document.createElement("button");
      editBtn.textContent = "Edit";
      editBtn.onclick = () => {
        drawerData[id][i] = null;
        saveData();
        openModal(id, unitName, num);
        updateFillBars();
      };

      slotDiv.appendChild(document.createTextNode(`Slot ${visualSlot}: `));
      slotDiv.appendChild(link);
      slotDiv.appendChild(editBtn);
    } else {
      const label = document.createElement("label");
      label.textContent = `Slot ${visualSlot}`;
      const input = document.createElement("input");
      input.placeholder = "Part Number or McMaster Link";
      input.dataset.index = i;

      const button = document.createElement("button");
      button.textContent = "Add";
      button.className = "add-button";
      button.onclick = () => {
        const raw = input.value.trim();
        if (!raw) return;

        let part = raw;
        if (raw.startsWith("https://www.mcmaster.com/")) {
          part = raw.replace("https://www.mcmaster.com/", "").replace(/\/$/, "");
        }
        const link = `https://www.mcmaster.com/${part}/`;
        drawerData[id][i] = { part, link };
        saveData();
        openModal(id, unitName, num);
        updateFillBars();
      };

      slotDiv.appendChild(label);
      slotDiv.appendChild(input);
      slotDiv.appendChild(button);
    }

    container.appendChild(slotDiv);
  }

  document.getElementById("drawerModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("drawerModal").style.display = "none";
}

function searchPart() {
  let term = document.getElementById("searchInput").value.trim().toLowerCase();
  const results = document.getElementById("searchResults");
  results.innerHTML = "";

  if (term.startsWith("https://www.mcmaster.com/")) {
    term = term.replace("https://www.mcmaster.com/", "").replace(/\/$/, "");
  }

  for (const [drawer, slots] of Object.entries(drawerData)) {
    slots.forEach((slot, idx) => {
      if (!slot) return;
      const partMatch = slot.part && slot.part.toLowerCase().includes(term);
      const linkMatch = slot.link && slot.link.toLowerCase().includes(term);

      if (partMatch || linkMatch) {
        const match = drawer.match(/unit(\d+)-drawer-(\d+)/);
        if (match) {
          const unitNum = match[1];
          const drawerNum = match[2];
          const visualSlot = 6 - idx;
          const li = document.createElement("li");
          li.textContent = `${slot.part} is in Unit: ${unitNum}, Drawer: ${drawerNum}, Slot: ${visualSlot}`;
          li.style.whiteSpace = "nowrap";
          results.appendChild(li);

          const el = document.getElementById(drawer);
          if (el) {
            el.classList.add("highlight");
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => el.classList.remove("highlight"), 4000);
          }
        }
      }
    });
  }
}

function updateFillBars() {
  Object.keys(drawerData).forEach(drawerId => {
    const el = document.getElementById(drawerId);
    if (!el) return;
    let count = drawerData[drawerId].filter(slot => slot !== null).length;
    el.querySelectorAll(".slot-fill").forEach(e => e.remove());

    const bar = document.createElement("div");
    bar.className = "slot-fill";
    bar.style.height = `${(count / 6) * 100}%`;
    el.appendChild(bar);
  });
}