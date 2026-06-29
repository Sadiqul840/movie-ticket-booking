const API = '/api';
const app = document.getElementById('app');
const authArea = document.getElementById('authArea');
const modalRoot = document.getElementById('modalRoot');
const toastRoot = document.getElementById('toastRoot');

let state = {
  view: 'home',
  movies: [],
  selectedMovie: null,
  shows: [],
  selectedShow: null,
  seats: [],
  selectedSeats: [],
  bookings: [],
  user: JSON.parse(localStorage.getItem('mq_user') || 'null'),
  token: localStorage.getItem('mq_token') || null,
};

// ---------- helpers ----------
function showToast(msg, isError=false){
  const el = document.createElement('div');
  el.className = 'toast' + (isError ? ' error' : '');
  el.textContent = msg;
  toastRoot.appendChild(el);
  setTimeout(()=> el.remove(), 3500);
}

async function api(path, options={}){
  const headers = options.headers || {};
  headers['Content-Type'] = 'application/json';
  if(state.token) headers['Authorization'] = 'Bearer ' + state.token;
  const res = await fetch(API + path, {...options, headers});
  let data = null;
  try{ data = await res.json(); }catch(e){}
  if(!res.ok){
    throw new Error((data && data.message) || 'Request failed');
  }
  return data;
}

function fmtDate(dtStr){
  const d = new Date(dtStr);
  return d.toLocaleString(undefined, {weekday:'short', month:'short', day:'numeric', hour:'numeric', minute:'2-digit'});
}

function setView(v){
  state.view = v;
  document.querySelectorAll('#navLinks button').forEach(b=>{
    b.classList.toggle('active', b.dataset.view === v);
  });
  render();
}

document.getElementById('navLinks').addEventListener('click', (e)=>{
  const btn = e.target.closest('button[data-view]');
  if(!btn) return;
  if(btn.dataset.view === 'bookings' && !state.user){
    openAuthModal('login'); return;
  }
  setView(btn.dataset.view);
});

// ---------- auth ----------
function renderAuthArea(){
  if(state.user){
    authArea.innerHTML = `
      <div style="display:flex;align-items:center;gap:14px;">
        <span style="font-size:13px;color:var(--text-dim);">Hi, <strong style="color:var(--text)">${state.user.username}</strong></span>
        <button class="btn" id="logoutBtn">Logout</button>
      </div>`;
    document.getElementById('logoutBtn').onclick = logout;
    document.getElementById('adminLink').style.display = state.user.role === 'ADMIN' ? 'inline-block' : 'none';
  } else {
    authArea.innerHTML = `<button class="btn primary" id="loginBtn">Sign In</button>`;
    document.getElementById('loginBtn').onclick = ()=> openAuthModal('login');
  }
}

function logout(){
  state.user = null; state.token = null;
  localStorage.removeItem('mq_user'); localStorage.removeItem('mq_token');
  renderAuthArea();
  setView('home');
}

function openAuthModal(mode){
  modalRoot.innerHTML = `
  <div class="modal-overlay" id="overlay">
    <div class="modal">
      <button class="close-x" id="closeModal">&times;</button>
      <h2>${mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
      <form id="authForm">
        ${mode === 'signup' ? `<div class="field"><label>Email</label><input type="email" id="f_email" required></div>` : ''}
        <div class="field"><label>Username</label><input type="text" id="f_username" required></div>
        <div class="field"><label>Password</label><input type="password" id="f_password" required></div>
        <div class="modal-actions">
          <button type="submit" class="btn primary">${mode === 'login' ? 'Sign In' : 'Sign Up'}</button>
        </div>
      </form>
      <div class="switch-link">
        ${mode === 'login' ? `New here? <a id="switchMode">Create an account</a>` : `Already have an account? <a id="switchMode">Sign in</a>`}
      </div>
    </div>
  </div>`;
  document.getElementById('closeModal').onclick = ()=> modalRoot.innerHTML = '';
  document.getElementById('overlay').onclick = (e)=>{ if(e.target.id === 'overlay') modalRoot.innerHTML = ''; };
  document.getElementById('switchMode').onclick = ()=> openAuthModal(mode === 'login' ? 'signup' : 'login');

  document.getElementById('authForm').onsubmit = async (e)=>{
    e.preventDefault();
    const username = document.getElementById('f_username').value.trim();
    const password = document.getElementById('f_password').value;
    try{
      if(mode === 'login'){
        const data = await api('/auth/login', {method:'POST', body: JSON.stringify({username, password})});
        state.token = data.token; state.user = {username:data.username, role:data.role, id:data.id};
        localStorage.setItem('mq_token', state.token);
        localStorage.setItem('mq_user', JSON.stringify(state.user));
        showToast('Welcome back, ' + data.username + '!');
        modalRoot.innerHTML = '';
        renderAuthArea();
        render();
      } else {
        const email = document.getElementById('f_email').value.trim();
        await api('/auth/signup', {method:'POST', body: JSON.stringify({username, email, password})});
        showToast('Account created! Please sign in.');
        openAuthModal('login');
      }
    }catch(err){
      showToast(err.message, true);
    }
  };
}

// ---------- views ----------
async function render(){
  renderAuthArea();
  if(state.view === 'home') return renderHome();
  if(state.view === 'movieDetail') return renderMovieDetail();
  if(state.view === 'seatSelect') return renderSeatSelect();
  if(state.view === 'bookings') return renderBookings();
  if(state.view === 'admin') return renderAdmin();
}

async function renderHome(){
  app.innerHTML = `
    <div class="hero">
      <h1>Now <span>Booking</span></h1>
      <p>Grab the best seats in the house. Browse what's playing and lock in your show in seconds.</p>
      <div class="search-bar">
        <input type="text" id="searchInput" placeholder="Search movies by title...">
        <button class="btn primary" id="searchBtn">Search</button>
      </div>
    </div>
    <div class="container">
      <div class="section-title"><h2>In Theaters</h2><div class="rule"></div></div>
      <div class="movie-grid" id="movieGrid"><p style="color:var(--text-dim)">Loading movies...</p></div>
    </div>`;

  document.getElementById('searchBtn').onclick = doSearch;
  document.getElementById('searchInput').addEventListener('keydown', e=>{ if(e.key==='Enter') doSearch(); });

  try{
    state.movies = await api('/movies');
    renderMovieGrid(state.movies);
  }catch(err){
    document.getElementById('movieGrid').innerHTML = `<p style="color:var(--text-dim)">Could not load movies.</p>`;
  }
}

async function doSearch(){
  const q = document.getElementById('searchInput').value.trim();
  try{
    const results = q ? await api('/movies/search?title=' + encodeURIComponent(q)) : await api('/movies');
    renderMovieGrid(results);
  }catch(err){ showToast(err.message, true); }
}

function renderMovieGrid(movies){
  const grid = document.getElementById('movieGrid');
  if(!movies.length){
    grid.innerHTML = `<div class="empty-state"><div class="icon">🎬</div>No movies found.</div>`;
    return;
  }
  grid.innerHTML = movies.map(m => `
    <div class="movie-card" data-id="${m.id}">
      <img src="${m.posterUrl}" alt="${m.title}">
      <div class="info">
        <p class="title">${m.title}</p>
        <div class="meta">
          <span>${m.genre} · ${m.language}</span>
          <span class="rating-pill">★ ${m.rating}</span>
        </div>
      </div>
    </div>`).join('');
  grid.querySelectorAll('.movie-card').forEach(card=>{
    card.onclick = ()=> openMovieDetail(parseInt(card.dataset.id));
  });
}

async function openMovieDetail(id){
  state.selectedMovie = state.movies.find(m=>m.id===id) || await api('/movies/' + id);
  state.shows = await api('/shows/movie/' + id);
  setView('movieDetail');
}

async function renderMovieDetail(){
  const m = state.selectedMovie;
  if(!m){ setView('home'); return; }
  app.innerHTML = `
    <div class="detail-hero">
      <img src="${m.posterUrl}" alt="${m.title}">
      <div class="detail-info">
        <h1>${m.title}</h1>
        <div class="tags">
          <span class="tag">${m.genre}</span>
          <span class="tag">${m.language}</span>
          <span class="tag">${m.durationMinutes} min</span>
          <span class="tag">★ ${m.rating}</span>
          <span class="tag">${m.releaseDate}</span>
        </div>
        <p class="desc">${m.description}</p>
      </div>
    </div>
    <div class="container">
      <div class="section-title"><h2>Select a Showtime</h2><div class="rule"></div></div>
      <div id="theaterList"></div>
    </div>`;

  const byTheater = {};
  state.shows.forEach(s=>{
    const key = s.theater.id;
    byTheater[key] = byTheater[key] || {theater: s.theater, shows: []};
    byTheater[key].shows.push(s);
  });

  const list = document.getElementById('theaterList');
  const groups = Object.values(byTheater);
  if(!groups.length){
    list.innerHTML = `<div class="empty-state"><div class="icon">🎟️</div>No showtimes scheduled yet.</div>`;
    return;
  }
  list.innerHTML = groups.map(g => `
    <div class="theater-group">
      <h3>${g.theater.name} — ${g.theater.city}</h3>
      <div class="addr">${g.theater.address}</div>
      <div class="showtimes">
        ${g.shows.map(s => `
          <div class="show-chip" data-show="${s.id}">
            ${fmtDate(s.showTime)}
            <span class="price">₹${s.ticketPrice.toFixed(0)}</span>
          </div>`).join('')}
      </div>
    </div>`).join('');

  list.querySelectorAll('.show-chip').forEach(chip=>{
    chip.onclick = ()=> openSeatSelect(parseInt(chip.dataset.show));
  });
}

async function openSeatSelect(showId){
  if(!state.user){ openAuthModal('login'); return; }
  state.selectedShow = state.shows.find(s=>s.id===showId) || await api('/shows/' + showId);
  state.seats = await api('/seats/show/' + showId);
  state.selectedSeats = [];
  setView('seatSelect');
}

function renderSeatSelect(){
  const show = state.selectedShow;
  const m = state.selectedMovie;
  const rows = {};
  state.seats.forEach(s=>{
    const row = s.seatNumber[0];
    rows[row] = rows[row] || [];
    rows[row].push(s);
  });
  const rowKeys = Object.keys(rows).sort();

  app.innerHTML = `
    <div class="container">
      <div class="section-title"><h2>${m.title} — Select Seats</h2><div class="rule"></div></div>
      <p style="color:var(--text-dim);margin-top:-10px;">${show.theater.name}, ${show.theater.city} &middot; ${fmtDate(show.showTime)}</p>
      <div class="seat-wrap">
        <div style="flex:1;min-width:280px;">
          <div class="screen"><div class="curve"></div><span>S C R E E N</span></div>
          <div class="seat-map" id="seatMap">
            ${rowKeys.map(r => `
              <div class="seat-row">
                <span class="row-label">${r}</span>
                ${rows[r].sort((a,b)=>a.seatNumber.localeCompare(b.seatNumber, undefined, {numeric:true})).map(seat => `
                  <div class="seat ${seat.status==='BOOKED' || seat.status==='LOCKED' ? 'booked' : ''}" data-id="${seat.id}" data-num="${seat.seatNumber}">
                    ${seat.seatNumber.slice(1)}
                  </div>`).join('')}
              </div>`).join('')}
          </div>
          <div class="legend">
            <span><span class="sw" style="background:var(--available)"></span>Available</span>
            <span><span class="sw" style="background:var(--selected)"></span>Selected</span>
            <span><span class="sw" style="background:var(--booked)"></span>Booked</span>
          </div>
        </div>
        <div class="booking-summary">
          <h3>Booking Summary</h3>
          <div class="row"><span>Show</span><span>${m.title}</span></div>
          <div class="row"><span>Seats</span><span id="seatCountLabel">0 selected</span></div>
          <div class="row"><span>Price/seat</span><span>₹${show.ticketPrice.toFixed(0)}</span></div>
          <div class="total" id="totalLabel">₹0</div>
          <button class="btn primary" id="confirmBtn" style="width:100%;" disabled>Confirm Booking</button>
        </div>
      </div>
    </div>`;

  document.querySelectorAll('.seat:not(.booked)').forEach(seatEl=>{
    seatEl.onclick = ()=>{
      const id = parseInt(seatEl.dataset.id);
      const idx = state.selectedSeats.indexOf(id);
      if(idx >= 0){ state.selectedSeats.splice(idx,1); seatEl.classList.remove('selected'); }
      else { state.selectedSeats.push(id); seatEl.classList.add('selected'); }
      updateSummary();
    };
  });

  document.getElementById('confirmBtn').onclick = confirmBooking;
  updateSummary();
}

function updateSummary(){
  const count = state.selectedSeats.length;
  document.getElementById('seatCountLabel').textContent = count + ' selected';
  document.getElementById('totalLabel').textContent = '₹' + (count * state.selectedShow.ticketPrice).toFixed(0);
  document.getElementById('confirmBtn').disabled = count === 0;
}

async function confirmBooking(){
  try{
    const booking = await api('/bookings', {method:'POST', body: JSON.stringify({
      showId: state.selectedShow.id, seatIds: state.selectedSeats
    })});
    showToast('Booking confirmed! Enjoy the show 🎬');
    setView('bookings');
  }catch(err){
    showToast(err.message, true);
    // refresh seat map to reflect real availability
    state.seats = await api('/seats/show/' + state.selectedShow.id);
    renderSeatSelect();
  }
}

async function renderBookings(){
  app.innerHTML = `
    <div class="container">
      <div class="section-title"><h2>My Bookings</h2><div class="rule"></div></div>
      <div id="bookingsList"><p style="color:var(--text-dim)">Loading...</p></div>
    </div>`;
  try{
    state.bookings = await api('/bookings/my');
  }catch(err){
    document.getElementById('bookingsList').innerHTML = `<p style="color:var(--text-dim)">Could not load bookings.</p>`;
    return;
  }
  const list = document.getElementById('bookingsList');
  if(!state.bookings.length){
    list.innerHTML = `<div class="empty-state"><div class="icon">🎟️</div>No bookings yet. Go pick a movie!</div>`;
    return;
  }
  list.innerHTML = state.bookings.slice().reverse().map(b => `
    <div class="ticket">
      <div class="stub-main">
        <h4>${b.show.movie.title}</h4>
        <div class="meta-line">${b.show.theater.name}, ${b.show.theater.city}</div>
        <div class="meta-line">${fmtDate(b.show.showTime)}</div>
        <div class="seats-list">Seats: ${b.seats.map(s=>s.seatNumber).join(', ')}</div>
      </div>
      <div class="stub-side">
        <span class="status-badge ${b.status.toLowerCase()}">${b.status}</span>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:20px;color:var(--gold);">₹${b.totalAmount.toFixed(0)}</div>
        ${b.status === 'CONFIRMED' ? `<button class="btn danger" data-id="${b.id}" style="font-size:12px;padding:6px 12px;">Cancel</button>` : ''}
      </div>
    </div>`).join('');

  list.querySelectorAll('button[data-id]').forEach(btn=>{
    btn.onclick = async ()=>{
      try{
        await api('/bookings/' + btn.dataset.id, {method:'DELETE'});
        showToast('Booking cancelled');
        renderBookings();
      }catch(err){ showToast(err.message, true); }
    };
  });
}

// ---------- Admin ----------
async function renderAdmin(){
  if(!state.user || state.user.role !== 'ADMIN'){ setView('home'); return; }
  app.innerHTML = `
    <div class="container">
      <div class="section-title"><h2>Admin Panel</h2><div class="rule"></div></div>
      <div class="tabs">
        <button class="active" data-tab="movies">Movies</button>
        <button data-tab="theaters">Theaters</button>
        <button data-tab="shows">Shows</button>
      </div>
      <div id="adminContent"></div>
    </div>`;
  document.querySelectorAll('.tabs button').forEach(b=>{
    b.onclick = ()=>{
      document.querySelectorAll('.tabs button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      renderAdminTab(b.dataset.tab);
    };
  });
  renderAdminTab('movies');
}

async function renderAdminTab(tab){
  const content = document.getElementById('adminContent');
  if(tab === 'movies'){
    const movies = await api('/movies');
    content.innerHTML = `
      <button class="btn primary" id="addMovieBtn" style="margin-bottom:16px;">+ Add Movie</button>
      <table class="admin-table">
        <tr><th>Title</th><th>Genre</th><th>Language</th><th>Duration</th><th>Rating</th><th></th></tr>
        ${movies.map(m=>`<tr>
          <td>${m.title}</td><td>${m.genre}</td><td>${m.language}</td><td>${m.durationMinutes} min</td><td>★ ${m.rating}</td>
          <td><button class="btn danger" style="font-size:12px;padding:6px 10px;" data-del="${m.id}">Delete</button></td>
        </tr>`).join('')}
      </table>`;
    document.getElementById('addMovieBtn').onclick = openAddMovieModal;
    content.querySelectorAll('[data-del]').forEach(b=> b.onclick = async ()=>{
      try{ await api('/movies/' + b.dataset.del, {method:'DELETE'}); renderAdminTab('movies'); }
      catch(e){ showToast(e.message, true); }
    });
  }
  if(tab === 'theaters'){
    const theaters = await api('/theaters');
    content.innerHTML = `
      <button class="btn primary" id="addTheaterBtn" style="margin-bottom:16px;">+ Add Theater</button>
      <table class="admin-table">
        <tr><th>Name</th><th>City</th><th>Address</th><th>Seats</th><th></th></tr>
        ${theaters.map(t=>`<tr>
          <td>${t.name}</td><td>${t.city}</td><td>${t.address}</td><td>${t.totalSeats}</td>
          <td><button class="btn danger" style="font-size:12px;padding:6px 10px;" data-del="${t.id}">Delete</button></td>
        </tr>`).join('')}
      </table>`;
    document.getElementById('addTheaterBtn').onclick = openAddTheaterModal;
    content.querySelectorAll('[data-del]').forEach(b=> b.onclick = async ()=>{
      try{ await api('/theaters/' + b.dataset.del, {method:'DELETE'}); renderAdminTab('theaters'); }
      catch(e){ showToast(e.message, true); }
    });
  }
  if(tab === 'shows'){
    const shows = await api('/shows');
    content.innerHTML = `
      <button class="btn primary" id="addShowBtn" style="margin-bottom:16px;">+ Add Show</button>
      <table class="admin-table">
        <tr><th>Movie</th><th>Theater</th><th>Time</th><th>Price</th><th></th></tr>
        ${shows.map(s=>`<tr>
          <td>${s.movie.title}</td><td>${s.theater.name}</td><td>${fmtDate(s.showTime)}</td><td>₹${s.ticketPrice.toFixed(0)}</td>
          <td><button class="btn danger" style="font-size:12px;padding:6px 10px;" data-del="${s.id}">Delete</button></td>
        </tr>`).join('')}
      </table>`;
    document.getElementById('addShowBtn').onclick = openAddShowModal;
    content.querySelectorAll('[data-del]').forEach(b=> b.onclick = async ()=>{
      try{ await api('/shows/' + b.dataset.del, {method:'DELETE'}); renderAdminTab('shows'); }
      catch(e){ showToast(e.message, true); }
    });
  }
}

function openAddMovieModal(){
  modalRoot.innerHTML = `
  <div class="modal-overlay" id="overlay">
    <div class="modal" style="width:400px;">
      <button class="close-x" id="closeModal">&times;</button>
      <h2>Add Movie</h2>
      <form id="movieForm">
        <div class="field"><label>Title</label><input id="mv_title" required></div>
        <div class="field"><label>Genre</label><input id="mv_genre" required></div>
        <div class="field"><label>Language</label><input id="mv_lang" required></div>
        <div class="field"><label>Duration (min)</label><input type="number" id="mv_duration" required></div>
        <div class="field"><label>Rating</label><input type="number" step="0.1" id="mv_rating" required></div>
        <div class="field"><label>Release Date</label><input id="mv_release" placeholder="2026-04-01" required></div>
        <div class="field"><label>Poster URL</label><input id="mv_poster" value="https://picsum.photos/seed/${Date.now()}/300/450"></div>
        <div class="field"><label>Description</label><textarea id="mv_desc" rows="3" required></textarea></div>
        <div class="modal-actions"><button type="submit" class="btn primary">Save</button></div>
      </form>
    </div>
  </div>`;
  document.getElementById('closeModal').onclick = ()=> modalRoot.innerHTML = '';
  document.getElementById('movieForm').onsubmit = async (e)=>{
    e.preventDefault();
    try{
      await api('/movies', {method:'POST', body: JSON.stringify({
        title: mv_title.value, genre: mv_genre.value, language: mv_lang.value,
        durationMinutes: parseInt(mv_duration.value), rating: parseFloat(mv_rating.value),
        releaseDate: mv_release.value, posterUrl: mv_poster.value, description: mv_desc.value
      })});
      modalRoot.innerHTML = '';
      showToast('Movie added');
      renderAdminTab('movies');
    }catch(err){ showToast(err.message, true); }
  };
}

function openAddTheaterModal(){
  modalRoot.innerHTML = `
  <div class="modal-overlay" id="overlay">
    <div class="modal">
      <button class="close-x" id="closeModal">&times;</button>
      <h2>Add Theater</h2>
      <form id="theaterForm">
        <div class="field"><label>Name</label><input id="th_name" required></div>
        <div class="field"><label>City</label><input id="th_city" required></div>
        <div class="field"><label>Address</label><input id="th_address" required></div>
        <div class="modal-actions"><button type="submit" class="btn primary">Save</button></div>
      </form>
    </div>
  </div>`;
  document.getElementById('closeModal').onclick = ()=> modalRoot.innerHTML = '';
  document.getElementById('theaterForm').onsubmit = async (e)=>{
    e.preventDefault();
    try{
      await api('/theaters', {method:'POST', body: JSON.stringify({
        name: th_name.value, city: th_city.value, address: th_address.value, totalSeats: 60
      })});
      modalRoot.innerHTML = '';
      showToast('Theater added');
      renderAdminTab('theaters');
    }catch(err){ showToast(err.message, true); }
  };
}

async function openAddShowModal(){
  const movies = await api('/movies');
  const theaters = await api('/theaters');
  modalRoot.innerHTML = `
  <div class="modal-overlay" id="overlay">
    <div class="modal">
      <button class="close-x" id="closeModal">&times;</button>
      <h2>Add Show</h2>
      <form id="showForm">
        <div class="field"><label>Movie</label><select id="sh_movie">${movies.map(m=>`<option value="${m.id}">${m.title}</option>`).join('')}</select></div>
        <div class="field"><label>Theater</label><select id="sh_theater">${theaters.map(t=>`<option value="${t.id}">${t.name} — ${t.city}</option>`).join('')}</select></div>
        <div class="field"><label>Show Time</label><input type="datetime-local" id="sh_time" required></div>
        <div class="field"><label>Ticket Price (₹)</label><input type="number" id="sh_price" value="180" required></div>
        <div class="modal-actions"><button type="submit" class="btn primary">Save</button></div>
      </form>
    </div>
  </div>`;
  document.getElementById('closeModal').onclick = ()=> modalRoot.innerHTML = '';
  document.getElementById('showForm').onsubmit = async (e)=>{
    e.preventDefault();
    try{
      await api('/shows', {method:'POST', body: JSON.stringify({
        movieId: parseInt(sh_movie.value), theaterId: parseInt(sh_theater.value),
        showTime: sh_time.value, ticketPrice: parseFloat(sh_price.value), totalSeats: 60
      })});
      modalRoot.innerHTML = '';
      showToast('Show added');
      renderAdminTab('shows');
    }catch(err){ showToast(err.message, true); }
  };
}

// init
render();
