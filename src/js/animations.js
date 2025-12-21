const navbar = document.getElementById("navbar");

window.addEventListener("scroll", () => {
  if (window.scrollY > 40) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

  const words = [
    "Single-Page Experiences",
    "Modern Web Interfaces",
    "Fast & Scalable UI",
    "Elegant Digital Products"
  ];

  const text = document.getElementById("rotating-text");
  let index = 0;

  setInterval(() => {
    text.classList.add("opacity-0", "translate-y-2");

    setTimeout(() => {
      index = (index + 1) % words.length;
      text.textContent = words[index];
      text.classList.remove("opacity-0", "translate-y-2");
    }, 400);
  }, 2500);