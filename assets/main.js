const wordsEl = document.querySelector('#words-table tbody'),
      categoryEl = document.getElementById('category'),
      sortByRadios = document.querySelectorAll('[name="sortOptions"]'),
      searchInput = document.getElementById('search'),
      addUserModalEl = document.getElementById('addUser'),
      addUserModal = new bootstrap.Modal(addUserModalEl),
      addUserForm = document.getElementById('modal-user-form'),
      alertModalEl = document.getElementById('alertModal'),
      alertModal = new bootstrap.Modal(alertModalEl),
      deleteWordBtn = document.getElementById('deleteWord'),
      sortByEls = document.querySelectorAll("[name='sortOptions']"),
      addUserErrorMessageEl = document.getElementById('addUserErrorMessage'),
      themeEl = document.getElementById('primaryColor'),
      statsModalEl = document.getElementById('statsModal'),
      statsModal = new bootstrap.Modal(statsModalEl);

addUserModalEl.addEventListener('show.bs.modal', () => {
  addUserErrorMessageEl.style.display = 'none';
});

async function sendRequest(path, options = {}, dataType = 'json') {
  options.headers ??= {};
  options.headers['Content-Type'] = 'application/json';
  options.body && (options.body = JSON.stringify(options.body));
  let response = await fetch(path, options);
  return await response[dataType]();
}

async function getWords(requestOptions) {
  return await sendRequest('/api/words', {
    method: 'POST',
    body: requestOptions
  });
}

window.onload = function () {
  categoryEl.querySelectorAll('.nav-item').forEach(element => {
    element.addEventListener('click', () => selectCategory(element.dataset.category));
  });

  document.getElementById('showStats').onclick = launchStatsModal;

  themeEl.oninput = () => setThemeColor(themeEl.value);

  sortByRadios.forEach(input => {
    input.addEventListener('click', () => loadWords());
  });

  searchInput.addEventListener('input', debounce(() => {
    loadWords(searchInput.value);
  }, 200));

  document.querySelectorAll('[data-role="reset-settings"]').forEach(e => e.addEventListener('click', resetSettings));

  document.querySelectorAll('[name="user"]').forEach(element => {
    element.addEventListener('change', () => {
      setThemeColor();
      loadWords();
    });
  });
  
  settingActions();
  setThemeColor();
  
  addUserForm.onsubmit = function (event) {
    event.preventDefault();
    addUserErrorMessageEl.style.display = 'none';
    let formData = getFormData(addUserForm);
    formData.writer = getSelectedWriter();
    sendRequest(`/api/words/${formData.id || 'add'}`, {
      method: formData.id ? 'PUT' : 'POST',
      body: formData
    }).then(data => {
      if (data.message) {
        addUserErrorMessageEl.textContent = data.message;
        addUserErrorMessageEl.style.display = 'block';
      } else {
        loadWords();
        addUserModal.hide();
      }
    });
  }

  loadWords();
}

window.onbeforeunload = saveActions;

function getFormData(form) {
  let formData = new FormData(form);
  let body = {};
  for (let [key, value] of formData.entries()) {
    body[key] = value;
  }
  return body;
}

function loadWords(query = searchInput.value) {
  wordsEl.innerHTML = 'Loading...';
  getWords({
    category: getSelectedCategory(),
    sortBy: getSelectedSortBy(),
    searchQuery: query,
    writer: getSelectedWriter()
  }).then(words => {
    wordsEl.innerHTML = '';
    words.length > 0 ? words.forEach(word => wordsEl.insertAdjacentHTML('beforeend', createWordEl(word, query))) : (wordsEl.innerHTML = '<h5 class="mt-1">No data found.</h5>');
    document.querySelectorAll('[data-speak]').forEach(el => el.addEventListener('click', () => speech(el.dataset.speak)));
    wordsEl.querySelectorAll('[data-id]').forEach(wordEl => {
      wordEl.addEventListener('dblclick', () => {
        let wordData = words.find(w => w.id == wordEl.dataset.id);
        wordData && launchModal(wordData.word, wordData.word_translate, wordData.id);
      });
    });
  });
}

function launchModal(word = '', word_translate = '', id = null) {
  if (id !== null) {
    deleteWordBtn.style.display = 'block';
    deleteWordBtn.onclick = function () {
      launchAlertModal('Are you sure to delete this word?', () => {
        sendRequest(`/api/words/${id}`, { method: 'DELETE' }).then(() => loadWords());
      });
    }
  } else {
    deleteWordBtn.style.display = 'none';
  }

  // ------------------------------------------------------------------------
  addUserModalEl.querySelector(`[name="id"]`).value = id !== null ? id : '';
  addUserModalEl.querySelectorAll('[name="category"]').forEach(el => el.checked = false);
  addUserModalEl.querySelector('[name="word"]').value = word;
  addUserModalEl.querySelector('[name="word_translate"]').value = word_translate;
  
  // ------------------------------------------------------------------------
  document.getElementById(getSelectedCategory()).checked = true;

  // ------------------------------------------------------------------------
  addUserModal.show();
}

function launchAlertModal(title, onAcceptCallback) {
  alertModal.show();

  // ------------------------------------------------------------------------
  document.getElementById('yes-btn').onclick = onAcceptCallback;
  document.getElementById('modal-title').textContent = title;
}

function createWordEl(data, query) {
  let wordHTML = `<tr class="border-bottom p-2" data-id="${data.id}">
    <td class="py-3 w-50">
      <i class="fa-solid fa-volume-high" data-speak="${data.word}"></i>
      <small class="ms-1">&nbsp;</small>
      <span>${query ? data.word.replace(new RegExp(query, 'gi'), a => `<mark>${a}</mark>`) : data.word}</span>
    </td>
    <td class="w-50" data-word="true" dir="rtl">${query ? data.word_translate.replace(new RegExp(query, 'gi'), a => `<mark>${a}</mark>`) : data.word_translate}</td>
  </tr>`;

  return wordHTML;
}

function getSelectedCategory() {
  return categoryEl.querySelector('span.nav-link.active')?.parentElement.dataset.category;
}

function selectCategory(category, reloadWords = true) {
  categoryEl.querySelectorAll('span.nav-link').forEach(element => {
    element.classList.remove('active');
    element.parentElement.dataset.category.toLowerCase() === category.toLowerCase() && element.classList.add('active');
  });

  reloadWords && loadWords();
}

function getSelectedSortBy() {
  return document.querySelector('[name="sortOptions"]:checked').value;
}

function getSelectedWriter() {
  return document.querySelector('[name="user"]:checked')?.value;
}

function selectWriter(userwriter = getSelectedWriter()) {
  document.querySelectorAll('[name="user"]').forEach((rad, index) => {
    if (!userwriter && index === 0) {
      rad.checked = true;
    } else {
      rad.value === userwriter ? (rad.checked = true) : (rad.checked = false);
    }
  });
}

function debounce(func, delay) {
  let debounceTimer;
  return function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(func, delay);
  }
}

function speech(word, lang = 'en-US') {
  let speechSyn = new SpeechSynthesisUtterance(word);
  speechSyn.lang = lang;
  speechSyn.rate = 1;
  speechSyn.pitch = 1;
  speechSyn.volume = 1;
  speechSynthesis.speak(speechSyn);
}

function saveActions() { 
  localStorage.setItem('actions', JSON.stringify({
    category: getSelectedCategory(),
    sortBy: getSelectedSortBy(),
    writer: getSelectedWriter()
  }));
}

function settingActions() {
  let actions = JSON.parse(localStorage.actions || '{}');
  actions.category && selectCategory(actions.category);
  actions.sortBy   && selectSortBy(actions.sortBy);
  selectWriter(actions.writer);
}

function selectSortBy(sortBy = getSelectedSortBy()) {
  sortByEls.forEach(el => {
    el.checked = el.value === sortBy;
  });
}

function resetSettings() {
  launchAlertModal('Are you sure to Reset Your settings?', () => {
    window.onbeforeunload = () => {};
    localStorage.clear();
    location.reload();
  });
}

function setThemeColor(themeColor = null) {
  themeColor && localStorage.setItem('themeColor-' + getSelectedWriter(), themeColor);

  let themeData = getThemeData();
  
  for (let [key, value] of Object.entries(themeData)) {
    document.documentElement.style.setProperty('--' + key, value);
  }

  themeEl.value = themeData["theme-color"];
}

function getThemeData() {
  let themeColor = localStorage[`themeColor-${getSelectedWriter()}`];
  themeColor = themeColor ? themeColor : document.querySelector('[name="user"]:checked').dataset.color;
  return {
    'theme-color': themeColor,
    'text-color': getMaterialColor(themeColor)
  };
}

// ? get darkness of the hex color
function getDarkness(hex) {
  let rgb = hexToRgb(hex);
  return (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) / 255;
}

function hexToRgb(hex) {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getMaterialColor(hex) {
  let darkness = getDarkness(hex);
  if (darkness < 0.5) {
    return '#ffffff';
  } else {
    return '#000000';
  }
}

async function launchStatsModal() {
  let wordsList = await getWords({ writer: getSelectedWriter() });
  document.getElementById('stats-writer').textContent = 'User: ' + getSelectedWriter();
  statsModalEl.querySelectorAll('[data-stats]').forEach(el => {
    el.textContent = wordsList.filter(w => w.category === el.dataset.stats).length;
  });
  statsModal.show();
}