const sidebar = document.querySelector(".sidebar");
const menuButton = document.querySelector(".menu-button");
const navCards = [...document.querySelectorAll(".nav-card")];

menuButton.addEventListener("click", () => {
  const open = sidebar.classList.toggle("is-open");
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.lastElementChild.textContent = open ? "−" : "＋";
});

navCards.forEach((card) => {
  card.addEventListener("click", () => {
    sidebar.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.lastElementChild.textContent = "＋";
  });
});

const sectionObserver = new IntersectionObserver((entries) => {
  const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  navCards.forEach((card) => card.classList.toggle("is-active", card.dataset.section === visible.target.id));
}, { rootMargin: "-25% 0px -55%", threshold: [0, .25, .5] });

document.querySelectorAll("main > section[id]").forEach((section) => sectionObserver.observe(section));
document.querySelector("#year").textContent = new Date().getFullYear();
