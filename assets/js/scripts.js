/* site.js — PartsMtaani shared scripts */

// ── Hamburger nav toggle ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  const hamburger = document.querySelector('.nav-hamburger');
  const navLinks  = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
  }

  // Close mobile nav when clicking outside
  document.addEventListener('click', function (e) {
    if (navLinks && hamburger && !navLinks.contains(e.target) && !hamburger.contains(e.target)) {
      navLinks.classList.remove('open');
    }
  });

  // ── Sticky TOC active state ───────────────────────────────────
  const tocLinks = document.querySelectorAll('.prose-toc ul li a');
  if (tocLinks.length > 0) {
    const headings = Array.from(
      document.querySelectorAll('.prose-section[id]')
    );

    function setActive() {
      let current = '';
      headings.forEach(section => {
        if (window.scrollY >= section.offsetTop - 120) {
          current = section.id;
        }
      });
      tocLinks.forEach(link => {
        const li = link.parentElement;
        li.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
          li.classList.add('active');
        }
      });
    }

    window.addEventListener('scroll', setActive, { passive: true });
    setActive();
  }

  // ── Smooth scroll for anchor links ─────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#' || href === '#0') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});

// ── Copy Paybill Number to Clipboard ───────────────────────────
function copyPaybill() {
  const paybill = '4048209';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(paybill).then(() => {
      showCopySuccess();
    }).catch(() => {
      fallbackCopy(paybill);
    });
  } else {
    fallbackCopy(paybill);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
    showCopySuccess();
  } catch (err) {
    alert('Press Ctrl+C to copy the Paybill number: ' + text);
  }
  document.body.removeChild(ta);
}

function showCopySuccess() {
  const copyIcon = document.getElementById('icon-copy');
  const checkIcon = document.getElementById('icon-check');
  const toast = document.getElementById('copy-toast');
  const row = document.getElementById('paybill-row');
  if (copyIcon) copyIcon.style.display = 'none';
  if (checkIcon) checkIcon.style.display = 'block';
  if (toast) toast.style.display = 'block';
  if (row) {
    row.style.background = '#edfaf4';
    row.style.borderColor = '#a3e8cc';
  }
  setTimeout(() => {
    if (copyIcon) copyIcon.style.display = 'block';
    if (checkIcon) checkIcon.style.display = 'none';
    if (toast) toast.style.display = 'none';
    if (row) {
      row.style.background = '';
      row.style.borderColor = '';
    }
  }, 2200);
}

// ── FAQ Accordion ──────────────────────────────────────────────
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  if (!item) return;
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

// ── Multi-Vehicle Order Form State ─────────────────────────────
let vehicleCount = 1;
let partCounters = {1: 1};
let partImages = {};

function goToStep(step) {
  const step1 = document.getElementById('step-1');
  const step2 = document.getElementById('step-2');
  const dot1 = document.getElementById('step1-dot');
  const dot2 = document.getElementById('step2-dot');
  if (!step1 || !step2 || !dot1 || !dot2) return;
  
  if (step === 1) {
    step1.style.display = 'block';
    step2.style.display = 'none';
    dot1.classList.add('active');
    dot2.classList.remove('active');
  } else {
    const fullName = document.getElementById('full_name')?.value.trim() || '';
    const phone = document.getElementById('phone')?.value.trim() || '';
    const email = document.getElementById('email')?.value.trim() || '';
    const location = document.getElementById('location')?.value.trim() || '';
    if (!fullName || !phone || !email || !location) {
      alert('Please fill in all required contact fields (Name, Phone, Email, Location) before continuing.');
      return;
    }
    step1.style.display = 'none';
    step2.style.display = 'block';
    dot1.classList.remove('active');
    dot2.classList.add('active');
    dot1.classList.add('completed');
  }
  const orderForm = document.getElementById('order-form');
  if (orderForm) orderForm.scrollIntoView({behavior: 'smooth', block: 'start'});
}

function addVehicle() {
  vehicleCount++;
  partCounters[vehicleCount] = 1;
  renderVehicles();
}

function removeVehicle(vehicleId) {
  if (vehicleCount <= 1) return;
  delete partCounters[vehicleId];
  Object.keys(partImages).forEach(key => {
    if (key.startsWith(vehicleId + '_')) delete partImages[key];
  });
  vehicleCount--;
  renderVehicles();
}

function addPart(vehicleId) {
  partCounters[vehicleId]++;
  renderVehicles();
}

function removePart(vehicleId, partIdx) {
  const key = `${vehicleId}_${partIdx + 1}`;
  delete partImages[key];
  const partsContainer = document.getElementById(`parts-${vehicleId}`);
  if (partsContainer) {
    const parts = partsContainer.querySelectorAll('.part-item');
    if (parts.length > 1) {
      parts[partIdx].remove();
      partCounters[vehicleId]--;
      const newImages = {};
      let newIdx = 1;
      for (let p = 1; p <= partCounters[vehicleId] + 1; p++) {
        const oldKey = `${vehicleId}_${p}`;
        if (p !== partIdx + 1 && partImages[oldKey]) {
          newImages[`${vehicleId}_${newIdx}`] = partImages[oldKey];
          newIdx++;
        }
      }
      Object.assign(partImages, newImages);
    }
  }
}

function handleImageUpload(vehicleId, partId, input) {
  const files = Array.from(input.files);
  const key = `${vehicleId}_${partId}`;
  if (!partImages[key]) partImages[key] = [];
  partImages[key] = [...partImages[key], ...files];
  renderImagePreview(vehicleId, partId);
  input.value = '';
}

function deleteImage(vehicleId, partId, imgIndex) {
  const key = `${vehicleId}_${partId}`;
  if (partImages[key]) {
    partImages[key].splice(imgIndex, 1);
    if (partImages[key].length === 0) delete partImages[key];
    renderImagePreview(vehicleId, partId);
  }
}

function renderImagePreview(vehicleId, partId) {
  const container = document.getElementById(`preview-${vehicleId}-${partId}`);
  if (!container) return;
  const key = `${vehicleId}_${partId}`;
  const images = partImages[key] || [];
  container.innerHTML = '';
  images.forEach((file, idx) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const div = document.createElement('div');
      div.className = 'preview-img';
      div.innerHTML = `<img src="${e.target.result}" alt="part image"><button type="button" class="delete-img" onclick="deleteImage(${vehicleId}, ${partId}, ${idx})">&times;</button>`;
      container.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
}

function renderParts(vehicleId) {
  let partsHtml = '';
  for (let p = 1; p <= partCounters[vehicleId]; p++) {
    partsHtml += `<div class="az-part-item" id="part-item-${vehicleId}-${p}">
      <div class="az-part-header">
        <span class="az-part-label">Part ${p}</span>
        ${partCounters[vehicleId] > 1 ? `<button type="button" class="az-remove-part" onclick="removePart(${vehicleId}, ${p-1})">Remove</button>` : ''}
      </div>
      <div class="az-field">
        <label>Part name or description <span class="req">*</span></label>
        <input type="text" name="vehicle_${vehicleId}_part_${p}_name" placeholder="e.g. Front differential assembly" required>
      </div>
      <div class="az-field-row">
        <div class="az-field"><label>OEM part number</label><input type="text" name="vehicle_${vehicleId}_part_${p}_number" placeholder="e.g. 41110-60280"></div>
        <div class="az-field"><label>Condition preference</label><select name="vehicle_${vehicleId}_part_${p}_condition"><option value="">No preference</option><option>New OEM</option><option>New Aftermarket</option><option>Used / Reconditioned</option></select></div>
      </div>
      <div class="az-field-row">
        <div class="az-field"><label>Budget (KSh)</label><input type="text" name="vehicle_${vehicleId}_part_${p}_budget" placeholder="e.g. 45,000 – 60,000"></div>
        <div class="az-field"><label>Urgency</label><select name="vehicle_${vehicleId}_part_${p}_urgency"><option value="">Select</option><option>Urgent — ASAP</option><option>Within 1 week</option><option>Within 2 weeks</option><option>No rush</option></select></div>
      </div>
      <div class="az-field"><label>Additional notes</label><textarea name="vehicle_${vehicleId}_part_${p}_notes" rows="2" placeholder="Any other details that might help us source the right part"></textarea></div>
      <div class="az-upload-zone" onclick="document.getElementById('file-input-${vehicleId}-${p}').click()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <span>Attach reference images <em>(optional, JPG/PNG)</em></span>
        <input type="file" id="file-input-${vehicleId}-${p}" accept="image/*" multiple style="display:none" onchange="handleImageUpload(${vehicleId}, ${p}, this)">
      </div>
      <div class="image-preview-row" id="preview-${vehicleId}-${p}"></div>
    </div>`;
  }
  return partsHtml;
}

function renderVehicles() {
  const container = document.getElementById('vehicles-container');
  if (!container) return;
  let html = '';
  for (let v = 1; v <= vehicleCount; v++) {
    html += `<div class="az-vehicle-block" data-vehicle="${v}">
      <div class="az-vehicle-header" onclick="toggleVehicle(${v})">
        <span class="az-vehicle-title">Vehicle ${v}</span>
        ${v > 1 ? `<button type="button" class="az-remove-vehicle" onclick="event.stopPropagation(); removeVehicle(${v})">Remove</button>` : ''}
      </div>
      <div class="az-vehicle-body" id="vehicle-content-${v}">
        <div class="az-field-row">
          <div class="az-field"><label>Make <span class="req">*</span></label><input type="text" name="vehicle_${v}_make" placeholder="e.g. Toyota" required></div>
          <div class="az-field"><label>Model <span class="req">*</span></label><input type="text" name="vehicle_${v}_model" placeholder="e.g. Land Cruiser" required></div>
        </div>
        <div class="az-field-row">
          <div class="az-field"><label>Year</label><input type="text" name="vehicle_${v}_year" placeholder="e.g. 2015"></div>
          <div class="az-field"><label>Engine code</label><input type="text" name="vehicle_${v}_engine" placeholder="e.g. 1GR-FE"></div>
        </div>
        <div class="az-field">
          <label>VIN / Chassis number <span class="az-field-hint">(required — helps us match the correct part)</span></label>
          <input type="text" name="vehicle_${v}_vin" placeholder="e.g. JTMBD31V385112345" required>
        </div>
        <div class="az-parts-label">Parts needed for this vehicle</div>
        <div id="parts-${v}">${renderParts(v)}</div>
        <button type="button" class="az-btn-add-part" onclick="addPart(${v})">+ Add another part</button>
      </div>
    </div>`;
  }
  container.innerHTML = html;
  const firstContent = document.getElementById('vehicle-content-1');
  if (firstContent) firstContent.classList.add('open');
  for (let v = 1; v <= vehicleCount; v++) {
    for (let p = 1; p <= partCounters[v]; p++) {
      renderImagePreview(v, p);
    }
  }
}

function toggleVehicle(vehicleId) {
  const content = document.getElementById(`vehicle-content-${vehicleId}`);
  if (content) content.classList.toggle('open');
}

// ── Refund Method Field Toggling ───────────────────────────────
function toggleRefundFields(value) {
  const mpesaFields = document.getElementById('mpesa-fields');
  const bankFields = document.getElementById('bank-fields');
  if (mpesaFields) mpesaFields.style.display = value === 'mpesa' ? 'block' : 'none';
  if (bankFields) bankFields.style.display = value === 'bank' ? 'block' : 'none';
  
  ['mpesa_number', 'mpesa_name'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.required = (value === 'mpesa');
  });
  ['bank_name', 'account_name', 'account_number'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.required = (value === 'bank');
  });
}

// ── Form Initialization ────────────────────────────────────────
function initPreorderForm() {
  const form = document.getElementById('preorder-form');
  if (!form) return;
  
  renderVehicles();
  
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = form.querySelector('.submit-btn');
    if (!btn) return;
    
    btn.textContent = 'Sending...';
    btn.disabled = true;
    const formData = new FormData(form);
    for (const [key, files] of Object.entries(partImages)) {
      files.forEach((file, idx) => formData.append(`images_${key}_${idx}`, file));
    }
    try {
      const res = await fetch(form.action, { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const successMsg = document.getElementById('success-msg');
        if (successMsg) successMsg.style.display = 'block';
        form.reset();
        vehicleCount = 1;
        partCounters = {1: 1};
        partImages = {};
        renderVehicles();
        if (typeof goToStep === 'function') goToStep(1);
        setTimeout(() => {
          if (successMsg) successMsg.style.display = 'none';
        }, 6000);
      } else {
        alert('Something went wrong. Please try again or contact us directly.');
      }
    } catch (err) {
      alert('Network error. Please check your connection and try again.');
    } finally {
      btn.textContent = 'Submit Pre-Order →';
      btn.disabled = false;
    }
  });
}

function initRefundForm() {
  const form = document.getElementById('refund-form');
  if (!form) return;
  
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const btn = document.getElementById('submit-btn');
    if (!btn) return;
    
    btn.textContent = 'Submitting…';
    btn.disabled = true;
    const formData = new FormData(form);
    
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        form.style.display = 'none';
        const banner = document.getElementById('success-banner');
        if (banner) {
          banner.style.display = 'block';
          window.scrollTo({ top: banner.offsetTop - 100, behavior: 'smooth' });
        }
      } else {
        btn.textContent = 'Submit Refund Request →';
        btn.disabled = false;
        alert('Something went wrong. Please try again or contact us directly.');
      }
    } catch (err) {
      btn.textContent = 'Submit Refund Request →';
      btn.disabled = false;
      alert('Network error. Please check your connection and try again.');
    }
  });
}

// ── Initialize forms on DOM ready ──────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  initPreorderForm();
  initRefundForm();
});

// ── Make functions globally available for inline onclick ───────
window.copyPaybill = copyPaybill;
window.toggleFaq = toggleFaq;
window.goToStep = goToStep;
window.addVehicle = addVehicle;
window.removeVehicle = removeVehicle;
window.addPart = addPart;
window.removePart = removePart;
window.handleImageUpload = handleImageUpload;
window.deleteImage = deleteImage;
window.toggleVehicle = toggleVehicle;
window.toggleRefundFields = toggleRefundFields;