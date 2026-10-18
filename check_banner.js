async function isBannerVisible() {
    // Send HTTP GET request to decide whether to add the banner
    const endpoint = "https://server.nowa.dev/webpreview/show-banner?projectId=76de7e82-a594-46be-b3e0-699699474313";
    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const shouldDisplayBanner = await response.json();
        return shouldDisplayBanner;
    } catch (error) {
        console.error("Error fetching banner decision:", error);
        return true;
    }
}
window.isBannerVisible = isBannerVisible;
