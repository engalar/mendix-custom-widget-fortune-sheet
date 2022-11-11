export function redraw() {
    // first trigger render
    window.dispatchEvent(new Event("resize"));
    setTimeout(() => {
        // later trigger layout
        window.dispatchEvent(new Event("resize"));
    }, 0);
}
