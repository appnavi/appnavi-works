const guestUserIdInput =
  document.querySelector<HTMLInputElement>("#guestUserId")!;
guestUserIdInput.addEventListener("click", () => {
  guestUserIdInput.select();
});
const passwordInput = document.querySelector<HTMLInputElement>("#password")!;
passwordInput.addEventListener("click", () => {
  passwordInput.select();
});
