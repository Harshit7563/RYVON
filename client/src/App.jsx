import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import ThankYou from "./pages/ThankYou";
import OrderRedirect from "./pages/OrderRedirect";
import TrackOrder from "./pages/TrackOrder";
import Account from "./pages/Account";
import Wishlist from "./pages/Wishlist";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Policy from "./pages/Policy";
import SizeChart from "./pages/SizeChart";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout, { RequireAdmin } from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminProductDetail from "./pages/admin/AdminProductDetail";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminTrackOrder from "./pages/admin/AdminTrackOrder";
import AdminMessages from "./pages/admin/AdminMessages";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/thank-you" element={<ThankYou />} />
        <Route path="/order/:code" element={<OrderRedirect />} />
        <Route path="/track" element={<TrackOrder />} />
        <Route path="/account" element={<Account />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faqs" element={<Policy type="faqs" />} />
        <Route path="/returns" element={<Policy type="returns" />} />
        <Route path="/shipping" element={<Policy type="shipping" />} />
        <Route path="/privacy" element={<Policy type="privacy" />} />
        <Route path="/terms" element={<Policy type="terms" />} />
        <Route path="/cancellation" element={<Policy type="cancellation" />} />
        <Route path="/size-chart" element={<SizeChart />} />
      </Route>

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/:id" element={<AdminProductDetail />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="banners" element={<AdminBanners />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="track-order" element={<AdminTrackOrder />} />
        <Route path="messages" element={<AdminMessages />} />
      </Route>
    </Routes>
  );
}
