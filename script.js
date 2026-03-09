const STORAGE_KEY = "pollpulse_polls";
const USERS_KEY = "pollpulse_users";
const CURRENT_USER_KEY = "pollpulse_current_user";
function loadPolls() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
function savePolls(polls) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));
}
function loadUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function getCurrentUser() {
  return localStorage.getItem(CURRENT_USER_KEY);
}
function setCurrentUser(username) {
  if (username) {
    localStorage.setItem(CURRENT_USER_KEY, username);
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}
let polls = loadPolls();
const createPollForm = document.getElementById("createPollForm");
const questionInput = document.getElementById("questionInput");
const optionsContainer = document.getElementById("optionsContainer");
const addOptionBtn = document.getElementById("addOptionBtn");
const pollsContainer = document.getElementById("pollsContainer");
const POLL_LIFETIME_MINUTES = 200;
addOptionBtn.addEventListener("click", () => {
  const index = optionsContainer.querySelectorAll(".option-input").length + 1;
  const label = document.createElement("label");
  label.innerHTML = `
    Option ${index}
    <input type="text" class="option-input" required />
  `;
  optionsContainer.appendChild(label);
});
const loginForm = document.getElementById("loginForm");
const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");
const authStatus = document.getElementById("authStatus");
const signupForm = document.getElementById("signupForm");
const signupUsername = document.getElementById("signupUsername");
const signupPassword = document.getElementById("signupPassword");
let users =loadUsers();
signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = signupUsername.value.trim();
  const password = signupPassword.value.trim();
   if (!username || !password) {
    authStatus.textContent = "Please fill all fields.";
    return;
  }
   if (users.some((u) => u.username === username)) {
    authStatus.textContent = "Username already exists.";
    return;
  }
  users.push({ username, password }); 
  saveUsers(users);
  authStatus.textContent = "Account created. You can now log in.";
  signupForm.reset();
});
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = loginUsername.value.trim();
  const password = loginPassword.value.trim();
  const user = users.find(
    (u) => u.username === username && u.password === password
  );
  if (!user) {
    authStatus.textContent = "Invalid username or password.";
    return;
  }
  setCurrentUser(user.username);
  authStatus.textContent = "Logged in as " + user.username;
});
createPollForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const question = questionInput.value.trim();
  const optionInputs = Array.from(
    optionsContainer.querySelectorAll(".option-input")
  );
  const options = optionInputs
    .map((input) => input.value.trim())
    .filter((val) => val.length > 0);
  if (!question || options.length < 2) {
    alert("Please enter a question and at least two options.");
    return;
  }
  const now = Date.now();
  const expiresAt = now + POLL_LIFETIME_MINUTES * 60 * 1000; 
  const newPoll = {
    id: Date.now().toString(),
    question,
    options: options.map((text) => ({ text, votes: 0 })),
    voters: [],
    createdAt: now,
    expiresAt 
  };
  polls.unshift(newPoll);
  savePolls(polls);
  renderPolls();
  questionInput.value = "";
  optionsContainer.innerHTML = "";
  for (let i = 1; i <= 2; i++) {
    const label = document.createElement("label");
    label.innerHTML = `
      Option ${i}
      <input type="text" class="option-input" required />
    `;
    optionsContainer.appendChild(label);
  }
});
const BROWSER_ID_KEY = "pollpulse_browser_id";
function getBrowserId() {
  let id = localStorage.getItem(BROWSER_ID_KEY);
  if (!id) {
    id = "browser_" + Math.random().toString(36).slice(2);
    localStorage.setItem(BROWSER_ID_KEY, id);
  }
  return id;
}
const browserId = getBrowserId();
function isPollExpired(poll) {
  return Date.now() >= poll.expiresAt;
}
function handleVote(pollId, optionIndex) {
  const poll = polls.find((p) => p.id === pollId);
  if (!poll) return;

  if (isPollExpired(poll)) {
    alert("This poll has expired.");
    return;
  }
  if (poll.voters && poll.voters.includes(browserId)) {
    alert("You have already voted on this poll.");
    return;
  }
  if(!poll.vvoters){
    poll.voters = [];
  }
  poll.options[optionIndex].votes += 1;
  poll.voters.push(browserId);
  savePolls(polls);
  renderPolls();
}
function handleDeletePoll(pollId) {
  const confirmDelete = confirm("Delete this poll? This cannot be undone.");
  if (!confirmDelete) return;
  polls = polls.filter((p) => p.id !== pollId); 
  savePolls(polls);
  renderPolls();
}
function formatRemaining(ms) {
  if (ms <= 0) return "Expired";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${mm}:${ss}`;
}
function renderPolls() {
  pollsContainer.innerHTML = "";
  if (polls.length === 0) {
    pollsContainer.innerHTML = `<p>No polls yet. Create one above!</p>`;
    return;
  }
  polls.forEach((poll) => {
    const card = document.createElement("div");
    card.className = "poll-card";
    const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
    const userVoted = poll.voters.includes(browserId);
    const expired = isPollExpired(poll);
    const remainingMs = poll.expiresAt - Date.now();
    const questionEl = document.createElement("div");
    questionEl.className = "poll-question";
    questionEl.textContent = poll.question;
    card.appendChild(questionEl);
    const expiryEl = document.createElement("div");
    expiryEl.style.fontSize = "14px";
    expiryEl.style.color = "#520e39";
    expiryEl.dataset.pollId = poll.id; 
    expiryEl.textContent = expired
      ? "Status: Expired"
      : `Time left: ${formatRemaining(remainingMs)}`;
    card.appendChild(expiryEl);
    const ul = document.createElement("ul");
    ul.className = "options-list";
    poll.options.forEach((opt, index) => {
    const li = document.createElement("li");
    li.className = "option-item";
    const btn = document.createElement("button");
    btn.className = "option-button";
    const percent = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
    const bar = document.createElement("div");
    bar.className = "progress-bar";
    bar.style.width = percent + "%";
    btn.appendChild(bar);
    const labelSpan = document.createElement("span");
    labelSpan.textContent = opt.text;
    btn.appendChild(labelSpan);
    const meta = document.createElement("span");
    meta.className = "option-meta";
    meta.textContent = `${opt.votes} vote(s) • ${percent}%`;
    btn.appendChild(meta);
    if (!userVoted && !expired) {
      btn.addEventListener("click", () => handleVote(poll.id, index));
    } else {
      btn.style.cursor = "default";
      if (expired || userVoted) {
        btn.style.opacity = "0.7";
      }
    }
    li.appendChild(btn);
    ul.appendChild(li);
  });
    card.appendChild(ul);
    const footer = document.createElement("div");
    footer.style.display = "flex";
    footer.style.justifyContent = "space-between";
    footer.style.alignItems = "center";
    footer.style.marginTop = "8px";
    const votesInfo = document.createElement("span");
    if (totalVotes > 0) {
      votesInfo.textContent = `Total votes: ${totalVotes}`;
    } else {
      votesInfo.textContent = expired ? "No votes • Poll expired" : "Be the first to vote!";
    }
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.style.padding = "4px 10px";
    deleteBtn.style.borderRadius = "999px";
    deleteBtn.style.border = "1.5px solid #4c5013";
    deleteBtn.style.background = "transparent";
    deleteBtn.style.color = "#f11414";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.style.fontSize = "14px Bold";
    deleteBtn.addEventListener("click", () => handleDeletePoll(poll.id));
    footer.appendChild(votesInfo);
    footer.appendChild(deleteBtn);
    card.appendChild(footer);
  if (userVoted) {
      const votedLabel = document.createElement("div");
      votedLabel.className = "voted-label";
      votedLabel.textContent = "You have voted in this poll.";
      card.appendChild(votedLabel);
    }
    const shareWrapper = document.createElement("div");
    shareWrapper.style.marginTop = "8px";
    shareWrapper.style.display = "flex";
    shareWrapper.style.justifyContent = "space-between";
    shareWrapper.style.alignItems = "center";
    shareWrapper.style.fontSize = "14px";
    shareWrapper.style.color = "#dc4a10";
    const url = `${window.location.origin}${window.location.pathname}?poll=${poll.id}`;
    const linkText = document.createElement("span");
    linkText.textContent = "Shareable link";
    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copy link";
    copyBtn.style.padding = "4px 10px";
    copyBtn.style.borderRadius = "999px";
    copyBtn.style.border = "1.4px solid #0a2c3b";
    copyBtn.style.background = "transparent";
    copyBtn.style.color = "#800e82";
    copyBtn.style.cursor = "pointer";
    copyBtn.style.fontSize = "12px";
    copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(url); 
      const oldText = copyBtn.textContent;
      copyBtn.textContent = "Copied!";
      setTimeout(() => {
        copyBtn.textContent = oldText;
      }, 1500);
    } catch (err) {
      alert("Unable to copy. You can copy this link: " + url);
    }
  });
  shareWrapper.appendChild(linkText);
  shareWrapper.appendChild(copyBtn);
  card.appendChild(shareWrapper);
  pollsContainer.appendChild(card);
  });
}
setInterval(() => {
  const now = Date.now();
  const expiryEls = pollsContainer.querySelectorAll("[data-poll-id]");
  expiryEls.forEach((el) => {
    const pollId = el.dataset.pollId;
    const poll = polls.find((p) => p.id === pollId);
    if (!poll) return;
    if (now >= poll.expiresAt) {
      el.textContent = "Status: Expired";
    } else {
      const remainingMs = poll.expiresAt - now;
      el.textContent = `Time left: ${formatRemaining(remainingMs)}`;
    }
  });
}, 1000);
function focusSharedPoll() {
  const params = new URLSearchParams(window.location.search);
  const sharedId = params.get("poll");
  if (!sharedId) return;
  const cards = Array.from(pollsContainer.getElementsByClassName("poll-card"));
  const target = cards.find((card) => {
    const expiryEl = card.querySelector("[data-poll-id]");
    return expiryEl && expiryEl.dataset.pollId === sharedId;
  });
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.style.boxShadow = "0 0 0 2px #198f2b";
    setTimeout(() => {
      target.style.boxShadow = "";
    }, 2000);
  }
}
renderPolls();
window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY) {
    polls = loadPolls();
    renderPolls();
    focusSharedPoll && focusSharedPoll();
  }
});
focusSharedPoll();

