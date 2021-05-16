document.addEventListener("DOMContentLoaded", ()=>{
  const dialog = document.querySelector(".modal") as HTMLElement;
  if(dialog){
    M.Modal.init(dialog, {});
    M.Modal.getInstance(dialog).open();
  }
})