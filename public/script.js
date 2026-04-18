const chatWindow = document.getElementById("chatWindow");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const quickRepliesWrapper = document.getElementById("quickRepliesWrapper");

let conversation = [];

// Initialize marked options for styling markdown output appropriately
marked.setOptions({
  breaks: true,
});

window.addEventListener("DOMContentLoaded", () => {
  // Initial greeting from MasAkin
  const greeting = "Hei! Yuk intip isi kulkasmu — ada bahan apa saja hari ini?";
  conversation.push({ role: "model", text: greeting });
  addMessageToUI("model", greeting, true);
});

async function handleSendMessage(text) {
  if (!text) return;

  // Remove welcome banner and quick replies on first message
  const welcomeBanner = document.querySelector(".welcome-banner");
  if (welcomeBanner) welcomeBanner.remove();
  if (quickRepliesWrapper) quickRepliesWrapper.style.display = "none";

  // Show "Input Ulang Bahan" button
  const newIngredientsBtn = document.getElementById("new-ingredients-btn");
  if (newIngredientsBtn) newIngredientsBtn.style.display = "flex";

  // Add user message via UI
  addMessageToUI("user", text);
  conversation.push({ role: "user", text });

  // Show loading
  const typingIndicator = showTypingIndicator();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation }),
    });

    const data = await response.json();
    typingIndicator.remove();

    if (response.ok) {
      const aiText = data.result;
      conversation.push({ role: "model", text: aiText });
      await addMessageToUI("model", aiText, true);
    } else {
      console.error("Error:", data.error);
      await addMessageToUI(
        "model",
        "Waduh, kompornya lagi ngadat nih. Kirim pesannya sekali lagi ya, Chef!",
        true,
      );
      conversation.pop(); // remove failed user message from state so they can retry
    }
  } catch (err) {
    typingIndicator.remove();
    console.error("Fetch error:", err);
    await addMessageToUI(
      "model",
      "Mati lampu! Koneksi ke dapur terputus. Coba jaringan internetnya, ya.",
      true,
    );
    conversation.pop(); // remove failed user message
  }
}

function attachSaveButtons(msgDiv, text) {
  // Automatically find specific recipe headings based on our system prompt format
  const regex = /^(#{1,4})\s*Resep:\s*(.+)$/gim;
  const matches = [...text.matchAll(regex)];

  if (matches.length > 0) {
    // Find matching DOM headings
    const headingEls = Array.from(
      msgDiv.querySelectorAll("h1, h2, h3, h4"),
    ).filter((h) => h.textContent.toLowerCase().includes("resep:"));

    matches.forEach((match, index) => {
      const headingEl = headingEls[index];
      if (!headingEl) return;

      const title = match[2].trim();
      const start = match.index;
      const end = matches[index + 1] ? matches[index + 1].index : text.length;
      const recipeContent = text.substring(start, end).trim();

      // Style the heading directly to contain the button
      headingEl.style.position = "relative";
      headingEl.style.paddingRight = "50px";

      const btn = document.createElement("button");
      btn.className = "save-btn-inline";
      btn.innerHTML = '<i class="fa-regular fa-bookmark"></i>';
      btn.title = "Simpan Resep Ini";
      btn.onclick = () => handleSaveRecipe(btn, recipeContent, title);

      headingEl.appendChild(btn);
    });
  } else if (text.length > 100 && !text.includes("Yuk intip")) {
    // Fallback: if model failed our strict format, save the whole bubble
    const btn = document.createElement("button");
    btn.className = "save-btn";
    btn.innerHTML = '<i class="fa-regular fa-bookmark"></i>';
    btn.title = "Simpan Semua";
    btn.onclick = () => handleSaveRecipe(btn, text);
    // msgDiv.appendChild(btn);
  }
}

async function addMessageToUI(sender, text, isTyping = false) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", sender);
  chatWindow.appendChild(msgDiv);

  // Parse markdown if it's from the model
  if (sender === "model") {
    if (isTyping) {
      const contentDiv = document.createElement("div");
      contentDiv.classList.add("msg-content");
      msgDiv.appendChild(contentDiv);

      let currentText = "";
      const chunkSize = 3;
      const delay = 10;
      for (let i = 0; i < text.length; i += chunkSize) {
        currentText += text.substring(i, i + chunkSize);
        contentDiv.innerHTML = marked.parse(currentText);
        scrollToBottom();
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      attachSaveButtons(msgDiv, text);
    } else {
      const parsed = marked.parse(text);
      msgDiv.innerHTML = `<div class="msg-content">${parsed}</div>`;
      attachSaveButtons(msgDiv, text);
      scrollToBottom();
    }
  } else {
    msgDiv.textContent = text;
    scrollToBottom();
  }
}

function showTypingIndicator() {
  const indicator = document.createElement("div");
  indicator.classList.add("typing-indicator");
  indicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
  chatWindow.appendChild(indicator);
  scrollToBottom();
  return indicator;
}

function scrollToBottom() {
  chatWindow.scrollTo({
    top: chatWindow.scrollHeight,
    behavior: "smooth",
  });
}

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (text) {
    userInput.value = "";
    userInput.style.height = "auto";
    handleSendMessage(text);
  }
});

// Handle Shift+Enter for newline, Enter for submit
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault(); // Prevent default newline
    // Trigger form submit
    chatForm.dispatchEvent(
      new Event("submit", { cancelable: true, bubbles: true }),
    );
  }
});

// Auto-expand textarea
userInput.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
});

// Expose quickSend globally for the onclick handlers
window.quickSend = (text) => {
  userInput.value = text;
  userInput.style.height = "auto";
  userInput.style.height = userInput.scrollHeight + "px";
  userInput.focus();
  // Alternatively, send immediately:
  // userInput.value = '';
  // handleSendMessage(text);
};

// --- Phases 1 & 2 Features ---

function resetConversation() {
  conversation = [];
  const greeting = "Hei! Yuk intip isi kulkasmu — ada bahan apa saja hari ini?";
  conversation.push({ role: "model", text: greeting });

  // Clear chat window except for typing indicator if any
  chatWindow.innerHTML = "";

  // Re-add welcome banner
  const welcomeHtml = `
    <div class="welcome-banner">
      <div class="banner-icon">🍽️</div>
      <h2>Selamat Datang di Dapur!</h2>
      <p>
        Nggak usah pusing mau masak apa. Sebutin aja bahan-bahan yang ada di
        kulkasmu, sekalian porsinya kalau perlu!
      </p>
    </div>
  `;
  chatWindow.insertAdjacentHTML("beforeend", welcomeHtml);

  addMessageToUI("model", greeting, true);

  if (quickRepliesWrapper) quickRepliesWrapper.style.display = "flex";

  const newBtn = document.getElementById("new-ingredients-btn");
  if (newBtn) newBtn.style.display = "none";
}

function getSavedRecipes() {
  const recipes = localStorage.getItem("masakin_recipes");
  return recipes ? JSON.parse(recipes) : [];
}

function saveRecipe(content, givenTitle) {
  let title = givenTitle || "Resep Tersimpan";
  if (!givenTitle) {
    const matchArr = content.split("\\n");
    const findTitle = matchArr.find(
      (line) => line.includes("#") || line.includes("**"),
    );
    if (findTitle) {
      title = findTitle.replace(/[#*]/g, "").trim();
    } else {
      title = content.substring(0, 30) + "...";
    }
  }
  if (title.length > 60) title = title.substring(0, 57) + "...";

  const recipe = {
    id: Date.now().toString() + Math.floor(Math.random() * 100),
    title,
    content,
    savedAt: new Date().toISOString(),
  };

  const recipes = getSavedRecipes();
  recipes.push(recipe);
  localStorage.setItem("masakin_recipes", JSON.stringify(recipes));
  updateSavedBadge();
  renderSavedRecipes();
}

function deleteRecipe(id) {
  let recipes = getSavedRecipes();
  recipes = recipes.filter((r) => r.id !== id);
  localStorage.setItem("masakin_recipes", JSON.stringify(recipes));
  updateSavedBadge();
  renderSavedRecipes();
}

function handleSaveRecipe(btn, content, givenTitle) {
  if (btn.classList.contains("saved")) return;
  saveRecipe(content, givenTitle);
  btn.classList.add("saved");
  btn.innerHTML = '<i class="fa-solid fa-bookmark"></i>';
}

function updateSavedBadge() {
  const recipes = getSavedRecipes();
  const badge = document.getElementById("saved-badge");
  if (badge) badge.textContent = recipes.length;
}

function toggleSavedPanel() {
  document.getElementById("saved-panel").classList.toggle("hidden");
  renderSavedRecipes();
}

function renderSavedRecipes() {
  const list = document.getElementById("saved-list");
  if (!list) return;
  const recipes = getSavedRecipes();
  list.innerHTML = "";

  if (recipes.length === 0) {
    list.innerHTML =
      '<p style="text-align: center; color: #888; margin-top: 2rem;">Belum ada resep yang disimpan.</p>';
    return;
  }

  recipes.reverse().forEach((r) => {
    const card = document.createElement("div");
    card.className = "saved-card";
    const date = new Date(r.savedAt).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    card.innerHTML = `
      <h3>${r.title}</h3>
      <div class="date"><i class="fa-regular fa-calendar" style="margin-right: 4px;"></i> ${date}</div>
      <div class="saved-card-actions">
        <button class="view-btn" onclick="viewRecipe('${r.id}')"><i class="fa-solid fa-eye"></i> Lihat</button>
        <button class="delete-btn" onclick="deleteRecipe('${r.id}')"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
    list.appendChild(card);
  });
}

function viewRecipe(id) {
  const recipes = getSavedRecipes();
  const recipe = recipes.find((r) => r.id === id);
  if (!recipe) return;

  const modalBody = document.getElementById("recipe-modal-body");
  modalBody.innerHTML = marked.parse(recipe.content);

  document.getElementById("recipe-modal").classList.remove("hidden");
}

function closeRecipeModal() {
  document.getElementById("recipe-modal").classList.add("hidden");
}

// Call initially
window.addEventListener("DOMContentLoaded", () => {
  updateSavedBadge();
});
