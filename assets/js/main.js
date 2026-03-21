"use strict";

function setupScrollToTopButton() {
  // The scroll to top button will be shown once the page has already
  // been scrolled (either on load, or on scroll).
  const minScroll = 1000;
  const scrollBtn = document.getElementById("scroll-to-top");
  function toggleScrollToTop() {
    if (
      document.documentElement.scrollTop > minScroll ||
      window.pageYOffset > minScroll ||
      document.body.scrollTop > minScroll
    ) {
      scrollBtn.style.display = "block";
    } else {
      scrollBtn.style.display = "none";
    }
  }
  window.onscroll = toggleScrollToTop;
  toggleScrollToTop();
}

function setupLazyLoading() {
  const observer = lozad();
  observer.observe();
}

function setupPopUp() {
  $(window).on("hashchange", function () {
    if (location.href.indexOf("#item") < 0) {
      $.magnificPopup.close();
    }
  });

  function onOpenPopup() {
    location.href = location.href.split("#")[0] + "#item";
  }

  function onClosePopup() {
    if (location.hash) {
      history.go(-1);
    }
  }

  // HTML pop-ups
  $(".open-popup-inline").magnificPopup({
    type: "inline",
    midClick: true,
    fixedContentPos: false,
    fixedBgPos: true,
    callbacks: {
      open: onOpenPopup,
      close: onClosePopup,
    },
  });
  // Simple pop-ups
  $(".open-popup-standalone").magnificPopup({
    type: "image",
    midClick: true,
    closeOnContentClick: true,
    fixedContentPos: false,
    fixedBgPos: true,
    callbacks: {
      open: onOpenPopup,
      close: onClosePopup,
    },
  });
}

function isInternalURL(url) {
  if (url.startsWith("#") || url.startsWith("/")) {
    return true;
  }

  const curHostname = location.hostname;
  const itemHostname = new URL(url).hostname;
  if (curHostname !== itemHostname) {
    return false;
  }

  return true;
}

function getURLHash(url) {
  if (url.startsWith("#")) {
    return url;
  }

  if (url.startsWith("/")) {
    url = location + url;
  }

  return new URL(url).hash;
}

function setupScrollAnimation() {
  let htmlAndBody = $("html, body");
  $("nav a, .page-scroll").on("click", function () {
    // Making sure the clicked hyperlink is inside this website
    const url = this.getAttribute("href");
    if (!url) {
      return true;
    }
    if (!isInternalURL(url)) {
      return true;
    }

    const hash = getURLHash(url);
    let target = $(hash);
    target = target.length ? target : $("[name=" + hash.slice(1) + "]");
    if (target.length) {
      htmlAndBody.animate(
        {
          scrollTop: target.offset().top - 50,
        },
        750,
      );

      return false; // stop propagation
    }
  });
}

function setupFormValidation() {
  document.getElementById("contact-submit").addEventListener("click", (e) => {
    // Stop the form from being submitted
    e.preventDefault();

    // Making sure the fields are somewhat correct.
    const errColor = "#b10b1f";
    const okColor = "rgba(236,239,241,.07)";
    const subject = document.getElementById("subject");
    const message = document.getElementById("message");
    const helpMsg = document.getElementById("contact-help");

    if (subject.value.length == 0) {
      subject.style.borderColor = errColor;
      return;
    }
    subject.style.borderColor = okColor;

    if (message.value.length == 0) {
      message.style.borderColor = errColor;
      return;
    }
    message.style.borderColor = okColor;

    // Now opening their mail client with the provided data.
    let uri =
      "mailto:maremotocafe@hotmail.com?subject=" +
      encodeURIComponent(subject.value) +
      "&body=" +
      encodeURIComponent(message.value);
    window.open(uri, "_blank");

    // Show a message with help in case it didn't work.
    helpMsg.style.display = "block";
  });
}

// Things that have to be loaded at the end
window.addEventListener("load", (e) => {
  console.log("Setting up scroll to top button");
  setupScrollToTopButton();

  console.log("Setting up lazy loading");
  setupLazyLoading();

  console.log("Setting up pop up");
  setupPopUp();

  console.log("Setting up scroll animation");
  setupScrollAnimation();

  console.log("Setting up form validation");
  setupFormValidation();
});
