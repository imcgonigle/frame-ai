const optionsButton = document.querySelector("#options-button");
const optionsDropdown = document.querySelector("#dropdownMenu");
const exitButton = document.getElementById("exit-button");
const loadChatButton = document.getElementById("load-chat-button");

exitButton.addEventListener("click", () => {
  window.electronAPI.exit();
});

loadChatButton.addEventListener("click", () => {
  optionsDropdown.classList.add("hidden");
  window.electronAPI.loadChat();
});

optionsButton.addEventListener("click", function () {
  optionsDropdown.classList.toggle("hidden");
});
