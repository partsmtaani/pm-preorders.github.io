/* site.js — PartsMtaani shared scripts */

(function() {

  // ── Hamburger nav with X toggle ─────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    const hamburger = document.getElementById('nav-hamburger');
    const navLinks = document.querySelector('.nav-links');
    const hamburgerIcon = document.querySelector('.hamburger-icon');
    const closeIcon = document.querySelector('.close-icon');

    if (hamburger && navLinks) {
      hamburger.addEventListener('click', function () {
        navLinks.classList.toggle('open');
        const isOpen = navLinks.classList.contains('open');
        if (hamburgerIcon) hamburgerIcon.style.display = isOpen ? 'none' : 'block';
        if (closeIcon) closeIcon.style.display = isOpen ? 'block' : 'none';
      });
      document.addEventListener('click', function (e) {
        if (!navLinks.contains(e.target) && !hamburger.contains(e.target) && navLinks.classList.contains('open')) {
          navLinks.classList.remove('open');
          if (hamburgerIcon) hamburgerIcon.style.display = 'block';
          if (closeIcon) closeIcon.style.display = 'none';
        }
      });
    }

    // ── TOC active state ─────────────────────────────────────
    const tocLinks = document.querySelectorAll('.doc-nav ul li a, .prose-toc ul li a');
    if (tocLinks.length > 0) {
      const sections = Array.from(document.querySelectorAll('[id]')).filter(el =>
        el.id.match(/^(p|s)\d+$/) || el.closest('.doc-section') || el.closest('.prose-section')
      );
      function setActive() {
        let current = '';
        sections.forEach(section => {
          if (window.scrollY >= section.offsetTop - 120) current = section.id;
        });
        tocLinks.forEach(link => {
          const li = link.closest('li');
          if (li) {
            li.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) li.classList.add('active');
          }
        });
      }
      window.addEventListener('scroll', setActive, { passive: true });
      setActive();
    }

    // ── Smooth scroll ────────────────────────────────────────
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

  // ── Copy Paybill ───────────────────────────────────────────
  window.copyPaybill = function() {
    const paybill = '4048209';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(paybill).then(showCopySuccess).catch(() => fallbackCopy(paybill));
    } else {
      fallbackCopy(paybill);
    }
  };

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
    if (row) { row.style.background = '#edfaf4'; row.style.borderColor = '#a3e8cc'; }
    setTimeout(() => {
      if (copyIcon) copyIcon.style.display = 'block';
      if (checkIcon) checkIcon.style.display = 'none';
      if (toast) toast.style.display = 'none';
      if (row) { row.style.background = ''; row.style.borderColor = ''; }
    }, 2200);
  }

  // ── FAQ Accordion ──────────────────────────────────────────
  window.toggleFaq = function(btn) {
    const item = btn.closest('.faq-item');
    if (!item) return;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  };

  // ── Field Validation ──────────────────────────────────────
  function validateField(id) {
    const input = document.getElementById(id);
    const errorEl = document.querySelector(`.field-error[data-for="${id}"]`);
    if (!input) return true;
    let isValid = true;
    let message = '';
    const val = input.value.trim();

    if (input.hasAttribute('required') && val === '') {
      isValid = false;
      const label = input.closest('.field')?.querySelector('label')?.textContent.replace('*','').trim() || 'This field';
      message = `${label} is required.`;
    } else if (input.type === 'email' && val && !/^\S+@\S+\.\S+$/.test(val)) {
      isValid = false;
      message = 'Please enter a valid email address (e.g., name@example.com).';
    } else if (input.dataset.validate === 'phone' && val && !/^[0-9+\-\s]{9,}$/.test(val)) {
      isValid = false;
      message = 'Enter a valid phone number (at least 9 digits).';
    }

    input.classList.toggle('error', !isValid);
    if (errorEl) errorEl.textContent = message;
    return isValid;
  }

  document.addEventListener('input', function(e) {
    if (e.target.matches('input, select, textarea')) validateField(e.target.id);
  });


  // ══════════════════════════════════════════════════════════
  //  AUTO-SAVE HELPERS
  //  Keys: pm_draft_preorder / pm_draft_refund
  // ══════════════════════════════════════════════════════════
  var PREORDER_KEY = 'pm_draft_preorder';
  var REFUND_KEY   = 'pm_draft_refund';

  function loadDraft(key) {
    try { return JSON.parse(localStorage.getItem(key)) || {}; }
    catch(e) { return {}; }
  }

  function saveDraft(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); }
    catch(e) { /* storage full — fail silently */ }
  }

  function clearDraft(key) {
    try { localStorage.removeItem(key); }
    catch(e) {}
  }

  // Collect all named field values from a form into a flat object
  function collectFields(form) {
    var data = {};
    form.querySelectorAll('input:not([type=file]):not([type=hidden]), select, textarea').forEach(function(el) {
      if (el.name) data[el.name] = el.value;
    });
    return data;
  }

  // Write saved values back into rendered fields
  function restoreFields(form, savedFields) {
    if (!savedFields) return;
    Object.keys(savedFields).forEach(function(name) {
      var el = form.querySelector('[name="' + name + '"]');
      if (el && el.type !== 'file') el.value = savedFields[name];
    });
  }

  function debounce(fn, ms) {
    var t;
    return function() {
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function() { fn.apply(null, args); }, ms);
    };
  }


  // ══════════════════════════════════════════════════════════
  //  MULTI-VEHICLE ORDER FORM
  // ══════════════════════════════════════════════════════════
  var vehicleCount = 1;
  var partCounters = {1: 1};
  var partImages = {};

  window.goToStep = function(step) {
    var step1 = document.getElementById('step-1');
    var step2 = document.getElementById('step-2');
    if (!step1 || !step2) return;

    if (step === 1) {
      step1.style.display = 'block';
      step2.style.display = 'none';
    } else {
      var fields = ['full_name', 'phone', 'email', 'location'];
      var allValid = true;
      fields.forEach(function(id) { if (!validateField(id)) allValid = false; });
      if (!allValid) return;
      step1.style.display = 'none';
      step2.style.display = 'block';
    }
    var orderSection = document.getElementById('order-form');
    if (orderSection) orderSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  window.addVehicle = function() {
    var form = document.getElementById('preorder-form');
    if (form) savePreorderDraft(form);
    vehicleCount++;
    partCounters[vehicleCount] = 1;
    renderVehicles();
    if (form) restorePreorderFields(form);
    var newContent = document.getElementById('vehicle-content-' + vehicleCount);
    if (newContent) newContent.classList.add('open');
  };

  window.removeVehicle = function(vehicleId) {
    if (vehicleCount <= 1) return;
    var form = document.getElementById('preorder-form');
    if (form) savePreorderDraft(form);

    // Renumber partCounters and partImages, dropping the removed vehicle
    var newPartCounters = {};
    var newImages = {};
    var newIdx = 1;
    for (var v = 1; v <= vehicleCount; v++) {
      if (v === vehicleId) continue;
      newPartCounters[newIdx] = partCounters[v] || 1;
      for (var p = 1; p <= (partCounters[v] || 1); p++) {
        var oldKey = v + '_' + p;
        if (partImages[oldKey]) newImages[newIdx + '_' + p] = partImages[oldKey];
      }
      newIdx++;
    }
    partCounters = newPartCounters;
    partImages = newImages;
    vehicleCount--;

    // Renumber field names in saved draft
    var draft = loadDraft(PREORDER_KEY);
    var fields = draft.fields || {};
    var renum = {};
    Object.keys(fields).forEach(function(name) {
      var match = name.match(/^vehicle_(\d+)_(.+)$/);
      if (!match) { renum[name] = fields[name]; return; }
      var vNum = parseInt(match[1]);
      if (vNum === vehicleId) return; // drop
      var newV = vNum < vehicleId ? vNum : vNum - 1;
      renum['vehicle_' + newV + '_' + match[2]] = fields[name];
    });
    draft.fields = renum;
    draft.vehicleCount = vehicleCount;
    draft.partCounters = partCounters;
    saveDraft(PREORDER_KEY, draft);

    renderVehicles();
    if (form) restorePreorderFields(form);
  };

  window.addPart = function(vehicleId) {
    var form = document.getElementById('preorder-form');
    if (form) savePreorderDraft(form);
    partCounters[vehicleId]++;
    renderVehicles();
    if (form) restorePreorderFields(form);
    var content = document.getElementById('vehicle-content-' + vehicleId);
    if (content) content.classList.add('open');
  };

  window.removePart = function(vehicleId, partIdx) {
    var removedP = partIdx + 1;
    var form = document.getElementById('preorder-form');
    if (form) savePreorderDraft(form);

    delete partImages[vehicleId + '_' + removedP];

    if (partCounters[vehicleId] > 1) {
      var draft = loadDraft(PREORDER_KEY);
      var fields = draft.fields || {};
      var renum = {};
      var partRe = new RegExp('^vehicle_' + vehicleId + '_part_(\\d+)_(.+)$');
      Object.keys(fields).forEach(function(name) {
        var match = name.match(partRe);
        if (!match) { renum[name] = fields[name]; return; }
        var pNum = parseInt(match[1]);
        if (pNum === removedP) return; // drop
        var newP = pNum < removedP ? pNum : pNum - 1;
        renum['vehicle_' + vehicleId + '_part_' + newP + '_' + match[2]] = fields[name];
      });
      partCounters[vehicleId]--;

      // Renumber partImages for this vehicle
      var newImages = {};
      for (var p = 1; p <= partCounters[vehicleId] + 1; p++) {
        if (p === removedP) continue;
        var newP2 = p < removedP ? p : p - 1;
        var imgKey = vehicleId + '_' + p;
        if (partImages[imgKey]) newImages[vehicleId + '_' + newP2] = partImages[imgKey];
      }
      // Merge back (only update keys for this vehicle)
      Object.keys(partImages).forEach(function(k) {
        if (!k.startsWith(vehicleId + '_')) newImages[k] = partImages[k];
      });
      partImages = newImages;

      draft.fields = renum;
      draft.partCounters = partCounters;
      saveDraft(PREORDER_KEY, draft);
    }

    renderVehicles();
    if (form) restorePreorderFields(form);
    var content = document.getElementById('vehicle-content-' + vehicleId);
    if (content) content.classList.add('open');
  };

  window.handleImageUpload = function(vehicleId, partId, input) {
    var files = Array.from(input.files);
    var key = vehicleId + '_' + partId;
    if (!partImages[key]) partImages[key] = [];
    partImages[key] = partImages[key].concat(files);
    renderImagePreview(vehicleId, partId);
    input.value = '';
  };

  window.deleteImage = function(vehicleId, partId, imgIndex) {
    var key = vehicleId + '_' + partId;
    if (partImages[key]) {
      partImages[key].splice(imgIndex, 1);
      if (partImages[key].length === 0) delete partImages[key];
      renderImagePreview(vehicleId, partId);
    }
  };

  function renderImagePreview(vehicleId, partId) {
    var container = document.getElementById('preview-' + vehicleId + '-' + partId);
    if (!container) return;
    var key = vehicleId + '_' + partId;
    var images = partImages[key] || [];
    container.innerHTML = '';
    images.forEach(function(file, idx) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var div = document.createElement('div');
        div.className = 'preview-img';
        div.innerHTML = '<img src="' + e.target.result + '" alt="part image"><button type="button" class="delete-img" onclick="deleteImage(' + vehicleId + ', ' + partId + ', ' + idx + ')">&times;</button>';
        container.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
  }

  // ── Live title updates ───────────────────────────────────

  function updateVehicleTitle(vehicleId) {
    var make  = (document.querySelector('[name="vehicle_' + vehicleId + '_make"]')?.value  || '').trim();
    var model = (document.querySelector('[name="vehicle_' + vehicleId + '_model"]')?.value || '').trim();
    var year  = (document.querySelector('[name="vehicle_' + vehicleId + '_year"]')?.value  || '').trim();
    var titleEl = document.querySelector('.vehicle-card[data-vehicle="' + vehicleId + '"] .vehicle-title');
    if (!titleEl) return;
    var parts = [make, model, year].filter(Boolean);
    titleEl.textContent = parts.length ? parts.join(' · ') : 'Vehicle ' + vehicleId;
  }

  function updatePartTitle(vehicleId, partId) {
    var nameEl = document.querySelector('[name="vehicle_' + vehicleId + '_part_' + partId + '_name"]');
    var name = nameEl ? nameEl.value.trim() : '';
    var titleEl = document.querySelector('#part-item-' + vehicleId + '-' + partId + ' .part-title');
    if (!titleEl) return;
    titleEl.textContent = name || 'Part ' + partId;
  }

  function renderParts(vehicleId) {
    var partsHtml = '';
    for (var p = 1; p <= partCounters[vehicleId]; p++) {
      partsHtml += '<div class="part-item" id="part-item-' + vehicleId + '-' + p + '">' +
        '<div class="part-header">' +
          '<span class="part-title">Part ' + p + '</span>' +
          (partCounters[vehicleId] > 1 ? '<button type="button" class="remove-part" onclick="removePart(' + vehicleId + ', ' + (p-1) + ')">Remove</button>' : '') +
        '</div>' +
        '<div class="field"><label>Part Name / Description <span class="req">*</span></label><input type="text" name="vehicle_' + vehicleId + '_part_' + p + '_name" placeholder="e.g., Front Differential Assembly" required></div>' +
        '<div class="field-2">' +
          '<div class="field"><label>OEM Part Number</label><input type="text" name="vehicle_' + vehicleId + '_part_' + p + '_number" placeholder="e.g., 41110-60280"></div>' +
          '<div class="field"><label>Condition</label><select name="vehicle_' + vehicleId + '_part_' + p + '_condition"><option value="">Any</option><option>New OEM</option><option>New Aftermarket</option><option>Refurbished</option></select></div>' +
        '</div>' +
        '<div class="field-2">' +
          '<div class="field"><label>Budget (KSh)</label><input type="text" name="vehicle_' + vehicleId + '_part_' + p + '_budget" placeholder="e.g., 45000-60000"></div>' +
          '<div class="field"><label>Urgency</label><select name="vehicle_' + vehicleId + '_part_' + p + '_urgency"><option value="">Select</option><option>Urgent (ASAP)</option><option>Within 1 week</option><option>Within 2 weeks</option><option>No rush</option></select></div>' +
        '</div>' +
        '<div class="field"><label>Notes / Reference</label><textarea name="vehicle_' + vehicleId + '_part_' + p + '_notes" rows="2" placeholder="Any additional details..."></textarea></div>' +
        '<div class="part-images">' +
          '<div class="image-upload-zone" onclick="document.getElementById(\'file-input-' + vehicleId + '-' + p + '\').click()">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"/></svg>' +
            '<p><strong>Upload reference images</strong> (JPG/PNG)</p>' +
            '<input type="file" id="file-input-' + vehicleId + '-' + p + '" accept="image/*" multiple style="display:none" onchange="handleImageUpload(' + vehicleId + ', ' + p + ', this)">' +
          '</div>' +
          '<div class="image-preview-row" id="preview-' + vehicleId + '-' + p + '"></div>' +
        '</div>' +
      '</div>';
    }
    return partsHtml;
  }

  function renderVehicles() {
    var container = document.getElementById('vehicles-container');
    if (!container) return;
    var html = '';
    for (var v = 1; v <= vehicleCount; v++) {
      html += '<div class="vehicle-card" data-vehicle="' + v + '">' +
        '<div class="vehicle-header" onclick="toggleVehicle(' + v + ')">' +
          '<div><span class="vehicle-title">Vehicle ' + v + '</span></div>' +
          (v > 1 ? '<button type="button" class="remove-vehicle" onclick="event.stopPropagation(); removeVehicle(' + v + ')">Remove</button>' : '') +
        '</div>' +
        '<div class="vehicle-content" id="vehicle-content-' + v + '">' +
          '<div class="field-2">' +
            '<div class="field"><label>Make <span class="req">*</span></label><input type="text" name="vehicle_' + v + '_make" placeholder="e.g., Toyota" required></div>' +
            '<div class="field"><label>Model <span class="req">*</span></label><input type="text" name="vehicle_' + v + '_model" placeholder="e.g., Land Cruiser" required></div>' +
          '</div>' +
          '<div class="field-2">' +
            '<div class="field"><label>Year</label><input type="text" name="vehicle_' + v + '_year" placeholder="e.g., 2015"></div>' +
            '<div class="field"><label>Engine Code</label><input type="text" name="vehicle_' + v + '_engine" placeholder="e.g., 1GR-FE"></div>' +
          '</div>' +
          '<div class="field"><label>VIN / Chassis (optional)</label><input type="text" name="vehicle_' + v + '_vin" placeholder="Helps with accurate matching"></div>' +
          '<div class="parts-sub-header">Parts needed</div>' +
          '<div id="parts-' + v + '">' + renderParts(v) + '</div>' +
          '<button type="button" class="add-btn" onclick="addPart(' + v + ')">+ Add another part</button>' +
        '</div>' +
      '</div>';
    }
    container.innerHTML = html;
    var firstContent = document.getElementById('vehicle-content-1');
    if (firstContent) firstContent.classList.add('open');
    for (var v2 = 1; v2 <= vehicleCount; v2++) {
      for (var p2 = 1; p2 <= partCounters[v2]; p2++) {
        renderImagePreview(v2, p2);
      }
    }
  }

  window.toggleVehicle = function(vehicleId) {
    var content = document.getElementById('vehicle-content-' + vehicleId);
    if (content) content.classList.toggle('open');
  };

  // ── Preorder draft save / restore ───────────────────────

  function savePreorderDraft(form) {
    saveDraft(PREORDER_KEY, {
      vehicleCount: vehicleCount,
      partCounters: Object.assign({}, partCounters),
      fields: collectFields(form)
    });
  }

  function restorePreorderFields(form) {
    var draft = loadDraft(PREORDER_KEY);
    if (!draft || !draft.fields) return;
    restoreFields(form, draft.fields);
    // Sync live titles after values are back in the DOM
    for (var v = 1; v <= vehicleCount; v++) {
      updateVehicleTitle(v);
      for (var p = 1; p <= (partCounters[v] || 1); p++) {
        updatePartTitle(v, p);
      }
    }
  }

  // ── Preorder form init ───────────────────────────────────

  function initPreorderForm() {
    var form = document.getElementById('preorder-form');
    if (!form) return;

    // Restore vehicle/part structure from draft before rendering
    var draft = loadDraft(PREORDER_KEY);
    if (draft && draft.vehicleCount) {
      vehicleCount = draft.vehicleCount;
      partCounters = draft.partCounters || { 1: 1 };
    }

    renderVehicles();
    restorePreorderFields(form);

    var debouncedSave = debounce(function() { savePreorderDraft(form); }, 400);

    form.addEventListener('input', function(e) {
      debouncedSave();

      var name = e.target.name || '';

      // Vehicle title: watch make / model / year
      var vmatch = name.match(/^vehicle_(\d+)_(make|model|year)$/);
      if (vmatch) updateVehicleTitle(parseInt(vmatch[1]));

      // Part title: watch part name field
      var pmatch = name.match(/^vehicle_(\d+)_part_(\d+)_name$/);
      if (pmatch) updatePartTitle(parseInt(pmatch[1]), parseInt(pmatch[2]));
    });

    form.addEventListener('change', debouncedSave);

    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      var step2 = document.getElementById('step-2');
      if (step2 && step2.style.display !== 'block') { goToStep(2); return; }

      var inputs = form.querySelectorAll('input:not([type=file]), select, textarea');
      var allValid = true;
      inputs.forEach(function(inp) {
        if (inp.closest('.step-container') && inp.closest('.step-container').style.display !== 'none') {
          if (!validateField(inp.id)) allValid = false;
        }
      });
      if (!allValid) return;

      var btn = form.querySelector('.submit-btn');
      btn.textContent = 'Sending...';
      btn.disabled = true;

      var formData = new FormData(form);
      Object.keys(partImages).forEach(function(key) {
        partImages[key].forEach(function(file, idx) {
          formData.append('images_' + key + '_' + idx, file);
        });
      });

      try {
        var res = await fetch(form.action, { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          clearDraft(PREORDER_KEY);
          var successMsg = document.getElementById('success-msg');
          if (successMsg) successMsg.style.display = 'block';
          form.reset();
          vehicleCount = 1;
          partCounters = { 1: 1 };
          partImages = {};
          renderVehicles();
          goToStep(1);
          setTimeout(function() { if (successMsg) successMsg.style.display = 'none'; }, 6000);
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

  // ── Refund form init ─────────────────────────────────────

  function initRefundForm() {
    var form = document.getElementById('refund-form');
    if (!form) return;

    // Restore saved values on load
    var draft = loadDraft(REFUND_KEY);
    if (draft && draft.fields) restoreFields(form, draft.fields);

    var debouncedSave = debounce(function() {
      saveDraft(REFUND_KEY, { fields: collectFields(form) });
    }, 400);

    form.addEventListener('input', debouncedSave);
    form.addEventListener('change', debouncedSave);

    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      var btn = document.getElementById('submit-btn');
      btn.textContent = 'Submitting…';
      btn.disabled = true;

      var formData = new FormData(form);
      try {
        var res = await fetch(form.action, { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          clearDraft(REFUND_KEY);
          form.style.display = 'none';
          var banner = document.getElementById('refund-success');
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

  window.toggleRefundFields = function(value) {
    var mpesaFields = document.getElementById('mpesa-fields');
    var bankFields = document.getElementById('bank-fields');
    if (mpesaFields) mpesaFields.style.display = value === 'mpesa' ? 'block' : 'none';
    if (bankFields) bankFields.style.display = value === 'bank' ? 'block' : 'none';
    ['mpesa_number', 'mpesa_name'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.required = (value === 'mpesa');
    });
    ['bank_name', 'account_name', 'account_number'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.required = (value === 'bank');
    });
  };

  document.addEventListener('DOMContentLoaded', function() {
    initPreorderForm();
    initRefundForm();
  });

})();