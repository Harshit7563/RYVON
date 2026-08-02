import { Outlet } from "react-router-dom";
import Header, { MobileNav } from "./Header";
import Footer from "./Footer";
import LoginModal from "./LoginModal";
import ScrollToTop from "./ScrollToTop";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Header />
      <main className="flex-1 pb-mobile-nav">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
      <LoginModal />
    </div>
  );
}
