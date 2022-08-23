export function redraw() {
    window.dispatchEvent(new Event("resize"));
}
