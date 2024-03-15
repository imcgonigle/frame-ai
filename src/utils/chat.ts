const input = document.querySelector("#chat-input") as HTMLInputElement;
const chatOutput = document.querySelector("#chat-output") as HTMLDivElement;

const createUserMessageElement = (message: string) => {
  const messageElement = document.createElement("p");
  const usernameSpan = document.createElement("span");
  const br = document.createElement("br");
  usernameSpan.textContent = "User";
  usernameSpan.classList.add("text-blue-500", "username");

  messageElement.textContent = message;
  messageElement.prepend(br);
  messageElement.prepend(usernameSpan);
  messageElement.classList.add("text-right", "mb-4");

  return messageElement;
};

document.querySelector("#save-button")?.addEventListener("click", () => {
  window.electronAPI.saveChat();
});

const createSystemMessageElement = (message: string, id: string) => {
  const converter = new showdown.Converter();
  const html = converter.makeHtml(message);

  const messageElement = document.createElement("div");
  messageElement.classList.add("text-left", "ai-chat-message");
  messageElement.dataset.id = id;
  messageElement.innerHTML = html;

  const usernameSpan = document.createElement("span");
  usernameSpan.textContent = "AI";
  usernameSpan.classList.add("text-pink-500", "username");

  messageElement.prepend(usernameSpan);

  return messageElement;
};

const sendChatMessage = (message: string) => {
  window.electronAPI.sendChatMessage(message);
  const messageElement = createUserMessageElement(message);
  chatOutput.appendChild(messageElement);
  input.value = "";
  chatOutput.scrollTop = chatOutput.scrollHeight;
};

document.querySelector("#chat-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (input.value === "") return;
  sendChatMessage(input.value);
});

const updateExistingMessage = (messageElement: Element, message: string) => {
  const converter = new showdown.Converter();
  const html = converter.makeHtml(message);
  messageElement.innerHTML = html;

  const usernameSpan = document.createElement("span");
  usernameSpan.textContent = "AI";
  usernameSpan.classList.add("text-pink-500", "username");

  messageElement.prepend(usernameSpan);
  chatOutput.scrollTop = chatOutput.scrollHeight;
};

window.electronAPI.onChatResponse(
  (event: any, message: { message: string; id: string }) => {
    const existingMessage = document.querySelector(`[data-id="${message.id}"]`);
    if (existingMessage) {
      updateExistingMessage(existingMessage, message.message);
    } else {
      const messageElement = createSystemMessageElement(
        message.message,
        message.id
      );
      chatOutput.appendChild(messageElement);
      chatOutput.scrollTop = chatOutput.scrollHeight;
    }
  }
);

window.electronAPI.onChatSaved((event: any) => {
  const saveButton = document.querySelector(
    "#save-button"
  ) as HTMLButtonElement;
  saveButton.textContent = "Saved!";
  saveButton.disabled = true;
  setTimeout(() => {
    saveButton.textContent = "Save";
    saveButton.disabled = false;
  }, 2000);
});

window.electronAPI.onLoadChat((event: any, messages: any) => {
  console.log(messages);
  chatOutput.innerHTML = "";
  messages.forEach((message: any) => {
    if (message.role === "user") {
      const messageElement = createUserMessageElement(message.content);
      chatOutput.appendChild(messageElement);
    } else if (message.role === "assistant") {
      const messageElement = createSystemMessageElement(
        message.content,
        message.id
      );
      chatOutput.appendChild(messageElement);
    }
  });
  chatOutput.scrollTop = chatOutput.scrollHeight;
});
