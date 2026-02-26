import { useState, useEffect } from "react";
import { scrollToTop } from "../data/site";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 1000);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href={scrollToTop.where}
      title={scrollToTop.txt}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg shadow-lg transition-[opacity,transform] duration-300 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <i className={scrollToTop.icon} />
      {scrollToTop.txt}
    </a>
  );
}
