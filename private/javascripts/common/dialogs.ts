document.addEventListener("DOMContentLoaded", function () {
  M.Modal.init(document.querySelectorAll(".modal"), {});
});

function showMessageDialog(title: string, content: HTMLElement) {
  const dialog = document.querySelector<HTMLDivElement>(
    ".messageDialog.modal"
  )!;
  dialog.querySelector(".title")!.textContent = title;
  const contentHolder = dialog.querySelector(".content")!;
  contentHolder.innerHTML = "";
  contentHolder.appendChild(content);
  M.Modal.getInstance(dialog).open();
}
function showConfirmDialog(
  title: string,
  content: HTMLElement,
  positiveButtonLabel: string,
  onPositiveButtonPressed: () => void,
  negativeButtonLabel: string,
  onNegativeButtonPressed: () => void
) {
  const dialog = document.querySelector<HTMLDivElement>(
    ".confirmDialog.modal"
  )!;
  dialog.querySelector(".title")!.textContent = title;
  const contentHolder = dialog.querySelector(".content")!;
  contentHolder.innerHTML = "";
  contentHolder.appendChild(content);
  const positiveButton = dialog.querySelector<HTMLDivElement>(
    ".positiveButton"
  )!;
  positiveButton.textContent = positiveButtonLabel;
  positiveButton.addEventListener("click", onPositiveButtonPressed);
  const negativeButton = dialog.querySelector<HTMLDivElement>(
    ".negativeButton"
  )!;
  negativeButton.textContent = negativeButtonLabel;
  negativeButton.addEventListener("click", onNegativeButtonPressed);
  M.Modal.getInstance(dialog).open();
}
