const body = document.body;
const toggle = document.querySelector(".menu-toggle");

// MENU
toggle.onclick = (e) => {
  e.stopPropagation();
  body.classList.toggle("menu-open");
};

document.addEventListener("click", (e) => {
  if (!e.target.closest(".nav")) {
    body.classList.remove("menu-open");
  }
});

// LIGHTBOX
const images = document.querySelectorAll(".art img");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");

images.forEach(img=>{
  img.onclick=()=>{
    lightbox.style.display="flex";
    lightboxImg.src=img.dataset.full;
  };
});

document.getElementById("close").onclick=()=>{
  lightbox.style.display="none";
};

lightbox.onclick=(e)=>{
  if(e.target===lightbox) lightbox.style.display="none";
};

// SCROLL
const toTop=document.getElementById("toTop");

window.onscroll = () => {
  if (window.scrollY > 300) {
    toTop.classList.add("visible");
  } else {
    toTop.classList.remove("visible");
  }
};

toTop.onclick=()=>{
  window.scrollTo({top:0,behavior:"smooth"});
};