const fixModals = () => {
    document.querySelectorAll(".modal").forEach((modal) => {
       modal.addEventListener("show.bs.modal", () => {
               // document.querySelector(".modal-backdrop").remove();
       });
    });
};

export default fixModals;
