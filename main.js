// Add an event listener for when the page has finished loading
window.addEventListener("load", function () {
  // Add event listeners to the select game buttons
  document
    .getElementById("select-flags")
    .addEventListener("click", function () {
      loadScript("flags.js");
      this.classList.add("highlighted");
      document
        .getElementById("select-capitals")
        .classList.remove("highlighted");
    });

  document
    .getElementById("select-capitals")
    .addEventListener("click", function () {
      loadScript("capitals.js");
      this.classList.add("highlighted");
      document.getElementById("select-flags").classList.remove("highlighted");
    });

  // Function to dynamically load a script
  function loadScript(scriptName) {
    var script = document.createElement("script");

    script.src = scriptName;

    // Remove the old script tag if it exists
    var oldScript = document.getElementById("game-script");
    if (oldScript) {
      document.body.removeChild(oldScript);
    }

    // Add the new script tag to the body
    script.id = "game-script";
    document.body.appendChild(script);
  }
});
