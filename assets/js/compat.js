/* ================================================== */
/*    Browser incompatible warning
/* ================================================== */
// Browser detection is in a different file because the main one may fail
// because of syntax errors. This JS should be compatible with everything
// and will show the message if an incompatible browser is found by
// feature-checking.

window.addEventListener("load", function (e) {
  function browserIncompatible() {
    // Old browsers don't support some methods from querySelectorAll
    if (
      !("querySelectorAll" in document) ||
      !("forEach" in document.querySelectorAll(".example"))
    ) {
      return true;
    }
  }

  if (browserIncompatible()) {
    document.getElementById("old-browser").style.display = "flex";
  }
});
