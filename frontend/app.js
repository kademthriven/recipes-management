const API_BASE = '/api';
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=900&q=80';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const state = {
  token: localStorage.getItem('recipe_token') || '',
  user: JSON.parse(localStorage.getItem('recipe_user') || 'null'),
  editingRecipeId: null,
  editingCollectionId: null,
  collections: [],
  recipeOptions: {
    categories: [],
    difficulty_levels: [],
    dietary_preferences: [],
  },
};

const els = {
  authScreen: document.querySelector('#authScreen'),
  appShell: document.querySelector('#appShell'),
  sessionLabel: document.querySelector('#sessionLabel'),
  status: document.querySelector('#status'),
  authStatus: document.querySelector('#authStatus'),
  toastStack: document.querySelector('#toastStack'),
  loginMessage: document.querySelector('#loginMessage'),
  registerMessage: document.querySelector('#registerMessage'),
  confirmDialog: document.querySelector('#confirmDialog'),
  confirmTitle: document.querySelector('#confirmTitle'),
  confirmMessage: document.querySelector('#confirmMessage'),
  confirmCancelBtn: document.querySelector('#confirmCancelBtn'),
  confirmOkBtn: document.querySelector('#confirmOkBtn'),
  viewTitle: document.querySelector('#viewTitle'),
  logoutBtn: document.querySelector('#logoutBtn'),
  recipeFormTitle: document.querySelector('#recipeFormTitle'),
  recipeSubmitBtn: document.querySelector('#recipeSubmitBtn'),
  cancelRecipeEditBtn: document.querySelector('#cancelRecipeEditBtn'),
  collectionSubmitBtn: document.querySelector('#collectionSubmitBtn'),
  cancelCollectionEditBtn: document.querySelector('#cancelCollectionEditBtn'),
  recipeDetail: document.querySelector('#recipeDetail'),
  recipeGrid: document.querySelector('#recipeGrid'),
  searchCategorySelect: document.querySelector('#searchCategorySelect'),
  searchDifficultySelect: document.querySelector('#searchDifficultySelect'),
  recipeCategorySelect: document.querySelector('#recipeCategorySelect'),
  recipeDifficultySelect: document.querySelector('#recipeDifficultySelect'),
  myRecipesList: document.querySelector('#myRecipesList'),
  favoritesList: document.querySelector('#favoritesList'),
  collectionsList: document.querySelector('#collectionsList'),
  collectionRecipesList: document.querySelector('#collectionRecipesList'),
  profileDetails: document.querySelector('#profileDetails'),
  userSearchResults: document.querySelector('#userSearchResults'),
  activityFeed: document.querySelector('#activityFeed'),
  adminStats: document.querySelector('#adminStats'),
  adminUsersList: document.querySelector('#adminUsersList'),
  adminRecipesList: document.querySelector('#adminRecipesList'),
};

let toastTimerId = 0;

const titles = {
  discover: 'Discover recipes',
  create: 'Create recipe',
  favorites: 'Favorites and collections',
  profile: 'Profile',
  social: 'Social',
  admin: 'Admin dashboard',
};

function statusType(message) {
  const text = String(message || '').toLowerCase();

  if (/(error|failed|invalid|denied|required|banned|not found|cannot|choose|permission|already|expired)/.test(text)) {
    return 'error';
  }

  if (/(deleted|removed|banned|unpublished)/.test(text)) {
    return 'warning';
  }

  if (/(created|saved|updated|uploaded|added|submitted|loaded|logged|approved|published|following|unbanned)/.test(text)) {
    return 'success';
  }

  return 'info';
}

function shouldShowStatus(message, type) {
  if (type === 'error' || type === 'warning') return true;

  const text = String(message || '').toLowerCase();
  const actionPattern = /(created|saved|updated|uploaded|added to favorite|added to collection|submitted|deleted|removed|approved|published|unpublished|banned|unbanned|logged in|logged out|password changed)/;
  const passivePattern = /(loaded|opened|ready|refresh|cancelled|no .* found|no .* yet|login to open|create an account|viewing as guest)/;

  return actionPattern.test(text) && !passivePattern.test(text);
}

function clearStatus() {
  [els.status, els.authStatus].forEach(target => {
    if (!target) return;
    target.textContent = '';
    target.classList.add('hidden');
    delete target.dataset.type;
  });
}

function clearAuthMessages() {
  [els.loginMessage, els.registerMessage].forEach(target => {
    if (!target) return;
    target.textContent = '';
    target.classList.add('hidden');
    delete target.dataset.type;
  });
}

function setFormMessage(target, message, type = statusType(message)) {
  if (!target) return;

  target.textContent = message;
  target.dataset.type = type;
  target.classList.remove('hidden');
}

function showToast(message, type = 'info') {
  if (!message || !els.toastStack) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.dataset.toastId = String(++toastTimerId);
  toast.innerHTML = `
    <strong>${escapeHtml(type === 'error' ? 'Action needed' : type === 'warning' ? 'Updated' : 'Success')}</strong>
    <span>${escapeHtml(message)}</span>
    <button type="button" aria-label="Dismiss message">&times;</button>
  `;

  toast.querySelector('button').addEventListener('click', () => toast.remove());
  els.toastStack.appendChild(toast);
  setTimeout(() => toast.remove(), type === 'error' ? 6500 : 3800);
}

function setStatus(message, type = statusType(message)) {
  if (!shouldShowStatus(message, type)) {
    clearStatus();
    return;
  }

  els.status.textContent = message;
  els.authStatus.textContent = message;
  els.status.dataset.type = type;
  els.authStatus.dataset.type = type;
  els.status.classList.remove('hidden');
  els.authStatus.classList.remove('hidden');
  showToast(message, type);
}

function showConfirm({
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  danger = true,
} = {}) {
  return new Promise(resolve => {
    els.confirmTitle.textContent = title;
    els.confirmMessage.textContent = message;
    els.confirmOkBtn.textContent = confirmText;
    els.confirmOkBtn.className = danger ? 'danger' : 'primary';
    els.confirmDialog.classList.remove('hidden');

    const cleanup = result => {
      els.confirmDialog.classList.add('hidden');
      els.confirmOkBtn.removeEventListener('click', onConfirm);
      els.confirmCancelBtn.removeEventListener('click', onCancel);
      els.confirmDialog.removeEventListener('click', onBackdrop);
      document.removeEventListener('keydown', onKeydown);
      resolve(result);
    };

    const onConfirm = () => cleanup(true);
    const onCancel = () => cleanup(false);
    const onBackdrop = event => {
      if (event.target === els.confirmDialog) cleanup(false);
    };
    const onKeydown = event => {
      if (event.key === 'Escape') cleanup(false);
    };

    els.confirmOkBtn.addEventListener('click', onConfirm);
    els.confirmCancelBtn.addEventListener('click', onCancel);
    els.confirmDialog.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKeydown);
    els.confirmCancelBtn.focus();
  });
}

function fieldLabel(element) {
  const label = element.closest('label');
  const raw = label
    ? Array.from(label.childNodes).find(node => node.nodeType === Node.TEXT_NODE)?.textContent
    : '';

  return raw?.trim() || element.placeholder || element.name || 'This field';
}

function validationMessageFor(element) {
  const label = fieldLabel(element);
  const validity = element.validity;

  if (validity.valueMissing) return `${label} is required`;
  if (validity.typeMismatch) return `Enter a valid ${label.toLowerCase()}`;
  if (validity.tooShort) return `${label} must be at least ${element.minLength} characters`;
  if (validity.rangeUnderflow) return `${label} must be ${element.min} or more`;
  if (validity.rangeOverflow) return `${label} must be ${element.max} or less`;

  return element.validationMessage || `${label} is invalid`;
}

function clearFieldError(element) {
  element.classList.remove('input-error');
  element.removeAttribute('aria-invalid');
  element.closest('label, .inline-form, .form-grid, .auth-card')?.querySelector(`[data-error-for="${element.name}"]`)?.remove();
}

function showFieldError(element, message) {
  clearFieldError(element);
  element.classList.add('input-error');
  element.setAttribute('aria-invalid', 'true');

  const target = element.closest('label') || element.parentElement;
  const error = document.createElement('span');
  error.className = 'field-error-text';
  error.dataset.errorFor = element.name;
  error.textContent = message;
  target.appendChild(error);
}

function validateForm(form) {
  const fields = Array.from(form.elements).filter(element => (
    element instanceof HTMLInputElement
    || element instanceof HTMLTextAreaElement
    || element instanceof HTMLSelectElement
  ));

  let firstInvalid = null;

  fields.forEach(element => {
    clearFieldError(element);

    if (!element.disabled && element.willValidate && !element.checkValidity()) {
      firstInvalid ||= element;
      showFieldError(element, validationMessageFor(element));
    }
  });

  if (form.id === 'registerForm') {
    const password = form.elements.password;
    const confirmPassword = form.elements.confirmPassword;

    if (!firstInvalid && password?.value && confirmPassword?.value && password.value !== confirmPassword.value) {
      firstInvalid = confirmPassword;
      showFieldError(confirmPassword, 'Passwords do not match');
    }
  }

  if (firstInvalid) {
    firstInvalid.focus();
    setStatus('Please complete the highlighted fields', 'error');
    return false;
  }

  return true;
}

function wireFormValidation() {
  document.querySelectorAll('form').forEach(form => {
    form.noValidate = true;
    form.addEventListener('input', event => {
      if (event.target?.matches?.('input, textarea, select')) {
        clearFieldError(event.target);
      }
    });
    form.addEventListener('change', event => {
      if (event.target?.matches?.('input, textarea, select')) {
        clearFieldError(event.target);
      }
    });
  });
}

function authHeaders(extra = {}) {
  return state.token ? { ...extra, Authorization: `Bearer ${state.token}` } : extra;
}

async function api(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = isFormData
    ? authHeaders(options.headers || {})
    : authHeaders({ 'Content-Type': 'application/json', ...(options.headers || {}) });

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok || data.success === false) {
    if (response.status === 403 && data.message === 'This account has been banned') {
      resetStoredSession();
      renderSession();
    }

    throw new Error(data.message || `Request failed: ${response.status}`);
  }

  return data;
}

function saveSession(payload) {
  state.token = payload.token;
  state.user = payload.user;
  localStorage.setItem('recipe_token', state.token);
  localStorage.setItem('recipe_user', JSON.stringify(state.user));
  renderSession();
}

function resetStoredSession() {
  state.token = '';
  state.user = null;
  localStorage.removeItem('recipe_token');
  localStorage.removeItem('recipe_user');
}

function clearSession() {
  resetStoredSession();
  renderSession();
}

function renderSession() {
  const adminNavButton = document.querySelector('.nav-btn[data-view="admin"]');
  const hasAdminSession = state.user?.role === 'admin';

  if (state.user) {
    els.sessionLabel.textContent = `${state.user.username || state.user.email}`;
    els.authScreen.classList.add('hidden');
    els.appShell.classList.remove('hidden');
    adminNavButton?.classList.toggle('hidden', !hasAdminSession);

    if (!hasAdminSession && document.querySelector('#adminView').classList.contains('active')) {
      switchView('discover');
    }
  } else {
    els.sessionLabel.textContent = 'Signed out';
    els.authScreen.classList.remove('hidden');
    els.appShell.classList.add('hidden');
    adminNavButton?.classList.add('hidden');
  }
}

function showGuestRecipeShell() {
  const adminNavButton = document.querySelector('.nav-btn[data-view="admin"]');

  els.sessionLabel.textContent = 'Viewing as guest';
  els.authScreen.classList.add('hidden');
  els.appShell.classList.remove('hidden');
  adminNavButton?.classList.add('hidden');
}

function switchView(view) {
  clearStatus();
  document.querySelectorAll('.view').forEach(section => section.classList.remove('active'));
  document.querySelector(`#${view}View`).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(button => {
    button.classList.toggle('active', button.dataset.view === view);
  });
  els.viewTitle.textContent = titles[view];
}

function switchAuthForm(formName) {
  clearStatus();
  clearAuthMessages();
  document.querySelector('#loginForm').classList.toggle('hidden', formName !== 'login');
  document.querySelector('#registerForm').classList.toggle('hidden', formName !== 'signup');
}

function showLoginAfterRegistration(email) {
  const loginForm = document.querySelector('#loginForm');
  const emailInput = loginForm?.querySelector('input[name="email"]');
  const passwordInput = loginForm?.querySelector('input[name="password"]');

  switchAuthForm('login');

  if (emailInput) emailInput.value = email || '';
  if (passwordInput) passwordInput.value = '';

  loginForm?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => passwordInput?.focus(), 200);
}

function formObject(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  Object.keys(data).forEach(key => {
    if (data[key] === '') delete data[key];
  });
  return data;
}

function minutesToSeconds(form, fieldName) {
  return Number(form.elements[fieldName]?.value || 0) * 60;
}

function setMinuteField(form, fieldName, totalSeconds) {
  const total = Number(totalSeconds || 0);
  const minutes = Math.round(total / 60);

  if (form.elements[fieldName]) form.elements[fieldName].value = minutes || '';
}

function formatDuration(totalSeconds) {
  const total = Number(totalSeconds || 0);
  if (!total) return '';

  return `${Math.round(total / 60)} min`;
}

function foodTypeLabel(value) {
  return value === 'non_veg' ? 'Non-veg' : 'Veg';
}

function foodBadge(value) {
  if (!value) return '';

  const className = value === 'non_veg' ? 'non-veg' : 'veg';
  return `<span class="food-badge ${className}">${escapeHtml(foodTypeLabel(value))}</span>`;
}

function validateImageFile(file) {
  if (!file) return '';

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Upload a JPEG, PNG, GIF, or WebP image';
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return 'Image must be 5MB or smaller';
  }

  if (!file.size) {
    return 'Please choose a valid image file';
  }

  return '';
}

function buildRecipeFormData(form) {
  const data = new FormData(form);
  const prepSeconds = minutesToSeconds(form, 'prep_minutes');
  const cookSeconds = minutesToSeconds(form, 'cook_minutes');
  const featuredImage = form.elements.featured_image?.files?.[0];
  const imageError = validateImageFile(featuredImage);

  if (imageError) {
    showFieldError(form.elements.featured_image, imageError);
    throw new Error(imageError);
  }

  ['prep_minutes', 'cook_minutes'].forEach(key => data.delete(key));

  data.set('preparation_time', String(prepSeconds));
  data.set('cooking_time', String(cookSeconds));
  if (!featuredImage || !featuredImage.size) data.delete('featured_image');

  return data;
}

function buildSearchFilters(form) {
  const filters = formObject(form);
  const maxPrepSeconds = minutesToSeconds(form, 'max_prep_minutes');

  delete filters.max_prep_minutes;

  if (maxPrepSeconds) filters.max_preparation_time = String(maxPrepSeconds);

  return filters;
}

function renderList(target, rows, mapper) {
  target.innerHTML = '';
  if (!rows.length) {
    target.innerHTML = '<div class="list-item"><p>No records yet.</p></div>';
    return;
  }

  rows.forEach(row => {
    const item = document.createElement('article');
    item.className = 'list-item';
    item.innerHTML = mapper(row);
    target.appendChild(item);
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatRecipeText(value) {
  return escapeHtml(value || 'Not provided.').replace(/\r?\n/g, '<br>');
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '';
}

function starsMarkup(value, className = '') {
  const rating = Math.round(Number(value) || 0);

  return `<span class="stars ${className}" aria-label="${rating} out of 5 stars">${
    [1, 2, 3, 4, 5].map(star => `<span class="${star <= rating ? 'filled' : ''}">★</span>`).join('')
  }</span>`;
}

function imageUrl(url) {
  if (!url) return PLACEHOLDER_IMAGE;

  if (url.startsWith('/api/files/s3/') || url.startsWith('/uploads/')) {
    return url;
  }

  try {
    const parsed = new URL(url, window.location.origin);

    if (parsed.hostname.includes('.s3.')) {
      const key = parsed.pathname.replace(/^\/+/, '');
      const encodedKey = key.split('/').map(part => encodeURIComponent(decodeURIComponent(part))).join('/');
      return `/api/files/s3/${encodedKey}`;
    }
  } catch (error) {
    return url;
  }

  return url;
}

function recipeDescription(recipe) {
  return recipe.description || recipe.ingredients || 'Freshly shared recipe';
}

function hideRecipeDetails() {
  els.recipeDetail.classList.add('hidden');
  els.recipeDetail.innerHTML = '';
}

function populateSelect(select, rows, placeholder) {
  if (!select) return;

  const currentValue = select.value;
  select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>`;
  rows.forEach(row => {
    const option = document.createElement('option');
    option.value = row.id;
    option.textContent = row.name;
    select.appendChild(option);
  });
  select.value = currentValue;
}

async function loadRecipeOptions() {
  try {
    const response = await api('/recipes/options');
    state.recipeOptions = response.data || state.recipeOptions;

    populateSelect(els.searchCategorySelect, state.recipeOptions.categories || [], 'All categories');
    populateSelect(els.recipeCategorySelect, state.recipeOptions.categories || [], 'Select category');
    populateSelect(els.searchDifficultySelect, state.recipeOptions.difficulty_levels || [], 'All difficulty levels');
    populateSelect(els.recipeDifficultySelect, state.recipeOptions.difficulty_levels || [], 'Select difficulty');
  } catch (error) {
    setStatus(error.message);
  }
}

function renderRecipeDetails(recipe) {
  const meta = [
    recipe.username ? `By ${recipe.username}` : 'Community recipe',
    recipe.food_type ? foodTypeLabel(recipe.food_type) : '',
    recipe.category_name,
    recipe.difficulty_name,
    recipe.preparation_time ? `${formatDuration(recipe.preparation_time)} prep` : '',
    recipe.cooking_time ? `${formatDuration(recipe.cooking_time)} cook` : '',
    recipe.servings ? `${recipe.servings} servings` : '',
  ].filter(Boolean).join(' - ');

  const dietaryPreferences = (recipe.dietary_preferences || [])
    .map(preference => `<span>${escapeHtml(preference.name)}</span>`)
    .join('');

  els.recipeDetail.innerHTML = `
    <div class="recipe-detail-media">
      <img src="${escapeHtml(imageUrl(recipe.featured_image_url))}" alt="${escapeHtml(recipe.title || 'Recipe image')}">
    </div>
    <div class="recipe-detail-body">
      <div class="recipe-detail-head">
        <div>
          ${foodBadge(recipe.food_type)}
          <p class="recipe-meta">${escapeHtml(meta)}</p>
          <h3>${escapeHtml(recipe.title || 'Untitled recipe')}</h3>
        </div>
        <button id="closeRecipeDetailsBtn" class="ghost" type="button">Back</button>
      </div>
      <p>${escapeHtml(recipe.description || 'Freshly shared recipe')}</p>
      ${dietaryPreferences ? `<div class="detail-tags">${dietaryPreferences}</div>` : ''}
      <div class="detail-grid">
        <section>
          <h4>Ingredients</h4>
          <p>${formatRecipeText(recipe.ingredients)}</p>
        </section>
        <section>
          <h4>Instructions</h4>
          <p>${formatRecipeText(recipe.instructions)}</p>
        </section>
      </div>
      <section class="review-panel">
        <div class="section-head">
          <h4>Ratings and reviews</h4>
          <div id="reviewStats" class="review-stats">Loading reviews</div>
        </div>
        ${state.token ? `
          <form id="reviewForm" class="review-form" data-recipe-id="${escapeHtml(recipe.id)}">
            <input name="rating" type="hidden" required>
            <div class="star-input" role="radiogroup" aria-label="Rating">
              ${[1, 2, 3, 4, 5].map(star => `<button type="button" data-rating="${star}" aria-label="${star} star${star === 1 ? '' : 's'}">★</button>`).join('')}
            </div>
            <textarea name="comment" rows="3" placeholder="Share your cooking notes"></textarea>
            <button class="primary" type="submit">Submit review</button>
          </form>
        ` : '<p>Login to rate and review this recipe.</p>'}
        <div id="recipeReviews" class="list"></div>
      </section>
    </div>
  `;

  els.recipeDetail.classList.remove('hidden');
  document.querySelector('#closeRecipeDetailsBtn').addEventListener('click', hideRecipeDetails);
  document.querySelector('#reviewForm')?.addEventListener('submit', submitReview);
  wireStarRating();
  loadRecipeReviews(recipe.id);
  els.recipeDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function wireStarRating() {
  const form = document.querySelector('#reviewForm');
  if (!form) return;

  const ratingInput = form.elements.rating;
  const buttons = form.querySelectorAll('.star-input button');

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      ratingInput.value = button.dataset.rating;
      buttons.forEach(candidate => {
        candidate.classList.toggle('selected', Number(candidate.dataset.rating) <= Number(button.dataset.rating));
      });
    });
  });
}

async function loadRecipeReviews(recipeId) {
  try {
    const [reviewsResponse, statsResponse] = await Promise.all([
      api(`/reviews/recipe/${recipeId}?limit=20`),
      api(`/reviews/recipe/${recipeId}/stats`),
    ]);

    const reviews = reviewsResponse.data || [];
    const stats = statsResponse.data || {};
    const average = Number(stats.average_rating || 0);
    const total = Number(stats.total_reviews || 0);
    const statsTarget = document.querySelector('#reviewStats');
    const reviewsTarget = document.querySelector('#recipeReviews');

    if (statsTarget) {
      statsTarget.innerHTML = total
        ? `${starsMarkup(average, 'average-stars')} <strong>${average.toFixed(1)}</strong><span>${total} review${total === 1 ? '' : 's'}</span>`
        : `${starsMarkup(0, 'average-stars')} <span>No reviews yet</span>`;
    }

    if (!reviewsTarget) return;

    renderList(reviewsTarget, reviews, review => {
      const displayName = [review.first_name, review.last_name].filter(Boolean).join(' ') || review.username || 'User';
      const canDelete = state.user && String(state.user.id) === String(review.user_id);

      return `
        <h4>${escapeHtml(displayName)} ${starsMarkup(review.rating)}</h4>
        <p>${escapeHtml(review.comment || 'No comment added.')}</p>
        <p>${escapeHtml(formatDate(review.updated_at || review.created_at))}</p>
        ${canDelete ? `
          <div class="recipe-actions list-actions">
            <button class="danger delete-review-btn" data-review-id="${escapeHtml(review.id)}" data-recipe-id="${escapeHtml(recipeId)}" type="button">Delete review</button>
          </div>
        ` : ''}
      `;
    });

    document.querySelectorAll('.delete-review-btn').forEach(button => {
      button.addEventListener('click', () => deleteReview(button.dataset.reviewId, button.dataset.recipeId));
    });
  } catch (error) {
    setStatus(error.message);
  }
}

async function submitReview(event) {
  event.preventDefault();

  if (!state.token) {
    setStatus('Login required');
    return;
  }

  const form = event.currentTarget;
  const recipeId = form.dataset.recipeId;

  if (!form.elements.rating.value) {
    setStatus('Choose a star rating');
    return;
  }

  try {
    await api(`/reviews/${recipeId}`, {
      method: 'POST',
      body: JSON.stringify(formObject(form)),
    });
    form.reset();
    await loadRecipeReviews(recipeId);
    setStatus('Review submitted');
  } catch (error) {
    setStatus(error.message);
  }
}

async function deleteReview(reviewId, recipeId) {
  const confirmed = await showConfirm({
    title: 'Delete review?',
    message: 'Your rating and comment will be removed from this recipe.',
    confirmText: 'Delete review',
  });

  if (!confirmed) return;

  try {
    await api(`/reviews/${reviewId}`, { method: 'DELETE' });
    await loadRecipeReviews(recipeId);
    setStatus('Review deleted');
  } catch (error) {
    setStatus(error.message);
  }
}

function renderRecipes(recipes) {
  const template = document.querySelector('#recipeCardTemplate');
  els.recipeGrid.innerHTML = '';

  if (!recipes.length) {
    els.recipeGrid.innerHTML = '<article class="list-item"><p>No recipes found.</p></article>';
    return;
  }

  recipes.forEach(recipe => {
    const card = template.content.cloneNode(true);
    const article = card.querySelector('.recipe-card');
    const image = card.querySelector('.recipe-image');
    const title = card.querySelector('h3');
    const description = card.querySelector('p');
    const meta = card.querySelector('.recipe-meta');

    article.dataset.id = recipe.id;
    image.src = imageUrl(recipe.featured_image_url);
    image.alt = recipe.title || 'Recipe image';
    title.textContent = recipe.title || 'Untitled recipe';
    description.textContent = recipeDescription(recipe).slice(0, 120);
    meta.innerHTML = [
      foodBadge(recipe.food_type),
      escapeHtml(recipe.username || 'Community'),
      recipe.category_name ? escapeHtml(recipe.category_name) : '',
      recipe.difficulty_name ? escapeHtml(recipe.difficulty_name) : '',
      recipe.preparation_time ? `${escapeHtml(formatDuration(recipe.preparation_time))} prep` : '',
      recipe.cooking_time ? `${escapeHtml(formatDuration(recipe.cooking_time))} cook` : '',
      recipe.average_rating ? `${Number(recipe.average_rating).toFixed(1)} stars` : '',
    ].filter(Boolean).join(' ');

    card.querySelector('.details-btn').addEventListener('click', () => openRecipeInNewTab(recipe.id));
    card.querySelector('.favorite-btn').addEventListener('click', () => addFavorite(recipe.id));
    els.recipeGrid.appendChild(card);
  });
}

function openRecipeInNewTab(recipeId, isAdmin = false) {
  const path = isAdmin ? `/admin/recipe/${recipeId}` : `/recipe/${recipeId}`;
  window.open(path, '_blank', 'noopener');
}

async function loadRecipes(filters = {}) {
  try {
    const params = new URLSearchParams(filters);
    const suffix = params.toString() ? `?${params}` : '';
    const data = await api(`/recipes${suffix}`);
    renderRecipes(data.data || []);
    hideRecipeDetails();
    setStatus('Recipes loaded');
  } catch (error) {
    setStatus(error.message);
  }
}

async function loadRecipeDetails(id) {
  try {
    const data = await api(`/recipes/${id}`);
    const recipe = data.data;
    switchView('discover');
    renderRecipeDetails(recipe);
    setStatus(`${recipe.title} opened`);
  } catch (error) {
    setStatus(error.message);
  }
}

async function loadAdminRecipeDetails(id) {
  try {
    const data = await api(`/admin/recipes/${id}`);
    const recipe = data.data;
    switchView('discover');
    renderRecipeDetails(recipe);
    setStatus(`${recipe.title} opened for review`);
  } catch (error) {
    setStatus(error.message);
  }
}

async function loadRecipeFromCurrentUrl() {
  const recipeMatch = window.location.pathname.match(/^\/recipe\/(\d+)$/);
  const adminRecipeMatch = window.location.pathname.match(/^\/admin\/recipe\/(\d+)$/);

  if (recipeMatch) {
    if (!state.user) {
      showGuestRecipeShell();
    }

    await loadRecipeDetails(recipeMatch[1]);
    return true;
  }

  if (adminRecipeMatch) {
    await loadAdminRecipeDetails(adminRecipeMatch[1]);
    return true;
  }

  return false;
}

async function addFavorite(recipeId) {
  if (!state.token) {
    setStatus('Login required');
    return;
  }

  try {
    await api(`/favorites/${recipeId}`, { method: 'POST' });
    setStatus('Added to favorites');
  } catch (error) {
    setStatus(error.message);
  }
}

function resetRecipeFormMode() {
  state.editingRecipeId = null;
  const form = document.querySelector('#recipeForm');

  form.reset();
  els.recipeFormTitle.textContent = 'Publish recipe';
  els.recipeSubmitBtn.textContent = 'Publish recipe';
  els.cancelRecipeEditBtn.classList.add('hidden');
}

async function loadMyRecipes() {
  if (!state.token) {
    setStatus('Login required');
    return;
  }

  try {
    const data = await api('/users/recipes');
    const recipes = data.data || [];

    renderList(els.myRecipesList, recipes, recipe => `
      <h4>${escapeHtml(recipe.title || 'Recipe')}</h4>
      <p>${escapeHtml(recipe.description || 'No description')}</p>
      <p>${escapeHtml([
        recipe.food_type ? foodTypeLabel(recipe.food_type) : '',
        recipe.preparation_time ? `${formatDuration(recipe.preparation_time)} prep` : '',
        recipe.cooking_time ? `${formatDuration(recipe.cooking_time)} cook` : '',
      ].filter(Boolean).join(' - '))}</p>
      <div class="recipe-actions list-actions">
        <button class="ghost my-recipe-open-btn" data-recipe-id="${escapeHtml(recipe.id)}" type="button">Open</button>
        <button class="primary my-recipe-edit-btn" data-recipe-id="${escapeHtml(recipe.id)}" type="button">Edit</button>
        <button class="danger my-recipe-delete-btn" data-recipe-id="${escapeHtml(recipe.id)}" type="button">Delete</button>
      </div>
    `);

    els.myRecipesList.querySelectorAll('.my-recipe-open-btn').forEach(button => {
      button.addEventListener('click', () => openRecipeInNewTab(button.dataset.recipeId));
    });

    els.myRecipesList.querySelectorAll('.my-recipe-edit-btn').forEach(button => {
      button.addEventListener('click', () => startRecipeEdit(button.dataset.recipeId));
    });

    els.myRecipesList.querySelectorAll('.my-recipe-delete-btn').forEach(button => {
      button.addEventListener('click', () => deleteRecipe(button.dataset.recipeId));
    });

    setStatus(recipes.length ? 'Your recipes loaded' : 'No recipes created yet');
  } catch (error) {
    setStatus(error.message);
  }
}

async function startRecipeEdit(recipeId) {
  try {
    const data = await api(`/recipes/${recipeId}`);
    const recipe = data.data;
    const form = document.querySelector('#recipeForm');

    state.editingRecipeId = recipe.id;
    form.elements.title.value = recipe.title || '';
    form.elements.servings.value = recipe.servings || '';
    form.elements.category_id.value = recipe.category_id || '';
    form.elements.difficulty_level_id.value = recipe.difficulty_level_id || '';
    form.querySelector(`input[name="food_type"][value="${recipe.food_type || 'veg'}"]`)?.click();
    setMinuteField(form, 'prep_minutes', recipe.preparation_time);
    setMinuteField(form, 'cook_minutes', recipe.cooking_time);
    form.elements.description.value = recipe.description || '';
    form.elements.ingredients.value = recipe.ingredients || '';
    form.elements.instructions.value = recipe.instructions || '';
    form.elements.featured_image.value = '';

    els.recipeFormTitle.textContent = `Edit ${recipe.title || 'recipe'}`;
    els.recipeSubmitBtn.textContent = 'Save changes';
    els.cancelRecipeEditBtn.classList.remove('hidden');
    switchView('create');
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setStatus('Recipe ready to edit');
  } catch (error) {
    setStatus(error.message);
  }
}

async function deleteRecipe(recipeId) {
  const confirmed = await showConfirm({
    title: 'Delete recipe?',
    message: 'This recipe will be permanently removed.',
    confirmText: 'Delete recipe',
  });

  if (!confirmed) return;

  try {
    await api(`/recipes/${recipeId}`, { method: 'DELETE' });

    if (String(state.editingRecipeId) === String(recipeId)) {
      resetRecipeFormMode();
    }

    await loadMyRecipes();
    await loadRecipes();
    setStatus('Recipe deleted');
  } catch (error) {
    setStatus(error.message);
  }
}

async function loadFavorites() {
  if (!state.token) {
    setStatus('Login required');
    return;
  }

  try {
    const [favorites, collections] = await Promise.all([
      api('/favorites'),
      api('/favorites/collections'),
    ]);
    state.collections = collections.data || [];
    const collectionOptions = state.collections
      .map(collection => `<option value="${escapeHtml(collection.id)}">${escapeHtml(collection.name || 'Collection')}</option>`)
      .join('');

    renderList(els.favoritesList, favorites.data || [], row => `
      <h4>${escapeHtml(row.title || 'Recipe')}</h4>
      <p>${escapeHtml(row.description || '')}</p>
      <div class="recipe-actions list-actions">
        <button class="ghost favorite-open-btn" data-recipe-id="${escapeHtml(row.id)}" type="button">Open</button>
      </div>
      ${state.collections.length ? `
        <div class="collection-add-row">
          <select class="favorite-collection-select" aria-label="Choose collection">
            <option value="">Choose collection</option>
            ${collectionOptions}
          </select>
          <button class="primary favorite-add-collection-btn" data-recipe-id="${escapeHtml(row.id)}" type="button">Add to collection</button>
        </div>
      ` : '<p>Create a collection to organize this favorite.</p>'}
    `);

    els.favoritesList.querySelectorAll('.favorite-open-btn').forEach(button => {
      button.addEventListener('click', () => openRecipeInNewTab(button.dataset.recipeId));
    });

    els.favoritesList.querySelectorAll('.favorite-add-collection-btn').forEach(button => {
      button.addEventListener('click', () => {
        const select = button.closest('.list-item')?.querySelector('.favorite-collection-select');
        addFavoriteToCollection(button.dataset.recipeId, select?.value);
      });
    });

    renderList(els.collectionsList, state.collections, row => `
      <h4>${escapeHtml(row.name || 'Collection')}</h4>
      <p>${escapeHtml(row.description || 'Collection')} - ${escapeHtml(row.recipe_count || 0)} recipes - ${row.is_public ? 'Public' : 'Private'}</p>
      <div class="recipe-actions list-actions">
        <button class="ghost collection-view-btn" data-collection-id="${escapeHtml(row.id)}" data-collection-name="${escapeHtml(row.name || 'Collection')}" type="button">View</button>
        <button class="primary collection-edit-btn" data-collection-id="${escapeHtml(row.id)}" type="button">Edit</button>
        <button class="danger collection-delete-btn" data-collection-id="${escapeHtml(row.id)}" type="button">Delete</button>
      </div>
    `);

    els.collectionsList.querySelectorAll('.collection-view-btn').forEach(button => {
      button.addEventListener('click', () => loadCollectionRecipes(button.dataset.collectionId, button.dataset.collectionName));
    });

    els.collectionsList.querySelectorAll('.collection-edit-btn').forEach(button => {
      button.addEventListener('click', () => startCollectionEdit(button.dataset.collectionId));
    });

    els.collectionsList.querySelectorAll('.collection-delete-btn').forEach(button => {
      button.addEventListener('click', () => deleteCollection(button.dataset.collectionId));
    });

    setStatus('Favorites loaded');
  } catch (error) {
    setStatus(error.message);
  }
}

function resetCollectionFormMode() {
  state.editingCollectionId = null;
  const form = document.querySelector('#collectionForm');

  form.reset();
  els.collectionSubmitBtn.textContent = 'Create';
  els.cancelCollectionEditBtn.classList.add('hidden');
}

function startCollectionEdit(collectionId) {
  const collection = state.collections.find(item => String(item.id) === String(collectionId));
  const form = document.querySelector('#collectionForm');

  if (!collection) {
    setStatus('Collection not found');
    return;
  }

  state.editingCollectionId = collection.id;
  form.elements.name.value = collection.name || '';
  form.elements.description.value = collection.description || '';
  form.elements.is_public.checked = Boolean(collection.is_public);
  els.collectionSubmitBtn.textContent = 'Save';
  els.cancelCollectionEditBtn.classList.remove('hidden');
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setStatus('Collection ready to edit');
}

async function deleteCollection(collectionId) {
  const confirmed = await showConfirm({
    title: 'Delete collection?',
    message: 'The collection will be removed. Recipes will stay in your favorites.',
    confirmText: 'Delete collection',
  });

  if (!confirmed) return;

  try {
    await api(`/favorites/collections/${collectionId}`, { method: 'DELETE' });

    if (String(state.editingCollectionId) === String(collectionId)) {
      resetCollectionFormMode();
    }

    els.collectionRecipesList.innerHTML = '';
    await loadFavorites();
    setStatus('Collection deleted');
  } catch (error) {
    setStatus(error.message);
  }
}

async function addFavoriteToCollection(recipeId, collectionId) {
  if (!collectionId) {
    setStatus('Choose a collection first');
    return;
  }

  try {
    await api(`/favorites/collections/${collectionId}/recipes/${recipeId}`, { method: 'POST' });
    await loadFavorites();
    setStatus('Recipe added to collection');
  } catch (error) {
    setStatus(error.message);
  }
}

async function loadCollectionRecipes(collectionId, collectionName = 'Collection') {
  try {
    const data = await api(`/favorites/collections/${collectionId}/recipes`);
    const recipes = data.data || [];

    els.collectionRecipesList.innerHTML = `
      <div class="section-head">
        <h3>${escapeHtml(collectionName)}</h3>
      </div>
    `;

    if (!recipes.length) {
      els.collectionRecipesList.innerHTML += '<div class="list-item"><p>No recipes in this collection yet.</p></div>';
      setStatus('Collection is empty');
      return;
    }

    recipes.forEach(recipe => {
      const item = document.createElement('article');
      item.className = 'list-item';
      item.innerHTML = `
        <h4>${escapeHtml(recipe.title || 'Recipe')}</h4>
        <p>${escapeHtml(recipe.description || '')}</p>
        <div class="recipe-actions list-actions">
          <button class="ghost collection-recipe-open-btn" data-recipe-id="${escapeHtml(recipe.id)}" type="button">Open</button>
          <button class="danger collection-recipe-remove-btn" data-collection-id="${escapeHtml(collectionId)}" data-recipe-id="${escapeHtml(recipe.id)}" data-collection-name="${escapeHtml(collectionName)}" type="button">Remove</button>
        </div>
      `;
      els.collectionRecipesList.appendChild(item);
    });

    els.collectionRecipesList.querySelectorAll('.collection-recipe-open-btn').forEach(button => {
      button.addEventListener('click', () => openRecipeInNewTab(button.dataset.recipeId));
    });

    els.collectionRecipesList.querySelectorAll('.collection-recipe-remove-btn').forEach(button => {
      button.addEventListener('click', () => removeRecipeFromCollection(button.dataset.collectionId, button.dataset.recipeId, button.dataset.collectionName));
    });

    setStatus('Collection recipes loaded');
  } catch (error) {
    setStatus(error.message);
  }
}

async function removeRecipeFromCollection(collectionId, recipeId, collectionName) {
  try {
    await api(`/favorites/collections/${collectionId}/recipes/${recipeId}`, { method: 'DELETE' });
    await Promise.all([loadFavorites(), loadCollectionRecipes(collectionId, collectionName)]);
    setStatus('Recipe removed from collection');
  } catch (error) {
    setStatus(error.message);
  }
}

async function loadProfile() {
  if (!state.token) {
    setStatus('Login required');
    return;
  }

  try {
    const data = await api('/users/profile');
    const user = data.data;
    state.user = { ...state.user, ...user };
    localStorage.setItem('recipe_user', JSON.stringify(state.user));
    renderSession();

    els.profileDetails.innerHTML = `
      <img class="profile-avatar" src="${escapeHtml(imageUrl(user.profile_picture_url))}" alt="${escapeHtml(user.username || 'Profile')} profile picture">
      <h4>${user.username}</h4>
      <p>${user.email}</p>
      <p>${user.first_name || ''} ${user.last_name || ''}</p>
      <p>${user.bio || ''}</p>
    `;
    document.querySelector('#profileForm').username.value = user.username || '';
    document.querySelector('#profileForm').first_name.value = user.first_name || '';
    document.querySelector('#profileForm').last_name.value = user.last_name || '';
    document.querySelector('#profileForm').bio.value = user.bio || '';
    setStatus('Profile loaded');
  } catch (error) {
    setStatus(error.message);
  }
}

async function loadFeed() {
  if (!state.token) {
    setStatus('Login required');
    return;
  }

  try {
    const data = await api('/social/feed/activities');
    renderList(els.activityFeed, data.data || [], row => `
      <h4>${row.username || 'User'} - ${row.activity_type}</h4>
      <p>${row.recipe_title || 'Recipe activity'} - ${new Date(row.created_at).toLocaleString()}</p>
    `);
    setStatus('Feed loaded');
  } catch (error) {
    setStatus(error.message);
  }
}

async function searchUsers() {
  if (!state.token) {
    setStatus('Login required');
    return;
  }

  const query = document.querySelector('#userSearchInput').value.trim();

  if (query.length < 2) {
    setStatus('Enter at least 2 characters to search users');
    return;
  }

  try {
    const data = await api(`/social/users/search?query=${encodeURIComponent(query)}`);
    const users = data.data || [];

    renderList(els.userSearchResults, users, user => {
      const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ');
      const actionLabel = user.is_following ? 'Unfollow' : 'Follow';
      const actionClass = user.is_following ? 'ghost' : 'primary';

      return `
        <h4>${escapeHtml(user.username || 'User')}</h4>
        <p>${escapeHtml(displayName || user.bio || 'Recipe community member')}</p>
        <div class="recipe-actions list-actions">
          <button class="${actionClass} user-follow-toggle" data-user-id="${escapeHtml(user.id)}" data-following="${user.is_following ? 'true' : 'false'}" type="button">${actionLabel}</button>
        </div>
      `;
    });

    els.userSearchResults.querySelectorAll('.user-follow-toggle').forEach(button => {
      button.addEventListener('click', () => toggleUserFollow(button.dataset.userId, button.dataset.following === 'true'));
    });

    setStatus(users.length ? 'Users loaded' : 'No users found');
  } catch (error) {
    setStatus(error.message);
  }
}

async function toggleUserFollow(userId, isFollowing) {
  if (!userId) {
    setStatus('Select a user first');
    return;
  }

  try {
    await api(`/social/follow/${userId}`, { method: isFollowing ? 'DELETE' : 'POST' });
    setStatus(isFollowing ? 'Unfollowed user' : 'Following user');
    searchUsers();
    loadFeed();
  } catch (error) {
    setStatus(error.message);
  }
}

function boolLabel(value, trueText, falseText) {
  return value ? trueText : falseText;
}

function renderAdminStats(stats) {
  const cards = [
    ['Users', stats.users?.total_users || 0],
    ['Verified', stats.users?.verified_users || 0],
    ['Banned', stats.users?.banned_users || 0],
    ['Recipes', stats.recipes?.total_recipes || 0],
    ['Published', stats.recipes?.published_recipes || 0],
    ['Reviews', stats.reviews?.total_reviews || 0],
    ['Favorites', stats.favorites?.total_favorites || 0],
  ];

  els.adminStats.innerHTML = cards.map(([label, value]) => `
    <article class="stat-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `).join('');
}

function renderAdminUsers(users) {
  renderList(els.adminUsersList, users, user => {
    const isBanned = Boolean(user.is_banned);
    const isVerified = Boolean(user.is_verified);
    const isCurrentSession = state.user && String(state.user.id) === String(user.id);
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ');

    return `
      <h4>${escapeHtml(user.username || user.email || 'User')}</h4>
      <p>${escapeHtml(name || user.email || '')}</p>
      <p>${escapeHtml([
        isCurrentSession && state.user?.role === 'admin' ? 'Logged in as admin' : 'Member',
        boolLabel(isVerified, 'Verified', 'Not verified'),
        boolLabel(isBanned, 'Banned', 'Active'),
      ].join(' - '))}</p>
      <div class="recipe-actions list-actions">
        ${isVerified ? '' : `<button class="primary admin-verify-user" data-user-id="${escapeHtml(user.id)}" type="button">Approve</button>`}
        ${isCurrentSession ? '' : `<button class="${isBanned ? 'primary' : 'danger'} admin-ban-toggle" data-user-id="${escapeHtml(user.id)}" data-banned="${isBanned ? 'true' : 'false'}" type="button">${isBanned ? 'Unban' : 'Ban'}</button>`}
      </div>
    `;
  });

  els.adminUsersList.querySelectorAll('.admin-verify-user').forEach(button => {
    button.addEventListener('click', () => approveUser(button.dataset.userId));
  });

  els.adminUsersList.querySelectorAll('.admin-ban-toggle').forEach(button => {
    button.addEventListener('click', () => toggleUserBan(button.dataset.userId, button.dataset.banned === 'true'));
  });
}

function renderAdminRecipes(recipes) {
  renderList(els.adminRecipesList, recipes, recipe => {
    const isPublished = Boolean(recipe.is_published);

    return `
      <img class="admin-recipe-thumb" src="${escapeHtml(imageUrl(recipe.featured_image_url))}" alt="${escapeHtml(recipe.title || 'Recipe image')}">
      <h4>${escapeHtml(recipe.title || 'Recipe')}</h4>
      <p>${escapeHtml(recipe.description || 'No description')}</p>
      <p>${escapeHtml([
        `By ${recipe.username || 'Unknown'}`,
        recipe.food_type ? foodTypeLabel(recipe.food_type) : '',
        recipe.preparation_time ? `${formatDuration(recipe.preparation_time)} prep` : '',
        recipe.cooking_time ? `${formatDuration(recipe.cooking_time)} cook` : '',
        isPublished ? 'Published' : 'Unpublished',
        `${recipe.review_count || 0} reviews`,
      ].filter(Boolean).join(' - '))}</p>
      <div class="recipe-actions list-actions">
        <button class="ghost admin-open-recipe" data-recipe-id="${escapeHtml(recipe.id)}" type="button">Open</button>
        <button class="${isPublished ? 'ghost' : 'primary'} admin-publish-toggle" data-recipe-id="${escapeHtml(recipe.id)}" data-published="${isPublished ? 'true' : 'false'}" type="button">${isPublished ? 'Unpublish' : 'Publish'}</button>
        <button class="danger admin-delete-recipe" data-recipe-id="${escapeHtml(recipe.id)}" type="button">Remove</button>
      </div>
    `;
  });

  els.adminRecipesList.querySelectorAll('.admin-open-recipe').forEach(button => {
    button.addEventListener('click', () => openRecipeInNewTab(button.dataset.recipeId, true));
  });

  els.adminRecipesList.querySelectorAll('.admin-publish-toggle').forEach(button => {
    button.addEventListener('click', () => toggleRecipePublish(button.dataset.recipeId, button.dataset.published === 'true'));
  });

  els.adminRecipesList.querySelectorAll('.admin-delete-recipe').forEach(button => {
    button.addEventListener('click', () => removeAdminRecipe(button.dataset.recipeId));
  });
}

async function loadAdminStats() {
  if (!state.token) {
    setStatus('Login required');
    return;
  }

  try {
    const data = await api('/admin/stats');
    renderAdminStats(data.data || {});
    setStatus('Admin stats loaded');
  } catch (error) {
    setStatus(error.message);
  }
}

async function loadAdminUsers() {
  if (!state.token) {
    setStatus('Login required');
    return;
  }

  try {
    const data = await api('/admin/users?limit=50');
    renderAdminUsers(data.data || []);
    setStatus('Admin users loaded');
  } catch (error) {
    setStatus(error.message);
  }
}

async function loadAdminRecipes() {
  if (!state.token) {
    setStatus('Login required');
    return;
  }

  try {
    const data = await api('/admin/recipes?limit=50');
    renderAdminRecipes(data.data || []);
    setStatus('Admin recipes loaded');
  } catch (error) {
    setStatus(error.message);
  }
}

async function loadAdminDashboard() {
  await Promise.all([loadAdminStats(), loadAdminUsers(), loadAdminRecipes()]);
}

async function approveUser(userId) {
  try {
    await api(`/admin/users/${userId}/approve`, { method: 'POST' });
    await Promise.all([loadAdminStats(), loadAdminUsers()]);
    setStatus('User approved');
  } catch (error) {
    setStatus(error.message);
  }
}

async function toggleUserBan(userId, isBanned) {
  const action = isBanned ? 'unban' : 'ban';

  try {
    await api(`/admin/users/${userId}/${action}`, { method: 'POST', body: JSON.stringify({}) });
    await Promise.all([loadAdminStats(), loadAdminUsers()]);
    setStatus(isBanned ? 'User unbanned' : 'User banned');
  } catch (error) {
    setStatus(error.message);
  }
}

async function toggleRecipePublish(recipeId, isPublished) {
  const action = isPublished ? 'unpublish' : 'publish';

  try {
    await api(`/admin/recipes/${recipeId}/${action}`, { method: 'POST' });
    await Promise.all([loadAdminStats(), loadAdminRecipes(), loadRecipes()]);
    setStatus(isPublished ? 'Recipe unpublished' : 'Recipe published');
  } catch (error) {
    setStatus(error.message);
  }
}

async function removeAdminRecipe(recipeId) {
  const confirmed = await showConfirm({
    title: 'Remove recipe?',
    message: 'This admin action permanently removes the recipe.',
    confirmText: 'Remove recipe',
  });

  if (!confirmed) return;

  try {
    await api(`/admin/recipes/${recipeId}`, { method: 'DELETE' });
    await Promise.all([loadAdminStats(), loadAdminRecipes(), loadRecipes()]);
    setStatus('Recipe removed');
  } catch (error) {
    setStatus(error.message);
  }
}

function wireEvents() {
  document.querySelectorAll('.nav-btn').forEach(button => {
    button.addEventListener('click', () => {
      switchView(button.dataset.view);
      if (button.dataset.view === 'profile') loadProfile();
      if (button.dataset.view === 'create') loadMyRecipes();
      if (button.dataset.view === 'favorites') loadFavorites();
      if (button.dataset.view === 'social') {
        els.userSearchResults.innerHTML = '';
        loadFeed();
      }
      if (button.dataset.view === 'admin') loadAdminDashboard();
    });
  });

  document.querySelector('#showSignupBtn').addEventListener('click', () => switchAuthForm('signup'));
  document.querySelector('#showLoginBtn').addEventListener('click', () => switchAuthForm('login'));

  document.querySelector('#loginForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    clearAuthMessages();
    if (!validateForm(form)) return;

    try {
      const data = await api('/users/login', {
        method: 'POST',
        body: JSON.stringify(formObject(form)),
      });
      saveSession(data.data);
      setStatus(`Logged in as ${data.data.user.role}`);
      switchView('discover');
      loadRecipes();
    } catch (error) {
      setFormMessage(els.loginMessage, error.message, 'error');
    }
  });

  document.querySelector('#registerForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    clearAuthMessages();
    if (!validateForm(form)) return;

    try {
      const data = await api('/users/register', {
        method: 'POST',
        body: JSON.stringify(formObject(form)),
      });
      resetStoredSession();
      form.reset();
      showLoginAfterRegistration(data.data?.user?.email);
      setFormMessage(els.loginMessage, 'Account created. Please login to continue.', 'success');
    } catch (error) {
      setFormMessage(els.registerMessage, error.message, 'error');
    }
  });

  els.logoutBtn.addEventListener('click', () => {
    clearSession();
    setStatus('Logged out');
  });

  document.querySelector('#searchForm').addEventListener('submit', event => {
    event.preventDefault();
    loadRecipes(buildSearchFilters(event.currentTarget));
  });

  document.querySelector('#loadRecipesBtn').addEventListener('click', () => loadRecipes());
  document.querySelector('#loadMyRecipesBtn').addEventListener('click', loadMyRecipes);
  document.querySelector('#loadFavoritesBtn').addEventListener('click', loadFavorites);
  els.cancelRecipeEditBtn.addEventListener('click', () => {
    resetRecipeFormMode();
    setStatus('Edit cancelled');
  });
  els.cancelCollectionEditBtn.addEventListener('click', () => {
    resetCollectionFormMode();
    setStatus('Collection edit cancelled');
  });

  document.querySelector('#recipeForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (!state.token) {
      setStatus('Login required');
      return;
    }

    try {
      const form = event.currentTarget;
      if (!validateForm(form)) return;

      let successMessage = 'Recipe published';

      if (state.editingRecipeId) {
        const payload = buildRecipeFormData(form);

        await api(`/recipes/${state.editingRecipeId}`, {
          method: 'PUT',
          body: payload,
        });
        resetRecipeFormMode();
        successMessage = 'Recipe updated';
      } else {
        const data = buildRecipeFormData(form);

        await api('/recipes', { method: 'POST', body: data });
        form.reset();
      }

      await loadMyRecipes();
      switchView('discover');
      await loadRecipes();
      setStatus(successMessage);
    } catch (error) {
      setStatus(error.message);
    }
  });

  document.querySelector('#collectionForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!validateForm(form)) return;

    try {
      const payload = formObject(form);
      payload.is_public = Boolean(form.is_public.checked);
      const path = state.editingCollectionId
        ? `/favorites/collections/${state.editingCollectionId}`
        : '/favorites/collections';
      const method = state.editingCollectionId ? 'PUT' : 'POST';

      await api(path, { method, body: JSON.stringify(payload) });
      resetCollectionFormMode();
      loadFavorites();
      setStatus(method === 'PUT' ? 'Collection updated' : 'Collection created');
    } catch (error) {
      setStatus(error.message);
    }
  });

  document.querySelector('#profileForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!validateForm(form)) return;

    try {
      const payload = formObject(form);
      await api('/users/profile', { method: 'PUT', body: JSON.stringify(payload) });
      loadProfile();
      setStatus('Profile saved');
    } catch (error) {
      setStatus(error.message);
    }
  });

  document.querySelector('#profilePictureForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!validateForm(form)) return;

    const file = form.elements.profile_picture?.files?.[0];
    const imageError = validateImageFile(file);

    try {
      if (!file) {
        showFieldError(form.elements.profile_picture, 'Choose a profile image first');
        throw new Error('Choose a profile image first');
      }
      if (imageError) {
        showFieldError(form.elements.profile_picture, imageError);
        throw new Error(imageError);
      }

      const data = new FormData(form);
      const response = await api('/users/profile/picture', { method: 'PUT', body: data });
      state.user = { ...state.user, ...(response.data || {}) };
      localStorage.setItem('recipe_user', JSON.stringify(state.user));
      form.reset();
      loadProfile();
      setStatus('Profile picture uploaded');
    } catch (error) {
      setStatus(error.message);
    }
  });

  document.querySelector('#searchUsersBtn').addEventListener('click', searchUsers);
  document.querySelector('#userSearchInput').addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      searchUsers();
    }
  });
  document.querySelector('#loadFeedBtn').addEventListener('click', loadFeed);
  document.querySelector('#loadUsersBtn').addEventListener('click', loadAdminUsers);
  document.querySelector('#loadAdminRecipesBtn').addEventListener('click', loadAdminRecipes);
  document.querySelector('#loadStatsBtn').addEventListener('click', loadAdminStats);
}

async function init() {
  renderSession();
  wireFormValidation();
  wireEvents();
  await loadRecipeOptions();
  if (await loadRecipeFromCurrentUrl()) {
    return;
  }

  if (state.user) {
    loadRecipes();
  }
}

init();
