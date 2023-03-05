document.addEventListener("DOMContentLoaded", function () {
  M.Modal.init(document.querySelectorAll(".modal"), {});
});

function showMessageDialog(
  title: string,
  content: HTMLElement,
  onClose: () => void = () => {}
) {
  const dialog = document.querySelector<HTMLDivElement>(
    ".messageDialog.modal"
  )!;
  dialog.querySelector(".title")!.textContent = title;
  const contentHolder = dialog.querySelector(".content")!;
  contentHolder.innerHTML = "";
  contentHolder.appendChild(content);
  const instance = M.Modal.getInstance(dialog);
  instance.options.onCloseEnd = () => onClose();
  instance.open();
}
function showConfirmDialog(
  title: string,
  content: HTMLElement,
  positiveButton: { label: string; classes?: string[]; onPresed?: () => void },
  negativeButton: { label: string; classes?: string[]; onPresed?: () => void }
) {
  const dialog = document.querySelector<HTMLDivElement>(
    ".confirmDialog.modal"
  )!;
  dialog.querySelector(".title")!.textContent = title;
  const contentHolder = dialog.querySelector(".content")!;
  contentHolder.innerHTML = "";
  contentHolder.appendChild(content);
  const positive = dialog.querySelector<HTMLDivElement>(".positiveButton")!;
  positive.classList.add(
    ...(positiveButton.classes ?? ["waves-effect", "waves-light", "btn"])
  );
  positive.textContent = positiveButton.label;
  if (positiveButton.onPresed !== undefined) {
    positive.addEventListener("click", positiveButton.onPresed);
  }
  const negative = dialog.querySelector<HTMLDivElement>(".negativeButton")!;
  negative.classList.add(
    ...(negativeButton.classes ?? ["waves-effect", "waves-light", "btn", "red"])
  );
  negative.textContent = negativeButton.label;
  if (negativeButton.onPresed !== undefined) {
    negative.addEventListener("click", negativeButton.onPresed);
  }
  M.Modal.getInstance(dialog).open();
}
