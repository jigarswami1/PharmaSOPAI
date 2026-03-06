const STORAGE_KEYS = {
  USERS: "pharmasop_users",
  CURRENT_USER: "pharmasop_current_user",
  DOCUMENTS: "pharmasop_documents",
  SERIALS: "pharmasop_serials"
};

const DEPARTMENTS = {
  "Quality Assurance": "QA",
  Production: "PRD",
  "Quality Control": "QC",
  Engineering: "ENG",
  Warehouse: "WH",
  Validation: "VAL",
  "Regulatory Affairs": "RA",
  Consultants: "CON"
};

const TEMPLATE_LIBRARY = [
  "Equipment Cleaning SOP", "Line Clearance SOP", "Equipment Operation SOP", "Preventive Maintenance SOP",
  "Calibration SOP", "Deviation Handling SOP", "Change Control SOP", "Material Sampling SOP",
  "Material Dispensing SOP", "Environmental Monitoring SOP"
];

const app = document.getElementById("app");

const readJSON = (key, fallback) => JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
const writeJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const state = {
  currentUser: readJSON(STORAGE_KEYS.CURRENT_USER, null),
  currentView: "dashboard",
  editingDocId: null
};

function render() {
  if (!state.currentUser) return renderAuth();
  renderMain();
}

function renderAuth() {
  app.innerHTML = document.getElementById("auth-template").innerHTML;
  let mode = "login";
  const form = document.getElementById("auth-form");
  const message = document.getElementById("auth-message");
  const nameField = document.getElementById("name-field");

  document.querySelectorAll("[data-auth-tab]").forEach((btn) => {
    btn.onclick = () => {
      mode = btn.dataset.authTab;
      document.querySelectorAll("[data-auth-tab]").forEach((b) => b.classList.toggle("active", b === btn));
      nameField.classList.toggle("hidden", mode !== "register");
      form.name.required = mode === "register";
      message.textContent = "";
    };
  });

  form.onsubmit = (e) => {
    e.preventDefault();
    const users = readJSON(STORAGE_KEYS.USERS, []);
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;

    if (mode === "register") {
      if (users.some((u) => u.email === email)) return (message.textContent = "Account already exists.");
      const user = { id: crypto.randomUUID(), email, password, name: form.name.value.trim() };
      users.push(user);
      writeJSON(STORAGE_KEYS.USERS, users);
      state.currentUser = { id: user.id, email: user.email, name: user.name };
    } else {
      const user = users.find((u) => u.email === email && u.password === password);
      if (!user) return (message.textContent = "Invalid credentials.");
      state.currentUser = { id: user.id, email: user.email, name: user.name };
    }

    writeJSON(STORAGE_KEYS.CURRENT_USER, state.currentUser);
    render();
  };
}

function renderMain() {
  app.innerHTML = document.getElementById("main-template").innerHTML;
  const root = document.getElementById("view-root");
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === state.currentView);
    btn.onclick = () => {
      state.currentView = btn.dataset.view;
      state.editingDocId = null;
      renderMain();
    };
  });

  document.getElementById("logout-btn").onclick = () => {
    state.currentUser = null;
    writeJSON(STORAGE_KEYS.CURRENT_USER, null);
    render();
  };

  const views = {
    dashboard: viewDashboard,
    generator: viewGenerator,
    templates: viewTemplates,
    documents: viewDocuments,
    settings: viewSettings
  };
  views[state.currentView](root);
}

function getDocuments() {
  const docs = readJSON(STORAGE_KEYS.DOCUMENTS, []);
  return docs.filter((d) => d.userId === state.currentUser.id);
}

function saveDocument(doc) {
  const docs = readJSON(STORAGE_KEYS.DOCUMENTS, []);
  const idx = docs.findIndex((d) => d.id === doc.id);
  if (idx >= 0) docs[idx] = doc;
  else docs.unshift(doc);
  writeJSON(STORAGE_KEYS.DOCUMENTS, docs);
}

function generateSopNumber(department) {
  const code = DEPARTMENTS[department] || "GEN";
  const serials = readJSON(STORAGE_KEYS.SERIALS, {});
  serials[code] = (serials[code] || 0) + 1;
  writeJSON(STORAGE_KEYS.SERIALS, serials);
  return `${code}/SOP/${String(serials[code]).padStart(3, "0")}`;
}

function viewDashboard(root) {
  const docs = getDocuments();
  root.innerHTML = `
    <section class="card">
      <h1>Dashboard</h1>
      <p class="subtle">Welcome, ${state.currentUser.name || state.currentUser.email}. Create and manage GMP-compliant SOPs.</p>
      <div class="kpis">
        <div class="kpi"><span>Total SOPs</span><strong>${docs.length}</strong></div>
        <div class="kpi"><span>Templates</span><strong>${TEMPLATE_LIBRARY.length}</strong></div>
        <div class="kpi"><span>Draft SOPs</span><strong>${docs.filter((d) => d.status === "Draft").length}</strong></div>
      </div>
    </section>
    <section class="grid">
      <article class="card"><h3>Create New SOP</h3><p>Open the guided wizard for GMP SOP generation.</p><button class="btn primary" data-go="generator">Start Wizard</button></article>
      <article class="card"><h3>SOP Templates</h3><p>Start quickly from validated SOP structures.</p><button class="btn secondary" data-go="templates">View Templates</button></article>
      <article class="card"><h3>Recent SOPs</h3><p>${docs.slice(0, 3).map((d) => d.title).join("; ") || "No recent SOPs."}</p><button class="btn secondary" data-go="documents">Open Library</button></article>
      <article class="card"><h3>Account Settings</h3><p>Manage profile information.</p><button class="btn secondary" data-go="settings">Open Settings</button></article>
    </section>`;

  root.querySelectorAll("[data-go]").forEach((btn) => (btn.onclick = () => {
    state.currentView = btn.dataset.go;
    renderMain();
  }));
}

function generateSopHtml(data) {
  const today = new Date().toISOString().split("T")[0];
  const procedure = [
    "Ensure equipment is cleaned before use and cleaning status is verified.",
    "Verify line clearance before initiating manufacturing activities.",
    "Record equipment ID and batch details in the approved logbook.",
    "Operate equipment according to qualified operating parameters.",
    "Report deviations through the quality management system immediately."
  ];

  return `
  <div class="sop-doc">
    <h2 style="text-align:center;">${data.companyName}</h2>
    <h3 style="text-align:center;">Standard Operating Procedure</h3>
    <table>
      <tr><th>Document Title</th><td>${data.sopTitle}</td><th>Document Number</th><td>${data.documentNumber}</td></tr>
      <tr><th>Version Number</th><td>01</td><th>Effective Date</th><td>${data.effectiveDate}</td></tr>
      <tr><th>Page Number</th><td colspan="3">1 of 1</td></tr>
    </table>

    <h3>SOP Metadata</h3>
    <table>
      <tr><th>Document Title</th><td>${data.sopTitle}</td><th>Department</th><td>${data.department}</td></tr>
      <tr><th>Document Number</th><td>${data.documentNumber}</td><th>Version</th><td>01</td></tr>
      <tr><th>Effective Date</th><td>${data.effectiveDate}</td><th>Review Date</th><td>${data.reviewDate}</td></tr>
      <tr><th>Prepared By</th><td>${data.preparedBy}</td><th>Reviewed By</th><td>${data.reviewedBy}</td></tr>
      <tr><th>Approved By</th><td>${data.approvedBy}</td><th>Supersedes Document</th><td>New</td></tr>
      <tr><th>Applicable Regulation</th><td colspan="3">${data.regulation}</td></tr>
    </table>

    <h3>1. Purpose</h3><p>To define a standardized GMP-compliant method for ${data.processName} in the ${data.department} department.</p>
    <h3>2. Scope</h3><p>This SOP applies to all trained personnel involved in ${data.processName}${data.equipmentName ? ` using ${data.equipmentName}` : ""}.</p>
    <h3>3. Responsibilities</h3>
    <div class="table-wrap"><table><tr><th>Role</th><th>Responsibility</th></tr>
      <tr><td>Production Officer</td><td>Execute procedure</td></tr>
      <tr><td>QA Officer</td><td>Verify compliance</td></tr>
      <tr><td>Head QA</td><td>Approve SOP</td></tr>
      <tr><td>Engineering</td><td>Maintain equipment</td></tr>
    </table></div>
    <h3>4. Accountability</h3><p>Department heads shall ensure implementation, periodic review, and regulatory compliance of this SOP.</p>
    <h3>5. Definitions and Abbreviations</h3><p>GMP: Good Manufacturing Practice. SOP: Standard Operating Procedure. QA: Quality Assurance. QC: Quality Control.</p>
    <h3>6. Procedure</h3>
    ${procedure.map((step, idx) => `<p>6.${idx + 1} ${step}</p>`).join("")}
    <h3>7. Safety Precautions</h3>
    <ul>
      <li>Use required personal protective equipment as per area classification.</li>
      <li>Follow chemical handling precautions and material safety data sheets.</li>
      <li>Observe equipment safety interlocks and lockout/tagout requirements.</li>
      <li>Initiate emergency procedures and notify supervision for any incident.</li>
    </ul>
    <h3>8. Records and Forms</h3>
    <ul>
      <li>Equipment cleaning checklist</li>
      <li>Equipment usage log</li>
      <li>Line clearance checklist</li>
      <li>Training acknowledgement form</li>
    </ul>
    <h3>9. References</h3><p>${data.regulation}, site quality manual, and approved validation documentation.</p>
    <h3>10. Annexures</h3><p>Annexure I – Cleaning Checklist; Annexure II – Equipment Log Sheet; Annexure III – Line Clearance Checklist.</p>
    <h3>11. Revision History</h3>
    <table><tr><th>Version</th><th>Date</th><th>Description of Change</th></tr>
      <tr><td>01</td><td>${today}</td><td>Initial issue.</td></tr>
    </table>
  </div>`;
}

function viewGenerator(root) {
  const doc = state.editingDocId ? getDocuments().find((d) => d.id === state.editingDocId) : null;
  root.innerHTML = `
    <section class="card">
      <h1>SOP Generation Wizard</h1>
      <p class="subtle">Generate WHO GMP / EU GMP / USFDA cGMP aligned SOP drafts.</p>
      <form id="wizard-form" class="stack">
        <div class="row">
          <label>Company Name<input name="companyName" required value="${doc?.companyName || ""}" /></label>
          <label>Department
            <select name="department" required>${Object.keys(DEPARTMENTS).map((d) => `<option ${doc?.department === d ? "selected" : ""}>${d}</option>`).join("")}</select>
          </label>
          <label>SOP Title<input name="sopTitle" required value="${doc?.title || ""}" /></label>
        </div>
        <div class="row">
          <label>Process Name<input name="processName" required value="${doc?.processName || ""}" /></label>
          <label>Equipment Name (optional)<input name="equipmentName" value="${doc?.equipmentName || ""}" /></label>
          <label>Applicable Regulation<select name="regulation" required>
            ${["WHO GMP", "EU GMP", "USFDA cGMP"].map((r) => `<option ${doc?.regulation === r ? "selected" : ""}>${r}</option>`).join("")}
          </select></label>
        </div>
        <div class="row">
          <label>Prepared By<input name="preparedBy" required value="${doc?.preparedBy || ""}" /></label>
          <label>Reviewed By<input name="reviewedBy" required value="${doc?.reviewedBy || ""}" /></label>
          <label>Approved By<input name="approvedBy" required value="${doc?.approvedBy || ""}" /></label>
        </div>
        <div class="row">
          <label>Effective Date<input type="date" name="effectiveDate" required value="${doc?.effectiveDate || ""}" /></label>
          <label>Review Date<input type="date" name="reviewDate" required value="${doc?.reviewDate || ""}" /></label>
          <div></div>
        </div>
        <button class="btn primary" type="submit">${doc ? "Update SOP Draft" : "Generate SOP"}</button>
      </form>
    </section>
    <section class="card hidden" id="editor-card">
      <h2>Document Editor</h2>
      <div class="editor-toolbar no-print">
        <button class="btn ghost" data-cmd="bold">Bold</button>
        <button class="btn ghost" data-cmd="italic">Italic</button>
        <button class="btn ghost" data-cmd="insertUnorderedList">Bullet List</button>
        <button class="btn ghost" id="add-section">Add Section</button>
        <button class="btn ghost" id="add-table">Add Table</button>
        <button class="btn ghost" id="add-annexure">Add Annexure</button>
      </div>
      <div id="editor" class="editor" contenteditable="true"></div>
      <div class="item-actions no-print">
        <button class="btn primary" id="save-doc">Save</button>
        <button class="btn secondary" id="export-pdf">Export PDF</button>
        <button class="btn secondary" id="export-docx">Export DOCX</button>
      </div>
    </section>
  `;

  const form = document.getElementById("wizard-form");
  const editorCard = document.getElementById("editor-card");
  const editor = document.getElementById("editor");

  let workingDoc = doc;
  if (doc) {
    editorCard.classList.remove("hidden");
    editor.innerHTML = doc.html;
  }

  form.onsubmit = (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(form));
    const documentNumber = doc?.documentNumber || generateSopNumber(formData.department);
    const html = generateSopHtml({ ...formData, documentNumber });
    workingDoc = {
      id: doc?.id || crypto.randomUUID(),
      userId: state.currentUser.id,
      title: formData.sopTitle,
      processName: formData.processName,
      equipmentName: formData.equipmentName,
      regulation: formData.regulation,
      companyName: formData.companyName,
      department: formData.department,
      preparedBy: formData.preparedBy,
      reviewedBy: formData.reviewedBy,
      approvedBy: formData.approvedBy,
      effectiveDate: formData.effectiveDate,
      reviewDate: formData.reviewDate,
      documentNumber,
      status: "Draft",
      updatedAt: new Date().toISOString(),
      html
    };
    editor.innerHTML = workingDoc.html;
    editorCard.classList.remove("hidden");
  };

  document.querySelectorAll("[data-cmd]").forEach((b) => b.onclick = () => document.execCommand(b.dataset.cmd));
  document.getElementById("add-section").onclick = () => {
    const n = prompt("Enter section heading");
    if (n) editor.innerHTML += `<h3>${n}</h3><p>Enter content.</p>`;
  };
  document.getElementById("add-table").onclick = () => {
    editor.innerHTML += `<table><tr><th>Field</th><th>Value</th></tr><tr><td></td><td></td></tr></table>`;
  };
  document.getElementById("add-annexure").onclick = () => {
    editor.innerHTML += `<h4>Annexure ${Date.now().toString().slice(-3)}</h4><p>Annexure details.</p>`;
  };

  document.getElementById("save-doc").onclick = () => {
    if (!workingDoc) return alert("Generate SOP first.");
    workingDoc.html = editor.innerHTML;
    workingDoc.updatedAt = new Date().toISOString();
    saveDocument(workingDoc);
    alert("SOP saved.");
  };

  document.getElementById("export-pdf").onclick = () => {
    if (!workingDoc) return alert("Generate SOP first.");
    window.print();
  };

  document.getElementById("export-docx").onclick = () => {
    if (!workingDoc) return alert("Generate SOP first.");
    const content = `<!DOCTYPE html><html><body>${editor.innerHTML}</body></html>`;
    const blob = new Blob([content], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${workingDoc.documentNumber.replace(/\//g, "-")}.docx`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
}

function viewTemplates(root) {
  root.innerHTML = `
    <section class="card">
      <h1>SOP Templates Library</h1>
      <p class="subtle">Predefined templates for frequently used pharmaceutical SOP categories.</p>
      <div class="grid">
      ${TEMPLATE_LIBRARY.map((tpl) => `<article class="card"><span class="badge">Template</span><h3>${tpl}</h3><button class="btn secondary" data-template="${tpl}">Use Template</button></article>`).join("")}
      </div>
    </section>`;

  root.querySelectorAll("[data-template]").forEach((btn) => {
    btn.onclick = () => {
      state.currentView = "generator";
      renderMain();
      const titleField = document.querySelector("input[name='sopTitle']");
      if (titleField) titleField.value = btn.dataset.template;
    };
  });
}

function viewDocuments(root) {
  const docs = getDocuments();
  root.innerHTML = `
    <section class="card">
      <h1>My SOP Documents</h1>
      <div class="row"><label>Search SOPs<input id="search" placeholder="Search by title, number, department" /></label></div>
      <div id="docs-list" class="list"></div>
    </section>`;

  const list = document.getElementById("docs-list");
  const draw = (filter = "") => {
    const q = filter.toLowerCase();
    const filtered = docs.filter((d) => [d.title, d.documentNumber, d.department].join(" ").toLowerCase().includes(q));
    list.innerHTML = filtered.length ? filtered.map((d) => `
      <article class="card">
        <h3>${d.title}</h3>
        <p><strong>${d.documentNumber}</strong> • ${d.department} • ${d.regulation}</p>
        <p class="subtle">Updated: ${new Date(d.updatedAt).toLocaleString()}</p>
        <div class="item-actions">
          <button class="btn secondary" data-action="edit" data-id="${d.id}">Edit</button>
          <button class="btn ghost" data-action="duplicate" data-id="${d.id}">Duplicate</button>
          <button class="btn danger" data-action="delete" data-id="${d.id}">Delete</button>
        </div>
      </article>
    `).join("") : `<p class="subtle">No SOPs found.</p>`;

    list.querySelectorAll("[data-action]").forEach((btn) => {
      btn.onclick = () => {
        const all = readJSON(STORAGE_KEYS.DOCUMENTS, []);
        const target = all.find((x) => x.id === btn.dataset.id);
        if (!target) return;

        if (btn.dataset.action === "edit") {
          state.editingDocId = target.id;
          state.currentView = "generator";
          renderMain();
        }
        if (btn.dataset.action === "duplicate") {
          const copy = { ...target, id: crypto.randomUUID(), title: `${target.title} (Copy)`, updatedAt: new Date().toISOString() };
          all.unshift(copy);
          writeJSON(STORAGE_KEYS.DOCUMENTS, all);
          renderMain();
        }
        if (btn.dataset.action === "delete") {
          writeJSON(STORAGE_KEYS.DOCUMENTS, all.filter((x) => x.id !== target.id));
          renderMain();
        }
      };
    });
  };

  draw();
  document.getElementById("search").oninput = (e) => draw(e.target.value);
}

function viewSettings(root) {
  root.innerHTML = `
    <section class="card">
      <h1>Account Settings</h1>
      <form id="settings-form" class="stack">
        <label>Full Name<input name="name" value="${state.currentUser.name || ""}" /></label>
        <label>Email<input name="email" value="${state.currentUser.email}" disabled /></label>
        <button class="btn primary" type="submit">Save Settings</button>
      </form>
    </section>`;

  document.getElementById("settings-form").onsubmit = (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    const users = readJSON(STORAGE_KEYS.USERS, []);
    const user = users.find((u) => u.id === state.currentUser.id);
    if (user) user.name = name;
    state.currentUser.name = name;
    writeJSON(STORAGE_KEYS.USERS, users);
    writeJSON(STORAGE_KEYS.CURRENT_USER, state.currentUser);
    alert("Settings updated.");
  };
}

render();
