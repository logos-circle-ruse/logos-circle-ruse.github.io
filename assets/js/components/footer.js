const footerHTML = `

  <div class="inner">
    <ul class="icons">
      <li>
        <a href="https://github.com/logos-circle-ruse" target="_blank" class="icon brands alt fa-github">
          <span class="label">GitHub</span>
        </a>
      </li>
      <li>
        <a href="mailto:nikolay@logos.co" class="icon solid alt fa-envelope">
          <span class="label">Email</span>
        </a>
      </li>
    </ul>
  </div>

`;

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("footer").innerHTML = footerHTML;
});