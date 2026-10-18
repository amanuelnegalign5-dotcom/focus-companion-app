window.addEventListener("load", async function () {
    // Function to check if a specific tag with a given attribute exists
    function tagExists(tagName, attribute, value) {
        return Array.from(document.getElementsByTagName(tagName)).some(
            (tag) => tag.getAttribute(attribute) === value
        );
    }

    // Function to add the banner
    function addBanner() {
        const head = document.head;

        // Preconnect to Google Fonts
        if (!tagExists("link", "href", "https://fonts.googleapis.com")) {
            const preconnect1 = document.createElement("link");
            preconnect1.rel = "preconnect";
            preconnect1.href = "https://fonts.googleapis.com";
            head.appendChild(preconnect1);
        }

        if (!tagExists("link", "href", "https://fonts.gstatic.com")) {
            const preconnect2 = document.createElement("link");
            preconnect2.rel = "preconnect";
            preconnect2.href = "https://fonts.gstatic.com";
            preconnect2.setAttribute("crossorigin", "");
            head.appendChild(preconnect2);
        }

        // Add Google Fonts stylesheet
        if (
            !tagExists(
                "link",
                "href",
                "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
            )
        ) {
            const fontLink = document.createElement("link");
            fontLink.rel = "stylesheet";
            fontLink.href =
                "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap";
            head.appendChild(fontLink);
        }

        // Add title
        if (!tagExists("title", "id", "app-title")) {
            const title = document.createElement("title");
            title.id = "app-title";
            title.textContent = "focusmind";
            head.appendChild(title);
        }

        // Add custom styles
        if (!tagExists("style", "id", "banner-styles")) {
            const style = document.createElement("style");
            style.id = "banner-styles";
            style.textContent = `
          .banner {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-family: "Inter", serif;
            font-optical-sizing: auto;
            font-weight: 400;
            font-style: normal;
            font-size: 10.5pt;
            color: white;
            background-color: #141920;
            border-radius: 9pt;
            padding: 8px;
            position: absolute;

            z-index: 9999;
            margin: 0;
        }
        
        a {
            color: white;
            text-decoration: none;
        }

        .bottom-right {
            bottom: 15px;
            right: 20px;
        }

        .top-right {
            top: 15px;
            right: 20px;
        }

        .top-left {
            top: 15px;
            left: 20px;
        }

        .bottom-left {
            bottom: 15px;
            left: 20px;
        }
        `;
            head.appendChild(style);
        }

        // Add the banner to the <body> if not already present
        if (!document.querySelector(".banner")) {
            const banner = document.createElement("div");
            banner.className = "banner bottom-right";
            banner.innerHTML = `
        <img src="favicon.png" width="20">
        <a href="https://nowa.dev">Built with Nowa</a>
        `;
            document.body.insertBefore(banner, document.body.firstChild);
        }
    }

    // Check if the banner should be displayed
    const shouldDisplayBanner = await window.isBannerVisible();
    if (shouldDisplayBanner) {
        addBanner();
    }
});